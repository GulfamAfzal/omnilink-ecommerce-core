import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'omnilink-super-secret-key-2026');

export async function POST(request) {
  let pool;
  try {
    const { email, password } = await request.json();
    
    // Connect to Azure SQL Cloud
    pool = await getSqlConnection();

    // 1. Fetch user by email - Advanced DB: Using @parameter to prevent SQL Injection
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT user_id, username, password_hash, first_name, user_type, region_id 
        FROM USERS 
        WHERE email = @email
      `);

    // In Azure SQL 'mssql' driver, results are in recordset
    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Identity not found in Cloud Core" }, { status: 404 });
    }

    const user = result.recordset[0];
    const userId = user.user_id;
    const username = user.username;
    const storedHash = user.password_hash;
    const firstName = user.first_name;
    const userType = user.user_type;
    const regionId = user.region_id;

    // 2. Security Check: Verify Bcrypt Hash
    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. API Composition: Sync Identity to MongoDB Session
    // Generate secure token using jose
    const token = await new SignJWT({ userId, userType })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Store in MongoDB User_Sessions
    const mongoClient = await clientPromise;
    const db = mongoClient.db("OMS_Product_Catalog");
    
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await db.collection("User_Sessions").insertOne({
      session_token: token,
      user_id: userId,
      login_time: new Date(),
      expiry: expiry,
      device_info: request.headers.get('user-agent') || 'Unknown'
    });

    // 4. Set HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      user: { id: userId, username, firstName, userType, regionId: regionId?.toString() || '1' }
    });

    response.cookies.set({
      name: 'oms_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;

  } catch (error) {
    console.error("Cloud Authentication Error:", error);
    return NextResponse.json({ 
        error: "Authentication failed", 
        details: error.message 
    }, { status: 500 });
  }
}
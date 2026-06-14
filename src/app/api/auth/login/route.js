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

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    // Connect to Azure SQL Cloud
    pool = await getSqlConnection();

    // 1. Fetch user by email — parameterized query prevents SQL injection
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT user_id, username, password_hash, first_name, user_type, region_id 
        FROM USERS 
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
    }

    const user = result.recordset[0];
    const userId = user.user_id;
    const username = user.username;
    const storedHash = user.password_hash;
    const firstName = user.first_name;
    const userType = user.user_type;
    const regionId = user.region_id;

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect password. Please try again." }, { status: 401 });
    }

    // 3. Generate JWT session token
    const token = await new SignJWT({ userId, userType, regionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // 4. Sync session to MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db("OMS_Product_Catalog");

    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await db.collection("User_Sessions").insertOne({
      session_token: token,
      user_id: userId,
      region_id: regionId,
      login_time: new Date(),
      expiry: expiry,
      device_info: request.headers.get('user-agent') || 'Unknown'
    });

    // 5. Set HTTP-Only cookies (session + region for fast checkout lookups)
    const response = NextResponse.json({
      success: true,
      user: { id: userId, username, firstName, userType, regionId: regionId?.toString() || '1' }
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 hours
    };

    response.cookies.set({ name: 'oms_session', value: token, ...cookieOptions });
    response.cookies.set({ name: 'oms_region', value: (regionId || 1).toString(), ...cookieOptions });

    return response;

  } catch (error) {
    console.error("Authentication Error:", error);
    return NextResponse.json({
      error: "Unable to connect to the authentication service. Please try again shortly.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

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
        SELECT user_id, username, password_hash, first_name, user_type 
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

    // 2. Security Check: Verify Bcrypt Hash
    const isMatch = await bcrypt.compare(password, storedHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Success response for the Frontend session management
    return NextResponse.json({
      success: true,
      user: { 
        id: userId, 
        username, 
        firstName, 
        type: userType 
      }
    });

  } catch (error) {
    console.error("Cloud Authentication Error:", error);
    return NextResponse.json({ 
        error: "Authentication failed", 
        details: error.message 
    }, { status: 500 });
  }
  // Connection pooling handles the lifecycle, no need for manual close here
}
import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  let pool;
  try {
    const body = await request.json();
    const { username, email, password, firstName, lastName, contact, userType = 'Customer', regionId = 1 } = body;

    pool = await getSqlConnection();

    // --- 1. ENFORCE GLOBAL ADMIN CONSTRAINT ---
    if (userType === 'Admin') {
      const adminCheck = await pool.request()
        .query(`SELECT COUNT(*) as count FROM USERS WHERE user_type = 'Admin'`);
      if (adminCheck.recordset[0].count >= 2) {
        return NextResponse.json({
          error: "The maximum number of administrators has been reached. Contact your system owner."
        }, { status: 403 });
      }
    }

    // --- 2. ENFORCE REGIONAL MANAGER CONSTRAINT ---
    if (userType === 'Manager') {
      const managerCheck = await pool.request()
        .input('regionId', sql.Int, regionId)
        .query(`SELECT COUNT(*) as count FROM USERS WHERE user_type = 'Manager' AND region_id = @regionId`);
      if (managerCheck.recordset[0].count >= 3) {
        return NextResponse.json({
          error: `This region already has the maximum number of managers. Please contact your administrator.`
        }, { status: 403 });
      }
    }

    // --- 3. CHECK FOR DUPLICATE EMAIL/USERNAME ---
    const dupCheck = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('username', sql.NVarChar, username)
      .query(`SELECT email, username FROM USERS WHERE email = @email OR username = @username`);

    if (dupCheck.recordset.length > 0) {
      const dup = dupCheck.recordset[0];
      if (dup.email === email) {
        return NextResponse.json({
          error: "An account with this email address already exists. Please log in or use a different email."
        }, { status: 409 });
      }
      if (dup.username === username) {
        return NextResponse.json({
          error: "This username is already taken. Please choose a different username."
        }, { status: 409 });
      }
    }

    // --- 4. PROCEED WITH REGISTRATION ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roleMap = { 'Customer': 4, 'Admin': 1, 'Manager': 2 };
    const roleId = roleMap[userType] || 4;

    await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('fname', sql.NVarChar, firstName)
      .input('lname', sql.NVarChar, lastName)
      .input('contact', sql.NVarChar, contact)
      .input('utype', sql.NVarChar, userType)
      .input('roleId', sql.Int, roleId)
      .input('regionId', sql.Int, regionId)
      .query(`
        INSERT INTO USERS (
          username, email, password_hash, first_name, last_name,
          contact_number, user_type, role_id, region_id
        ) VALUES (
          @username, @email, @password, @fname, @lname,
          @contact, @utype, @roleId, @regionId
        )
      `);

    return NextResponse.json({
      success: true,
      message: "Your account has been created successfully. You can now log in."
    });

  } catch (error) {
    console.error("Registration Error:", error);

    // Handle SQL duplicate key constraint as fallback
    if (error.message?.includes('Violation of UNIQUE') || error.message?.includes('duplicate key')) {
      return NextResponse.json({
        error: "An account with this email or username already exists. Please try logging in instead."
      }, { status: 409 });
    }

    return NextResponse.json({
      error: "Registration could not be completed. Please try again shortly.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
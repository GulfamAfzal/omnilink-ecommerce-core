import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import sql from 'mssql';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  let pool;
  try {
    const body = await request.json();
    const { username, email, password, firstName, lastName, contact, userType, regionId } = body;

    pool = await getSqlConnection();

    // --- 1. ENFORCE GLOBAL ADMIN CONSTRAINT (Business Logic in Application Layer) ---
    if (userType === 'Admin') {
      const adminCheck = await pool.request()
        .query(`SELECT COUNT(*) as count FROM USERS WHERE user_type = 'Admin'`);
      
      if (adminCheck.recordset[0].count >= 2) {
        return NextResponse.json({ error: "Constraint Violated: System already has 2 Global Admins." }, { status: 403 });
      }
    }

    // --- 2. ENFORCE REGIONAL MANAGER CONSTRAINT ---
    if (userType === 'Manager') {
      const managerCheck = await pool.request()
        .input('regionId', sql.Int, regionId)
        .query(`SELECT COUNT(*) as count FROM USERS WHERE user_type = 'Manager' AND region_id = @regionId`);
      
      if (managerCheck.recordset[0].count >= 3) {
        return NextResponse.json({ error: `Constraint Violated: Region ${regionId} already has 3 Managers.` }, { status: 403 });
      }
    }

    // --- 3. PROCEED WITH REGISTRATION ---
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Map UserType to RoleID (Matching your ROLES table data: 1:Super_Admin, 2:Manager, 4:Customer)
    const roleMap = { 'Customer': 4, 'Admin': 1, 'Manager': 2 };
    const roleId = roleMap[userType] || 4;

    // T-SQL Insert: Note we don't need a sequence for user_id because we set it as IDENTITY in the DDL
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
      message: "Identity created successfully in Azure SQL Cloud." 
    });

  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ 
      error: "Cloud Database Error", 
      details: error.message 
    }, { status: 500 });
  }
  // Connection pooling in 'mssql' handles closing; we don't need pool.close() here.
}
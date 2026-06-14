import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import sql from 'mssql';

export const dynamic = 'force-dynamic';

const sqlConfig = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  authentication: { type: 'azure-active-directory-default', options: {} },
  options: { encrypt: true, trustServerCertificate: false }
};

export async function GET(request) {
  try {
    const sessionToken = request.cookies.get('oms_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // Get session
    const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Connect to Azure SQL to get profile
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('userId', sql.Int, session.user_id)
      .query(`
        SELECT u.user_id, u.username, u.email, u.first_name, u.last_name, 
               u.contact_number, u.user_type, u.currency, u.region_id, r.region_name
        FROM USERS u
        LEFT JOIN REGIONS r ON u.region_id = r.region_id
        WHERE u.user_id = @userId
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "User profile not found in ledger" }, { status: 404 });
    }

    const userRow = result.recordset[0];

    // Convert SQL types to simple JSON primitive types
    const profile = {
      user_id: Number(userRow.user_id),
      username: String(userRow.username || ''),
      email: String(userRow.email || ''),
      first_name: String(userRow.first_name || ''),
      last_name: String(userRow.last_name || ''),
      contact_number: String(userRow.contact_number || ''),
      user_type: String(userRow.user_type || 'Customer'),
      currency: String(userRow.currency || 'USD'),
      region_id: Number(userRow.region_id),
      region_name: String(userRow.region_name || 'Global Hub')
    };

    return NextResponse.json({ success: true, profile });

  } catch (error) {
    console.error("❌ Profile GET Error:", error);
    return NextResponse.json({ error: "Failed to assemble profile ledger", details: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const sessionToken = request.cookies.get('oms_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { first_name, last_name, contact_number, currency } = body;

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // Get session
    const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Connect to Azure SQL to update profile
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .input('userId', sql.Int, session.user_id)
      .input('firstName', sql.NVarChar(50), first_name || '')
      .input('lastName', sql.NVarChar(50), last_name || '')
      .input('contactNum', sql.NVarChar(20), contact_number || '')
      .input('currency', sql.NVarChar(3), currency || 'USD')
      .query(`
        UPDATE USERS 
        SET first_name = @firstName, 
            last_name = @lastName, 
            contact_number = @contactNum, 
            currency = @currency
        WHERE user_id = @userId
      `);

    return NextResponse.json({ success: true, message: "Profile updated successfully" });

  } catch (error) {
    console.error("❌ Profile PUT Error:", error);
    return NextResponse.json({ error: "Failed to update profile", details: String(error) }, { status: 500 });
  }
}

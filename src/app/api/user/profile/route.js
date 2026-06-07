import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';
import sql from 'mssql';

export async function GET(request) {
  try {
    // 1. Get Session Cookie
    const sessionToken = request.cookies.get('oms_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized: No session token found" }, { status: 401 });
    }

    // 2. Verify Session in MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db("OMS_Product_Catalog");
    const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized: Invalid or expired session" }, { status: 401 });
    }

    const userId = session.user_id;

    // 3. Fetch Full Profile from Azure SQL
    const pool = await getSqlConnection();
    const result = await pool.request()
      .input('id', sql.Int, userId)
      .query(`
        SELECT u.user_id, u.username, u.email, u.first_name, u.last_name, u.contact_number, u.user_type, 
               r.role_name, r.permissions, 
               reg.region_name, reg.currency
        FROM USERS u
        LEFT JOIN ROLES r ON u.role_id = r.role_id
        LEFT JOIN REGIONS reg ON u.region_id = reg.region_id
        WHERE u.user_id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Profile not found in Identity Core" }, { status: 404 });
    }

    const userProfile = result.recordset[0];

    return NextResponse.json({ success: true, profile: userProfile });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
}

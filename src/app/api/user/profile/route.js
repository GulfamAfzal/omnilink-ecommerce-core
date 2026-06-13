import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';
import sql from 'mssql';

export async function GET(request) {
  try {
    // 1. Validate session cookie
    const sessionToken = request.cookies.get('oms_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "You must be logged in to view your profile." }, { status: 401 });
    }

    // 2. Verify session in MongoDB
    const mongoClient = await clientPromise;
    const db = mongoClient.db("OMS_Product_Catalog");
    const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });

    if (!session) {
      return NextResponse.json({ error: "Your session has expired. Please log in again." }, { status: 401 });
    }

    const userId = session.user_id;

    // 3. Fetch full profile from Azure SQL with pool health check
    let pool;
    try {
      pool = await getSqlConnection();
    } catch (dbError) {
      console.error("Profile DB connection error:", dbError);
      return NextResponse.json({
        error: "Unable to reach the identity service. Please try again in a moment."
      }, { status: 503 });
    }

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
      return NextResponse.json({ error: "Profile not found. Please contact support." }, { status: 404 });
    }

    // 4. Safely serialize all fields — convert BSON/SQL types to plain strings
    const raw = result.recordset[0];
    const userProfile = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value === null || value === undefined) {
        userProfile[key] = null;
      } else if (typeof value === 'bigint') {
        userProfile[key] = value.toString();
      } else if (value && typeof value === 'object' && value._bsontype === 'Decimal128') {
        userProfile[key] = parseFloat(value.toString());
      } else if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
        userProfile[key] = value.toString();
      } else if (value instanceof Date) {
        userProfile[key] = value.toISOString();
      } else {
        userProfile[key] = value;
      }
    }

    return NextResponse.json({ success: true, profile: userProfile });

  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json({
      error: "Something went wrong loading your profile. Please try refreshing the page.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

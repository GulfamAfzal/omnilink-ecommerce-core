import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';

export const dynamic = 'force-dynamic';
import sql from 'mssql';

/**
 * Admin User Management
 * GET:   List all users with their current region info
 * PATCH: Update a user's region_id (fixes tax calculation issue)
 */
export async function GET() {
  try {
    const pool = await getSqlConnection();
    const result = await pool.request().query(`
      SELECT 
        u.user_id, u.username, u.email, u.first_name, u.last_name, 
        u.user_type, u.region_id,
        r.region_name, r.currency, r.country_code,
        ro.role_name
      FROM USERS u
      LEFT JOIN REGIONS r ON u.region_id = r.region_id
      LEFT JOIN ROLES ro ON u.role_id = ro.role_id
      ORDER BY u.user_id
    `);
    return NextResponse.json({ users: result.recordset });
  } catch (error) {
    console.error("❌ Users GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch users", details: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { userId, regionId } = body;

    if (!userId || !regionId) {
      return NextResponse.json({ error: "userId and regionId are required" }, { status: 400 });
    }

    const pool = await getSqlConnection();

    // Verify region exists
    const regionCheck = await pool.request()
      .input('regionId', sql.Int, parseInt(regionId))
      .query(`SELECT region_id, region_name, currency FROM REGIONS WHERE region_id = @regionId`);

    if (regionCheck.recordset.length === 0) {
      return NextResponse.json({ error: `Region ID ${regionId} does not exist in REGIONS table` }, { status: 404 });
    }

    const region = regionCheck.recordset[0];

    await pool.request()
      .input('userId', sql.Int, parseInt(userId))
      .input('regionId', sql.Int, parseInt(regionId))
      .query(`UPDATE USERS SET region_id = @regionId WHERE user_id = @userId`);

    return NextResponse.json({
      success: true,
      message: `User ${userId} assigned to ${region.region_name} (${region.currency}). Tax will now calculate correctly.`
    });

  } catch (error) {
    console.error("❌ Users PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update user region", details: error.message }, { status: 500 });
  }
}

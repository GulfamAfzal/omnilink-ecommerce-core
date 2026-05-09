import { NextResponse } from 'next/server';
import { getOracleConnection } from '@/lib/oracledb';

export async function GET() {
  let oracleConn;

  try {
    oracleConn = await getOracleConnection();

    // ADVANCED DB MOVE: Using a JOIN to connect ORDERS with USERS
    const result = await oracleConn.execute(
      `SELECT 
        o.order_id, 
        u.username, 
        o.total_amount, 
        o.status, 
        TO_CHAR(o.order_date, 'YYYY-MM-DD HH24:MI:SS') as formatted_date
       FROM ORDERS o
       JOIN USERS u ON o.user_id = u.user_id
       ORDER BY o.order_date DESC`
    );

    // Map the rows to a clean JSON array
    const orders = result.rows.map(row => ({
      id: row[0],
      customer: row[1],
      amount: row[2],
      status: row[3],
      date: row[4]
    }));

    return new NextResponse(JSON.stringify(orders, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 });
  } finally {
    if (oracleConn) await oracleConn.close();
  }
}
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSqlConnection } from '@/lib/azuresql';

/**
 * System Audit Logs Aggregator
 * Merges two log streams in application memory:
 * 1. Stock_Logs (MongoDB) — inventory mutation audit trail
 * 2. User_Sessions (MongoDB) — authentication event log
 * Non-blocking: uses async fallback model so logging never breaks primary routes
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 100;
    const type = searchParams.get('type'); // 'stock' | 'session' | null for all

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    const results = [];

    // --- Stream 1: Stock / Inventory Mutation Logs ---
    if (!type || type === 'stock') {
      const stockLogs = await db.collection("Stock_Logs")
        .find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();

      for (const log of stockLogs) {
        const delta = log.change_detail?.delta || 0;
        results.push({
          id: log._id.toString(),
          timestamp: log.timestamp,
          stream: 'NoSQL_Inventory',
          severity: (log.change_detail?.new_qty || 0) < 5 ? 'WARN' : 'INFO',
          type: log.type || 'STOCK_MUTATION',
          message: `${log.type === 'Inbound_Restock' ? '📦 Restock' : '📤 Adjustment'}: Variant [${log.inventory_variant_id}] ${delta >= 0 ? '+' : ''}${delta} units`,
          detail: {
            variantId: log.inventory_variant_id,
            storeId: log.store_target_id,
            regionId: log.region_owner_id,
            prevQty: log.change_detail?.previous_qty,
            newQty: log.change_detail?.new_qty,
            reason: log.change_detail?.reason,
            operatorId: log.change_detail?.operator_id
          }
        });
      }
    }

    // --- Stream 2: Authentication Session Logs ---
    if (!type || type === 'session') {
      const sessionLogs = await db.collection("User_Sessions")
        .find({})
        .sort({ login_time: -1 })
        .limit(limit)
        .toArray();

      for (const session of sessionLogs) {
        const isExpired = session.expiry && new Date(session.expiry) < new Date();
        results.push({
          id: session._id.toString(),
          timestamp: session.login_time,
          stream: 'Auth_Session',
          severity: isExpired ? 'WARN' : 'INFO',
          type: 'AUTH_EVENT',
          message: `🔐 Session created for user_id [${session.user_id}] ${isExpired ? '(Expired)' : '(Active)'}`,
          detail: {
            userId: session.user_id,
            device: session.device_info || 'Unknown',
            expiry: session.expiry,
            active: !isExpired
          }
        });
      }
    }

    // Sort merged stream by timestamp descending
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const crit = results.filter(r => r.severity === 'CRITICAL').length;
    const warn = results.filter(r => r.severity === 'WARN').length;
    const info = results.filter(r => r.severity === 'INFO').length;

    return NextResponse.json({
      totalLogs: results.length,
      summary: { critical: crit, warn, info },
      logs: results.slice(0, limit)
    });

  } catch (error) {
    console.error("❌ Audit Logs Error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs", details: error.message }, { status: 500 });
  }
}

/**
 * POST: Append a system log entry (called internally by other routes)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { severity = 'INFO', type = 'SYSTEM_EVENT', message, detail = {} } = body;

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    await db.collection("System_Logs").insertOne({
      timestamp: new Date(),
      severity,
      type,
      message,
      detail
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Log append failed" }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';
import sql from 'mssql';

/**
 * User Order History Route
 * Reads session cookie → fetches orders from Azure SQL → enriches with MongoDB product names
 */
export async function GET(request) {
  try {
    // 1. Verify session from cookie
    const sessionToken = request.cookies.get('oms_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db("OMS_Product_Catalog");

    const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const userId = session.user_id;

    // 2. Fetch user's orders from Azure SQL
    const pool = await getSqlConnection();
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          o.order_id, o.order_date, o.status, o.total_amount, o.shipping_snapshot,
          r.region_name, r.currency,
          d.detail_id as order_detail_id, d.product_variant_id, d.unit_price, d.quantity
        FROM ORDERS o
        LEFT JOIN REGIONS r ON o.region_id = r.region_id
        LEFT JOIN ORDER_DETAIL d ON o.order_id = d.order_id
        WHERE o.user_id = @userId
        ORDER BY o.order_date DESC
      `);

    const rawRows = result.recordset;

    if (rawRows.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    // 3. Enrich with MongoDB variant/product names
    const variantIds = [...new Set(rawRows.filter(r => r.product_variant_id).map(r => r.product_variant_id))];

    const mongoVariants = variantIds.length > 0
      ? await db.collection("Product_Variants")
          .find({ $or: [
            { _id: { $in: variantIds } },
            { sku: { $in: variantIds } }
          ]})
          .project({ sku: 1, product_id: 1 })
          .toArray()
      : [];

    const variantMap = mongoVariants.reduce((acc, v) => {
      acc[v._id.toString()] = v;
      acc[v.sku] = v;
      return acc;
    }, {});

    // 4. Structure into grouped orders
    const ordersMap = new Map();
    for (const row of rawRows) {
      if (!ordersMap.has(row.order_id)) {
        let snap = {};
        try { snap = JSON.parse(row.shipping_snapshot || '{}'); } catch(e) {}
        
        ordersMap.set(row.order_id, {
          orderId: row.order_id,
          date: row.order_date,
          status: row.status,
          totalAmount: row.total_amount || 0,
          subtotal: snap.subtotal || row.total_amount || 0,
          taxAmount: snap.tax_amount || 0,
          regionName: row.region_name || 'Global',
          currency: snap.currency || row.currency || 'USD',
          items: []
        });
      }
      if (row.order_detail_id) {
        const vDoc = variantMap[row.product_variant_id] || {};
        ordersMap.get(row.order_id).items.push({
          detailId: row.order_detail_id,
          variantId: row.product_variant_id,
          sku: vDoc.sku || row.product_variant_id?.substring(0, 10) || 'SKU',
          unitPrice: row.unit_price || 0,
          quantity: row.quantity || 1
        });
      }
    }

    return NextResponse.json({ orders: Array.from(ordersMap.values()) });

  } catch (error) {
    console.error("❌ User Orders Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders", details: error.message }, { status: 500 });
  }
}

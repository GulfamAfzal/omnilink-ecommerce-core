import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';

/**
 * Outbound API Dashboard Composer Endpoint
 * In-Memory Data Composition Pattern:
 * 1. Pull transactional data from Azure SQL
 * 2. Extract unique product_variant_id strings
 * 3. Enrich with MongoDB Atlas catalog data via $in filter
 * 4. Stitch in application RAM via O(1) hash-map lookup
 */
export async function GET() {
  try {
    const sqlPool = await getSqlConnection();
    const mongoClient = await clientPromise;
    const mongoDb = mongoClient.db("OMS_Product_Catalog");

    // Pull relational financial data from Azure SQL
    // Schema: ORDERS(order_id, user_id, region_id, order_date, status, total_amount, shipping_snapshot)
    //         ORDER_DETAIL(detail_id, order_id, product_variant_id, unit_price, quantity)
    const sqlResult = await sqlPool.request().query(`
      SELECT
        o.order_id, o.user_id, o.order_date, o.status, o.total_amount, o.shipping_snapshot,
        o.region_id,
        u.username, u.first_name, u.last_name,
        d.detail_id as order_detail_id, d.product_variant_id, d.unit_price, d.quantity,
        r.region_name, r.currency
      FROM ORDERS o
      JOIN USERS u ON o.user_id = u.user_id
      LEFT JOIN ORDER_DETAIL d ON o.order_id = d.order_id
      LEFT JOIN REGIONS r ON o.region_id = r.region_id
      ORDER BY o.order_date DESC
    `);

    const rawRows = sqlResult.recordset;

    if (rawRows.length === 0) {
      return NextResponse.json({
        totalRevenue: 0, totalOrders: 0, totalItems: 0,
        revenueByRegion: [], orders: []
      });
    }

    // 2. Vectorize unique variant ID strings for MongoDB $in query
    const allVariantIds = [...new Set(
      rawRows.filter(r => r.product_variant_id).map(r => r.product_variant_id)
    )];

    // 3. Execute single vectorized MongoDB query
    const mongoVariants = allVariantIds.length > 0
      ? await mongoDb.collection("Product_Variants")
          .find({ $or: [
            { _id: { $in: allVariantIds } },
            { sku: { $in: allVariantIds } }
          ]})
          .project({ sku: 1, specifications: 1, currency: 1, price: 1 })
          .toArray()
      : [];

    // 4. Build O(1) lookup hash map
    const variantMap = mongoVariants.reduce((acc, doc) => {
      acc[doc._id.toString()] = doc;
      acc[doc.sku] = doc;
      return acc;
    }, {});

    // 5. Group rows into structured orders with stitched catalog data
    const ordersMap = new Map();
    for (const row of rawRows) {
      if (!ordersMap.has(row.order_id)) {
        // Parse shipping_snapshot for subtotal/tax stored at order time
        let snap = {};
        try { snap = JSON.parse(row.shipping_snapshot || '{}'); } catch(e) {}
        
        ordersMap.set(row.order_id, {
          orderId: row.order_id,
          userId: row.user_id,
          customer: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.username,
          username: row.username,
          date: row.order_date,
          status: row.status,
          totalAmount: row.total_amount || 0,
          subtotal: snap.subtotal || row.total_amount || 0,
          taxAmount: snap.tax_amount || 0,
          regionId: row.region_id,
          regionName: row.region_name || 'Global',
          currency: snap.currency || row.currency || 'USD',
          items: []
        });
      }

      if (row.order_detail_id) {
        const catalogDoc = variantMap[row.product_variant_id] || {};
        ordersMap.get(row.order_id).items.push({
          detailId: row.order_detail_id,
          variantId: row.product_variant_id,
          sku: catalogDoc.sku || row.product_variant_id?.substring(0, 12) || 'SKU-UNKNOWN',
          unitPrice: row.unit_price || 0,
          quantity: row.quantity || 1,
          lineTotal: (row.unit_price || 0) * (row.quantity || 1),
          specs: catalogDoc.specifications || {}
        });
      }
    }

    const orders = Array.from(ordersMap.values());

    // 6. Compute aggregate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const totalItems = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    // Revenue by region
    const regionMap = {};
    for (const order of orders) {
      const key = order.regionName;
      if (!regionMap[key]) regionMap[key] = { region: key, revenue: 0, orders: 0 };
      regionMap[key].revenue += order.totalAmount || 0;
      regionMap[key].orders += 1;
    }
    const revenueByRegion = Object.values(regionMap);

    return NextResponse.json({
      totalRevenue, totalOrders, totalItems, revenueByRegion, orders
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });

  } catch (error) {
    console.error("❌ Analytics Composer Error:", error);
    return NextResponse.json({ error: "Failed to compile analytics", details: error.message }, { status: 500 });
  }
}

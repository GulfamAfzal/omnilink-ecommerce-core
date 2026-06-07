import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  let pool;
  try {
    pool = await getSqlConnection();

    // 1. Fetch from Azure SQL (Relational Database)
    const sqlResult = await pool.request().query(`
      SELECT o.order_id, o.user_id, o.region_id, o.subtotal, o.tax_amount, o.total_amount, o.status,
             o.order_date as created_at, u.username,
             d.order_detail_id, d.product_variant_id, d.quantity, d.unit_price
      FROM ORDERS o
      JOIN USERS u ON o.user_id = u.user_id
      LEFT JOIN ORDER_DETAIL d ON o.order_id = d.order_id
      ORDER BY o.order_date DESC
    `);

    const rawRows = sqlResult.recordset;

    // Group rows into structured orders
    const ordersMap = new Map();
    for (const row of rawRows) {
      if (!ordersMap.has(row.order_id)) {
        ordersMap.set(row.order_id, {
          id: row.order_id,
          customer: row.username,
          region_id: row.region_id,
          subtotal: row.subtotal,
          tax_amount: row.tax_amount,
          amount: row.total_amount,
          status: row.status,
          date: row.created_at,
          items: []
        });
      }
      
      if (row.order_detail_id) {
        ordersMap.get(row.order_id).items.push({
          order_detail_id: row.order_detail_id,
          product_variant_id: row.product_variant_id,
          quantity: row.quantity,
          unit_price: row.unit_price
        });
      }
    }

    const orders = Array.from(ordersMap.values());

    // 2. Application-Level Aggregation (Pivot to MongoDB NoSQL)
    const mongoClient = await clientPromise;
    const db = mongoClient.db("OMS_Product_Catalog");

    // Pivot: For every product_variant_id in the SQL results, asynchronously fetch the product name and image from MongoDB.
    // We demonstrate application-level join by looping through the SQL result objects
    
    await Promise.all(orders.map(async (order) => {
      await Promise.all(order.items.map(async (item) => {
        let variant;
        try {
          variant = await db.collection("Product_Variants").findOne({ _id: new ObjectId(item.product_variant_id) });
        } catch (e) {
          variant = await db.collection("Product_Variants").findOne({ sku: item.product_variant_id });
        }

        if (variant) {
          const product = await db.collection("Products").findOne({ _id: variant.product_id });
          
          let productName = product ? product.name : \`Hardware Node (\${variant.sku})\`;
          let image_url = variant.image_url || product?.media?.[0]?.url || '/logo.png';
          const lowerName = productName.toLowerCase();
          
          if (lowerName.includes("iphone")) {
            image_url = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop";
          } else if (lowerName.includes("wh-1000xm5") || lowerName.includes("sony")) {
            image_url = "https://images.unsplash.com/photo-1618366712277-722626e1e5fb?q=80&w=800&auto=format&fit=crop";
          } else if (lowerName.includes("macbook")) {
            image_url = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop";
          } else if (lowerName.includes("logitech") || lowerName.includes("mx master")) {
            image_url = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop";
          }

          item.product_name = productName;
          item.image_url = image_url;
        } else {
          item.product_name = "Unknown Product";
          item.image_url = "/logo.png";
        }
      }));
    }));

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("Admin Orders Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch orders from Azure SQL", details: error.message }, { status: 500 });
  }
}
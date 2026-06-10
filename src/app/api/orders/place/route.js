import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import sql from 'mssql';

// Tax rate map (since REGIONS table has no tax_rate column, we handle it in app)
const TAX_RATES = { 1: 0.08, 2: 0.10, 3: 0.20, 4: 0.10, 5: 0.05 };

async function getUserIdFromSession(request) {
  const sessionToken = request.cookies.get('oms_session')?.value;
  if (!sessionToken) return null;
  const client = await clientPromise;
  const db = client.db("OMS_Product_Catalog");
  const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });
  return session ? session.user_id : null;
}

export async function POST(request) {
  let pool;
  let orderId = null;
  const mongoClient = await clientPromise;
  const db = mongoClient.db("OMS_Product_Catalog");

  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    pool = await getSqlConnection();

    // 1. Fetch User Region (REGIONS has no tax_rate — we use our app-level map)
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.region_id, r.currency, r.region_name
        FROM USERS u
        LEFT JOIN REGIONS r ON u.region_id = r.region_id
        WHERE u.user_id = @userId
      `);

    if (userResult.recordset.length === 0) {
      return NextResponse.json({ error: "User not found in identity core" }, { status: 404 });
    }

    const userRegion = userResult.recordset[0];
    const regionId = userRegion.region_id;
    
    // If no region assigned, default to region 1 and notify
    const effectiveRegionId = regionId || 1;
    const taxRate = TAX_RATES[effectiveRegionId] || 0.10;

    if (!regionId) {
      console.warn(`⚠ User ${userId} has no region assigned. Defaulting to Region 1 (8% tax). Fix this in /admin/data`);
    }

    // Fetch Cart Items with prices
    const pipeline = [
      { $match: { user_id: userId } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "Product_Variants",
          let: { varId: "$items.variant_id" },
          pipeline: [{ $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$varId"] } } }],
          as: "variant_details"
        }
      },
      { $unwind: "$variant_details" },
      {
        $project: {
          variant_id: "$items.variant_id",
          quantity: "$items.quantity",
          price: { $convert: { input: "$variant_details.price", to: "double", onError: 0, onNull: 0 } },
          sku: "$variant_details.sku"
        }
      }
    ];

    const cartItems = await db.collection("Carts").aggregate(pipeline).toArray();

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cartItems) subtotal += item.price * item.quantity;
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Build shipping snapshot (stores subtotal + tax in JSON since no separate columns)
    const shippingSnapshot = JSON.stringify({
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax_amount: parseFloat(taxAmount.toFixed(2)),
      tax_rate: taxRate,
      region_name: userRegion.region_name || 'Unknown',
      currency: userRegion.currency || 'USD'
    });

    // --- ACID SQL Transaction ---
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const orderRequest = new sql.Request(transaction);
      orderRequest.input('userId', sql.Int, userId);
      orderRequest.input('regionId', sql.Int, effectiveRegionId);
      orderRequest.input('total', sql.Decimal(18, 2), totalAmount);
      orderRequest.input('snapshot', sql.NVarChar(sql.MAX), shippingSnapshot);

      const orderInsertResult = await orderRequest.query(`
        INSERT INTO ORDERS (user_id, region_id, total_amount, status, shipping_snapshot)
        OUTPUT INSERTED.order_id
        VALUES (@userId, @regionId, @total, 'Pending', @snapshot)
      `);

      orderId = orderInsertResult.recordset[0].order_id;

      // Insert ORDER_DETAIL rows (using correct column: detail_id is IDENTITY)
      for (const item of cartItems) {
        const detailRequest = new sql.Request(transaction);
        detailRequest.input('orderId', sql.Int, orderId);
        detailRequest.input('variantId', sql.NVarChar, item.variant_id.toString());
        detailRequest.input('quantity', sql.Int, item.quantity);
        detailRequest.input('price', sql.Decimal(18, 2), item.price);

        await detailRequest.query(`
          INSERT INTO ORDER_DETAIL (order_id, product_variant_id, quantity, unit_price)
          VALUES (@orderId, @variantId, @quantity, @price)
        `);
      }

      await transaction.commit();
    } catch (sqlError) {
      await transaction.rollback();
      console.error("SQL Transaction Failed. Rolled back.", sqlError);
      throw new Error("Failed to process transaction: " + sqlError.message);
    }

    // --- NoSQL: Decrement inventory + clear cart ---
    try {
      for (const item of cartItems) {
        let oid;
        try { oid = new ObjectId(item.variant_id); } catch(e) { oid = item.variant_id; }
        await db.collection("Inventory").updateOne(
          { variant_id: oid, region_id: effectiveRegionId },
          { $inc: { quantity: -item.quantity }, $set: { updated_at: new Date() } }
        );
      }
      await db.collection("Carts").updateOne({ user_id: userId }, { $set: { items: [] } });

    } catch (nosqlError) {
      console.error("NoSQL Updates Failed! Running Saga compensating action...", nosqlError);
      try {
        await pool.request()
          .input('orderId', sql.Int, orderId)
          .query(`DELETE FROM ORDER_DETAIL WHERE order_id = @orderId; DELETE FROM ORDERS WHERE order_id = @orderId;`);
        console.log(`Saga compensating rollback: Order #${orderId} removed from SQL.`);
      } catch (compensateError) {
        console.error("CRITICAL: Saga compensating action failed!", compensateError);
      }
      throw new Error("Distributed transaction failed during NoSQL phase");
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: `Order #${orderId} placed (Subtotal: $${subtotal.toFixed(2)}, Tax ${(taxRate*100).toFixed(0)}%: $${taxAmount.toFixed(2)}, Total: $${totalAmount.toFixed(2)})`,
      summary: { subtotal, taxAmount, totalAmount, taxRate, regionId: effectiveRegionId }
    });

  } catch (error) {
    console.error("Order Placement Error:", error);
    return NextResponse.json({ error: "Failed to place order", details: error.message }, { status: 500 });
  }
}

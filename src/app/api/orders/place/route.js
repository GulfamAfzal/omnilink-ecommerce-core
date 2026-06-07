import { NextResponse } from 'next/server';
import { getSqlConnection } from '@/lib/azuresql';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import sql from 'mssql';

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

    // 1. Fetch User Region and Cart
    const userResult = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.region_id, r.currency, 
               CASE WHEN r.region_name = 'North America' THEN 0.08 
                    WHEN r.region_name = 'Europe' THEN 0.20 
                    ELSE 0.10 END as tax_rate
        FROM USERS u
        LEFT JOIN REGIONS r ON u.region_id = r.region_id
        WHERE u.user_id = @userId
      `);

    if (userResult.recordset.length === 0) {
      return NextResponse.json({ error: "User not found in identity core" }, { status: 404 });
    }

    const userRegion = userResult.recordset[0];
    const taxRate = userRegion.tax_rate;

    // Fetch Cart and Prices
    const pipeline = [
      { $match: { user_id: userId } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "Product_Variants",
          let: { varId: "$items.variant_id" },
          pipeline: [
            { $match: { $expr: { $eq: [ { $toString: "$_id" }, "$$varId" ] } } }
          ],
          as: "variant_details"
        }
      },
      { $unwind: "$variant_details" },
      {
        $project: {
          variant_id: "$items.variant_id",
          quantity: "$items.quantity",
          price: { $convert: { input: "$variant_details.price", to: "double", onError: 0, onNull: 0 } }
        }
      }
    ];

    const cartItems = await db.collection("Carts").aggregate(pipeline).toArray();

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Calculate Totals
    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.price * item.quantity;
    }
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // --- ACID Transaction Core (SQL) ---
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Step 1: Insert Order
      const orderRequest = new sql.Request(transaction);
      orderRequest.input('userId', sql.Int, userId);
      orderRequest.input('regionId', sql.Int, userRegion.region_id);
      orderRequest.input('subtotal', sql.Decimal(18, 2), subtotal);
      orderRequest.input('tax', sql.Decimal(18, 2), taxAmount);
      orderRequest.input('total', sql.Decimal(18, 2), totalAmount);
      
      // Execute and retrieve generated order_id
      const orderInsertResult = await orderRequest.query(`
        INSERT INTO ORDERS (user_id, region_id, subtotal, tax_amount, total_amount, status)
        OUTPUT INSERTED.order_id
        VALUES (@userId, @regionId, @subtotal, @tax, @total, 'Pending')
      `);
      
      orderId = orderInsertResult.recordset[0].order_id;

      // Step 2: Insert Order Details
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
      throw new Error("Failed to process transaction in Identity Core: " + sqlError.message);
    }

    // --- NoSQL Updates (With Saga Compensating Action) ---
    try {
      // Step 4: Atomically decrement quantity in Inventory
      for (const item of cartItems) {
        let oid;
        try { oid = new ObjectId(item.variant_id); } catch(e) { oid = item.variant_id; }
        await db.collection("Inventory").updateOne(
          { variant_id: oid }, // Might need to just use string depending on schema
          { $inc: { quantity: -item.quantity } }
        );
        // Also update the variant directly if inventory is embedded there
        await db.collection("Product_Variants").updateOne(
          { _id: oid },
          { $inc: { inventory: -item.quantity } }
        );
      }

      // Step 5: Clear Cart
      await db.collection("Carts").updateOne(
        { user_id: userId },
        { $set: { items: [] } }
      );

    } catch (nosqlError) {
      // SAGA PATTERN: Compensating Action if NoSQL fails
      console.error("NoSQL Updates Failed! Executing Saga Compensating Action on SQL...", nosqlError);
      
      try {
        const rollbackPool = await getSqlConnection();
        await rollbackPool.request()
          .input('orderId', sql.Int, orderId)
          .query(`
            DELETE FROM ORDER_DETAIL WHERE order_id = @orderId;
            DELETE FROM ORDERS WHERE order_id = @orderId;
          `);
        console.log(`Compensating Action Successful: Order ${orderId} removed from SQL.`);
      } catch (compensateError) {
        console.error("CRITICAL: SAGA COMPENSATING ACTION FAILED!", compensateError);
      }

      throw new Error("Distributed transaction failed during NoSQL update");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order placed successfully using Distributed Transaction", 
      orderId 
    });

  } catch (error) {
    console.error("Order Placement Error:", error);
    return NextResponse.json({ error: "Failed to place order", details: error.message }, { status: 500 });
  }
}

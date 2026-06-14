import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getSqlConnection } from '@/lib/azuresql';
import sql from 'mssql';

export async function POST(request) {
    let pool;

    try {
        const body = await request.json();
        const { variant_id, quantity, user_id, region_id } = body;

        // 1. PHASE 1: MONGODB ATLAS (Product Validation)
        const client = await clientPromise;
        const db = client.db("OMS_Product_Catalog");
        
        // Find product details in NoSQL Catalog
        const mongoProduct = await db.collection("Product_Variants").findOne({ _id: variant_id });

        if (!mongoProduct) {
            return NextResponse.json({ error: "Product not found in MongoDB Catalog" }, { status: 404 });
        }

        // Fetch parent product to get the name
        const parentProduct = await db.collection("Products").findOne({ _id: mongoProduct.product_id });

        // 2. PHASE 2: AZURE SQL (Transactional Processing)
        pool = await getSqlConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 3. Check Stock and Price in SQL Relational Core
            const stockCheck = await transaction.request()
                .input('id', sql.NVarChar, variant_id)
                .query(`SELECT unit_price, quantity FROM ORDER_DETAIL WHERE product_variant_id = @id`);

            if (stockCheck.recordset.length === 0) {
                throw new Error("Product metadata missing in SQL ORDER_DETAIL");
            }

            const price = stockCheck.recordset[0].unit_price;
            const currentStock = stockCheck.recordset[0].quantity;

            if (currentStock < quantity) {
                throw new Error("Insufficient stock in warehouse");
            }

            // 4. Create Order Record
            const totalAmount = price * quantity;
            const orderInsert = await transaction.request()
                .input('userId', sql.Int, user_id)
                .input('regionId', sql.Int, region_id)
                .input('amount', sql.Decimal(12, 2), totalAmount)
                .query(`
                    INSERT INTO ORDERS (user_id, region_id, total_amount, status, order_date) 
                    OUTPUT INSERTED.order_id
                    VALUES (@userId, @regionId, @amount, 'Completed', GETDATE())
                `);

            const newOrderId = orderInsert.recordset[0].order_id;

            // 5. Deduct Inventory (Update Stock)
            await transaction.request()
                .input('qty', sql.Int, quantity)
                .input('id', sql.NVarChar, variant_id)
                .query(`UPDATE ORDER_DETAIL SET quantity = quantity - @qty WHERE product_variant_id = @id`);

            // 6. COMMIT Transaction (ACID Compliance)
            await transaction.commit();

            return NextResponse.json({
                success: true,
                message: "Hybrid Transaction Succeeded!",
                order_details: {
                    order_id: newOrderId,
                    product_name: parentProduct ? parentProduct.name : `Hardware Node (${variant_id})`, // Data from Mongo
                    total_paid: totalAmount          // Data from SQL
                }
            }, { status: 200 });

        } catch (txError) {
            await transaction.rollback();
            throw txError;
        }

    } catch (error) {
        console.error("Critical Order Failure:", error);
        return NextResponse.json({ 
            error: "Transaction failed", 
            message: error.message 
        }, { status: 500 });
    }
}
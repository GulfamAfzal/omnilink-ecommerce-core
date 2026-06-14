import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * Optimized Sharded Inventory Modification Gateway
 * PUT: Adjust stock quantity with explicit shard key (region_id) for single-node routing
 * GET: Fetch all inventory records for the admin terminal
 */
export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('region_id');

    const filter = regionId ? { region_id: parseInt(regionId) } : {};

    const inventory = await db.collection("Inventory")
      .find(filter)
      .sort({ region_id: 1, quantity: 1 })
      .limit(200)
      .toArray();

    // Enrich with variant SKUs
    const variantIds = [...new Set(inventory.map(i => i.variant_id?.toString()).filter(Boolean))];
    const variants = variantIds.length > 0
      ? await db.collection("Product_Variants")
          .find({ $or: [
            { _id: { $in: variantIds } },
            { sku: { $in: variantIds } }
          ]})
          .project({ sku: 1, price: 1 })
          .toArray()
      : [];

    const variantMap = variants.reduce((acc, v) => {
      acc[v._id.toString()] = v;
      acc[v.sku] = v;
      return acc;
    }, {});

    const enriched = inventory.map(item => ({
      ...item,
      _id: item._id.toString(),
      sku: variantMap[item.variant_id?.toString()]?.sku || item.variant_id || 'UNKNOWN',
      lowStock: (item.quantity || 0) < 5
    }));

    return NextResponse.json({ inventory: enriched });
  } catch (error) {
    console.error("❌ Inventory GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    const body = await request.json();
    const { variantId, storeId, regionId, quantityChange, reason, operatorId } = body;

    if (!variantId || regionId === undefined || quantityChange === undefined) {
      return NextResponse.json({ error: "Missing required fields: variantId, regionId, quantityChange" }, { status: 400 });
    }

    const targetRegion = parseInt(regionId);
    const delta = parseInt(quantityChange);
    const targetStore = storeId || 'default';

    // Snapshot current quantity before update for audit log
    const previous = await db.collection("Inventory").findOne({
      variant_id: variantId,
      store_id: targetStore,
      region_id: targetRegion   // ← Shard key enforced
    });

    const baseQty = previous?.quantity || 0;
    const newQty = baseQty + delta;

    if (newQty < 0) {
      return NextResponse.json({ error: "Insufficient stock: quantity cannot go below 0" }, { status: 400 });
    }

    // Targeted atomic update using shard key to avoid scatter-gather
    const result = await db.collection("Inventory").updateOne(
      {
        variant_id: variantId,
        store_id: targetStore,
        region_id: targetRegion   // ← Shard key in query filter
      },
      { $inc: { quantity: delta }, $set: { updated_at: new Date() } },
      { upsert: true }
    );

    // Append immutable audit entry to Stock_Logs
    await db.collection("Stock_Logs").insertOne({
      inventory_variant_id: variantId,
      store_target_id: targetStore,
      region_owner_id: targetRegion,
      timestamp: new Date(),
      type: delta >= 0 ? "Inbound_Restock" : "Outbound_Adjustment",
      change_detail: {
        reason: reason || "Manual Merchant Adjustment",
        operator_id: parseInt(operatorId || 206),
        previous_qty: baseQty,
        new_qty: newQty,
        delta
      }
    });

    return NextResponse.json({
      message: "Inventory updated successfully via targeted shard node.",
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount,
      newQuantity: newQty
    });

  } catch (error) {
    console.error("❌ Inventory PUT Error:", error);
    return NextResponse.json({ error: "Failed to update inventory", details: error.message }, { status: 500 });
  }
}

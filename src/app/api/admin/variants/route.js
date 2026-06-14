import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId, Decimal128 } from 'mongodb';

export const dynamic = 'force-dynamic';

/**
 * Admin Variant Management
 * POST: Create a product variant (linked to a product) + auto-create Inventory record
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, sku, price, currency, color, size, storage, imageUrl, initialStock, regionId } = body;

    if (!productId || !sku || !price) {
      return NextResponse.json({ error: "productId, sku, and price are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // Validate product exists
    let prodOid;
    try { prodOid = new ObjectId(productId); } catch(e) {
      return NextResponse.json({ error: "Invalid productId format" }, { status: 400 });
    }

    const productExists = await db.collection("Products").findOne({ _id: prodOid });
    if (!productExists) {
      return NextResponse.json({ error: `Product with id "${productId}" not found` }, { status: 404 });
    }

    // Check SKU uniqueness
    const skuExists = await db.collection("Product_Variants").findOne({ sku: sku.trim() });
    if (skuExists) {
      return NextResponse.json({ error: `SKU "${sku}" already exists. Use a unique SKU.` }, { status: 409 });
    }

    // Build specifications object from optional fields
    const specs = {};
    if (color)   specs.color   = color.trim();
    if (size)    specs.size    = size.trim();
    if (storage) specs.storage = storage.trim();

    const variantOid = new ObjectId();
    const variant = {
      _id: variantOid.toString(),
      product_id: prodOid,
      sku: sku.trim().toUpperCase(),
      price: Decimal128.fromString(price.toString()),
      currency: (currency || 'USD').toUpperCase(),
      specifications: specs,
      image_url: imageUrl?.trim() || null,
      created_at: new Date(),
      is_active: true
    };

    const varResult = await db.collection("Product_Variants").insertOne(variant);
    const variantId = varResult.insertedId;

    // Auto-create Inventory record for each region
    const regions = regionId ? [parseInt(regionId)] : [1, 2, 3];
    const inventoryDocs = regions.map(rid => ({
      variant_id: variantId,
      store_id: 'STORE-MAIN',
      region_id: rid,
      quantity: parseInt(initialStock) || 0,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await db.collection("Inventory").insertMany(inventoryDocs);

    return NextResponse.json({
      success: true,
      variantId: variantId.toString(),
      sku: variant.sku,
      inventoryCreated: inventoryDocs.length,
      message: `Variant "${sku}" created with ${inventoryDocs.length} inventory records (initial stock: ${initialStock || 0})`
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Variant POST Error:", error);
    return NextResponse.json({ error: "Failed to create variant", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");
    const variants = await db.collection("Product_Variants")
      .find({})
      .project({ sku: 1, price: 1, currency: 1, product_id: 1 })
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();
    return NextResponse.json({ 
      variants: variants.map(v => ({ 
        ...v, 
        _id: v._id.toString(), 
        product_id: v.product_id?.toString(),
        price: v.price ? parseFloat(v.price.toString()) : 0
      })) 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch variants" }, { status: 500 });
  }
}

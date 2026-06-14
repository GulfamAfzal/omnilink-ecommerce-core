import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * Admin Product Management
 * POST: Create a new product in MongoDB Products collection
 * GET:  List all products (for variant linking)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, brand, description, category, media } = body;

    if (!name || !brand) {
      return NextResponse.json({ error: "name and brand are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    const product = {
      name: name.trim(),
      brand: brand.trim(),
      description: description?.trim() || '',
      category: category?.trim() || 'General',
      media: media ? [{ url: media }] : [],
      created_at: new Date(),
      is_active: true
    };

    const result = await db.collection("Products").insertOne(product);

    return NextResponse.json({
      success: true,
      productId: result.insertedId.toString(),
      message: `Product "${name}" created successfully in MongoDB Atlas`
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Product POST Error:", error);
    return NextResponse.json({ error: "Failed to create product", details: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    const products = await db.collection("Products")
      .find({})
      .project({ name: 1, brand: 1, category: 1 })
      .sort({ created_at: -1 })
      .limit(200)
      .toArray();

    return NextResponse.json({
      products: products.map(p => ({ ...p, _id: p._id.toString() }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

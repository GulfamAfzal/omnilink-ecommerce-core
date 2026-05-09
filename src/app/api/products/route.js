import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // 1. Fetch both collections in parallel for performance
    const [variants, products] = await Promise.all([
      db.collection("Product_Variants").find({}).toArray(),
      db.collection("Product").find({}).toArray()
    ]);

    // 2. Stitching with Normalization
    const stitchedData = variants.map(variant => {
      // Find the parent by converting both IDs to Strings to ensure a match
      const parent = products.find(p => 
        p._id.toString() === variant.product_id.toString()
      );
      
      return {
        _id: variant._id.toString(),
        sku: variant.sku,
        price: variant.price ? parseFloat(variant.price.toString()) : 0,
        currency: variant.currency || 'USD',
        specifications: variant.specifications || {},
        variant_attributes: variant.variant_attributes || [],
        
        // --- THE FIX ---
        // If parent is found, use its name. If not, use the SKU as a backup.
        productName: parent ? parent.name : `Hardware Node (${variant.sku})`,
        brand: parent ? parent.brand : "OMS OMNILINK",
        description: parent ? parent.description : "",
        
        // Image logic: Variant image first, then Product image, then fallback
        image_url: variant.image_url || parent?.media?.[0]?.url || '/logo.png'
      };
    });

    return NextResponse.json(stitchedData);
  } catch (e) {
    console.error("Composition Error:", e);
    return NextResponse.json({ error: "API Composition Failed" }, { status: 500 });
  }
}
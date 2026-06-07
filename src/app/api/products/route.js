import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // Execute MongoDB Aggregation Pipeline
    const pipeline = [
      {
        $lookup: {
          from: "Product_Variants",
          let: { prodId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [ { $toString: "$product_id" }, "$$prodId" ]
                }
              }
            }
          ],
          as: "variants"
        }
      },
      {
        $project: {
          _id: { $toString: "$_id" },
          productName: "$name",
          description: 1,
          brand: 1,
          media: 1,
          variants: {
            $map: {
              input: "$variants",
              as: "variant",
              in: {
                variant_id: { $toString: "$$variant._id" },
                sku: "$$variant.sku",
                price: { $convert: { input: "$$variant.price", to: "double", onError: 0, onNull: 0 } },
                currency: "$$variant.currency"
              }
            }
          }
        }
      },
      { $skip: skip },
      { $limit: limit }
    ];

    const products = await db.collection("Products").aggregate(pipeline).toArray();

    // Data Enhancement for missing/broken images (force overwrite for specific items like original)
    const enhancedProducts = products.map(p => {
      let image_url = p.media?.[0]?.url;
      const lowerName = (p.productName || "").toLowerCase();
      
      let matchedRealistic = false;
      
      if (lowerName.includes("iphone")) {
        image_url = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop";
        matchedRealistic = true;
      } else if (lowerName.includes("wh-1000xm5") || lowerName.includes("sony")) {
        image_url = "https://images.unsplash.com/photo-1618366712277-722626e1e5fb?q=80&w=800&auto=format&fit=crop";
        matchedRealistic = true;
      } else if (lowerName.includes("macbook")) {
        image_url = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop";
        matchedRealistic = true;
      } else if (lowerName.includes("logitech") || lowerName.includes("mx master")) {
        image_url = "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop";
        matchedRealistic = true;
      }
      
      if (!image_url) {
         image_url = '/logo.png';
      }

      if (matchedRealistic || !p.media || p.media.length === 0) {
        p.media = [{ url: image_url }];
      }
      
      return p;
    });

    return NextResponse.json(enhancedProducts);
  } catch (e) {
    console.error("Aggregation Error:", e);
    return NextResponse.json({ error: "API Aggregation Failed" }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get('region_id');

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // Fetch the single product detail using aggregation
    const pipeline = [
      {
        $match: {
          $expr: {
            $eq: [ { $toString: "$_id" }, id ]
          }
        }
      },
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
            },
            {
              $lookup: {
                from: "Inventory",
                let: { varId: { $toString: "$_id" } },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [ { $toString: "$variant_id" }, "$$varId" ] },
                          ...(regionId ? [{ $eq: [ { $toString: "$region_id" }, regionId ] }] : [])
                        ]
                      }
                    }
                  }
                ],
                as: "inventory_data"
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
                currency: "$$variant.currency",
                inventory_data: "$$variant.inventory_data"
              }
            }
          }
        }
      }
    ];

    const products = await db.collection("Products").aggregate(pipeline).toArray();

    if (products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = products[0];

    // Data Enhancement for missing images
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

    return NextResponse.json(p);
  } catch (e) {
    console.error("Product Fetch Error:", e);
    return NextResponse.json({ error: "API Fetch Failed" }, { status: 500 });
  }
}

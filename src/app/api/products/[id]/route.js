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

    // ── Image Enhancement ────────────────────────────────────────────────
    // Priority 1: Google Drive URL → convert to thumbnail API
    // Priority 2: Existing direct URL → keep as-is
    // Priority 3: No URL → Unsplash keyword fallback
    let image_url = p.media?.[0]?.url;

    if (image_url && (
      image_url.includes('drive.google.com') ||
      image_url.includes('docs.google.com') ||
      image_url.includes('lh3.googleusercontent.com')
    )) {
      let driveId = null;
      const fileMatch  = image_url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      const idMatch    = image_url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      const lh3Match   = image_url.match(/lh3\.googleusercontent\.com(?:\/u\/\d+)?\/d\/([a-zA-Z0-9_-]+)/);
      const thumbMatch = image_url.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
      if (fileMatch)       driveId = fileMatch[1];
      else if (idMatch)    driveId = idMatch[1];
      else if (lh3Match)   driveId = lh3Match[1];
      else if (thumbMatch) driveId = thumbMatch[1];

      if (driveId) {
        p.media = [{ url: `https://drive.google.com/thumbnail?id=${driveId}&sz=w800` }];
        return NextResponse.json(p); // ✅ Drive image resolved
      }
    }

    if (!image_url || !image_url.startsWith('http')) {
      // No usable URL — apply keyword fallback
      const lowerName  = (p.productName || '').toLowerCase();
      const lowerBrand = (p.brand       || '').toLowerCase();
      let fallback = null;

      if      (lowerName.includes('iphone') || lowerName.includes('galaxy') || (lowerBrand === 'apple' && lowerName.includes('phone')))
        fallback = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('infinix') || lowerBrand === 'infinix')
        fallback = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('xiaomi') || lowerBrand === 'xiaomi')
        fallback = 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('macbook'))
        fallback = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('thinkbook') || lowerName.includes('thinkpad') || lowerBrand === 'lenovo')
        fallback = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('hp') || lowerBrand === 'hp')
        fallback = 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('dell') || lowerBrand === 'dell')
        fallback = 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('wh-1000xm5') || lowerBrand === 'sony')
        fallback = 'https://images.unsplash.com/photo-1618366712277-722626e1e5fb?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('audionic') || lowerBrand === 'audionic' || lowerName.includes('headphone') || lowerName.includes('earphone') || lowerName.includes('on-ear') || lowerName.includes('over-ear'))
        fallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('airpod') || lowerName.includes('earbud') || lowerName.includes('tws'))
        fallback = 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('speaker'))
        fallback = 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('ipad') || (lowerName.includes('tablet') && lowerBrand === 'apple'))
        fallback = 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('tablet') || lowerName.includes('tab'))
        fallback = 'https://images.unsplash.com/photo-1561154464-82e9adf32764?q=80&w=800&auto=format&fit=crop';
      else if (lowerName.includes('logitech') || lowerName.includes('mx master'))
        fallback = 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop';
      else
        fallback = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop';

      p.media = [{ url: fallback }];
    }

    return NextResponse.json(p);
  } catch (e) {
    console.error("Product Fetch Error:", e);
    return NextResponse.json({ error: "API Fetch Failed" }, { status: 500 });
  }
}

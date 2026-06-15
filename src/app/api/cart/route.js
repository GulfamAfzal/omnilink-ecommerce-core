import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

async function getUserIdFromSession(request) {
  const sessionToken = request.cookies.get('oms_session')?.value;
  if (!sessionToken) return null;
  const client = await clientPromise;
  const db = client.db("OMS_Product_Catalog");
  const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });
  return session ? session.user_id : null;
}

export async function GET(request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // Fetch the user's cart and pivot to Product_Variants
    const pipeline = [
      { $match: { user_id: userId } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "Product_Variants",
          let: { varId: "$items.variant_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [ { $toString: "$_id" }, "$$varId" ] }
              }
            }
          ],
          as: "variant_details"
        }
      },
      { $unwind: { path: "$variant_details", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          variant_id: "$items.variant_id",
          quantity: "$items.quantity",
          sku: "$variant_details.sku",
          price: { $convert: { input: "$variant_details.price", to: "double", onError: 0, onNull: 0 } },
          currency: "$variant_details.currency",
          image_url: "$variant_details.image_url"
        }
      }
    ];

    const cartItems = await db.collection("Carts").aggregate(pipeline).toArray();

    // ── Image Enhancement ────────────────────────────────────────────────
    // Priority 1: Google Drive URL (variant image_url) → convert to thumbnail
    // Priority 2: Existing direct URL → keep as-is
    // Priority 3: No URL → Unsplash keyword fallback based on SKU
    const enhancedCartItems = cartItems.map(item => {
      let image_url = item.image_url;

      // ── Priority 1: Convert Google Drive links ────────────────────
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
          item.image_url = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
          return item; // ✅ Drive image resolved
        }
      }

      // ── Priority 2: Non-Drive direct URL → keep untouched ─────────
      if (image_url && image_url.startsWith('http')) return item;

      // ── Priority 3: No URL → keyword fallback from SKU ────────────
      const lowerSku = (item.sku || '').toLowerCase();
      let fallback = null;

      if      (lowerSku.includes('iphone') || lowerSku.includes('galaxy'))
        fallback = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.includes('infinix'))
        fallback = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.includes('macbook'))
        fallback = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.includes('thinkbook') || lowerSku.includes('thinkpad') || lowerSku.includes('lenovo'))
        fallback = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.startsWith('hp') || lowerSku.includes('hp-'))
        fallback = 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.includes('wh-1000xm5') || lowerSku.includes('sony'))
        fallback = 'https://images.unsplash.com/photo-1618366712277-722626e1e5fb?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.includes('audionic') || lowerSku.includes('headphone') || lowerSku.includes('hammer'))
        fallback = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.includes('ipad'))
        fallback = 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=800&auto=format&fit=crop';
      else if (lowerSku.includes('logitech') || lowerSku.includes('mx master'))
        fallback = 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?q=80&w=800&auto=format&fit=crop';
      else
        fallback = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop';

      item.image_url = fallback;
      return item;
    });

    return NextResponse.json({ success: true, items: enhancedCartItems });
  } catch (error) {
    console.error("Cart GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { variant_id, quantity = 1 } = await request.json();
    if (!variant_id) return NextResponse.json({ error: "variant_id is required" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    // Check if item exists in cart
    const cart = await db.collection("Carts").findOne({ user_id: userId });

    if (!cart) {
      // Create new cart
      await db.collection("Carts").insertOne({
        user_id: userId,
        items: [{ variant_id, quantity }]
      });
    } else {
      const itemIndex = cart.items.findIndex(item => item.variant_id === variant_id);
      if (itemIndex > -1) {
        // Update quantity
        await db.collection("Carts").updateOne(
          { user_id: userId, "items.variant_id": variant_id },
          { $inc: { "items.$.quantity": quantity } }
        );
      } else {
        // Add new item
        await db.collection("Carts").updateOne(
          { user_id: userId },
          { $push: { items: { variant_id, quantity } } }
        );
      }
    }

    return NextResponse.json({ success: true, message: "Item added to cart" });
  } catch (error) {
    console.error("Cart POST Error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const userId = await getUserIdFromSession(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { variant_id } = await request.json();

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    if (variant_id) {
      // Remove specific item
      await db.collection("Carts").updateOne(
        { user_id: userId },
        { $pull: { items: { variant_id: variant_id } } }
      );
    } else {
      // Clear entire cart
      await db.collection("Carts").updateOne(
        { user_id: userId },
        { $set: { items: [] } }
      );
    }

    return NextResponse.json({ success: true, message: "Cart updated" });
  } catch (error) {
    console.error("Cart DELETE Error:", error);
    return NextResponse.json({ error: "Failed to delete from cart" }, { status: 500 });
  }
}

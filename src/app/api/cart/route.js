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

    return NextResponse.json({ success: true, items: cartItems });
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

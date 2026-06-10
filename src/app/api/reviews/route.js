import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * Product Reviews API
 * POST: Submit a review to MongoDB Reviews collection
 * GET: Fetch reviews for a specific product
 */
export async function POST(request) {
  try {
    const sessionToken = request.cookies.get('oms_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    const session = await db.collection("User_Sessions").findOne({ session_token: sessionToken });
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, variantId, rating, comment, title } = body;

    if (!productId || !rating) {
      return NextResponse.json({ error: "productId and rating are required" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const review = {
      product_id: productId,
      variant_id: variantId || null,
      user_id: session.user_id,    // Relational reference embedded inside NoSQL document
      rating: parseInt(rating),
      title: title || '',
      comment: comment || '',
      created_at: new Date(),
      helpful_count: 0,
      verified_purchase: true
    };

    const result = await db.collection("Reviews").insertOne(review);

    return NextResponse.json({
      success: true,
      reviewId: result.insertedId.toString(),
      message: "Review submitted successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("❌ Review POST Error:", error);
    return NextResponse.json({ error: "Failed to submit review", details: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("OMS_Product_Catalog");

    const reviews = await db.collection("Reviews")
      .find({ product_id: productId })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      count: reviews.length,
      avgRating: Math.round(avgRating * 10) / 10,
      reviews: reviews.map(r => ({ ...r, _id: r._id.toString() }))
    });

  } catch (error) {
    console.error("❌ Review GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

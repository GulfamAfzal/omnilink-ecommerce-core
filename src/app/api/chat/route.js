import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import clientPromise from '@/lib/mongodb';
import { sendSupportEmail } from '@/lib/emailService';

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are OmniBot, a helpful and friendly AI assistant for OMS OMNILINK — a premium enterprise e-commerce platform.

You help customers with:
- Product discovery and recommendations (use search when asked about products)
- Cart and checkout guidance
- FAQ and general support questions
- Escalating issues to human support when requested

Platform info:
- Browse products at the homepage (/)
- View product details by clicking any product card
- Add items to cart and checkout at /checkout
- View order history at /profile
- Contact support at /contact
- Support hours: Mon–Fri, 9AM–6PM Pakistan Standard Time

Guidelines:
- Be concise, warm, and professional
- If asked about specific products, ALWAYS call the search_products function
- For order status questions, tell users to visit /profile
- Offer escalation to human support when user is frustrated or has complex issues
- Always refer to the platform as "OMS OMNILINK"`;

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const tools = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Search for products in the OMS OMNILINK catalog by name, brand, or category',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Search term — product name, brand, or category like phones, laptops, audio',
            },
            limit: {
              type: 'NUMBER',
              description: 'Max results to return (default 4)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'escalate_to_support',
        description: 'Escalate a customer issue to the human support team via email',
        parameters: {
          type: 'OBJECT',
          properties: {
            customer_name: { type: 'STRING', description: 'Customer name' },
            customer_email: { type: 'STRING', description: 'Customer email address' },
            order_number: { type: 'STRING', description: 'Order number if applicable' },
            issue_description: { type: 'STRING', description: 'Detailed description of the issue' },
          },
          required: ['issue_description'],
        },
      },
    ],
  },
];

// ─── Search Products in MongoDB ───────────────────────────────────────────────
async function searchProducts(query, limit = 4) {
  try {
    const client = await clientPromise;
    const db = client.db('OMS_Product_Catalog');
    const products = await db.collection('Products').aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { brand: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
          ],
        },
      },
      {
        $lookup: {
          from: 'Product_Variants',
          let: { prodId: { $toString: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: '$product_id' }, '$$prodId'] } } },
            { $limit: 1 },
          ],
          as: 'variants',
        },
      },
      {
        $project: {
          _id: { $toString: '$_id' },
          name: '$name',
          brand: 1,
          price: {
            $convert: {
              input: { $arrayElemAt: ['$variants.price', 0] },
              to: 'double',
              onError: 0,
              onNull: 0,
            },
          },
          currency: { $arrayElemAt: ['$variants.currency', 0] },
          sku: { $arrayElemAt: ['$variants.sku', 0] },
        },
      },
      { $limit: Math.min(limit || 4, 6) },
    ]).toArray();
    return products;
  } catch (err) {
    console.error('Product search error:', err);
    return [];
  }
}

// ─── Execute Function Calls ───────────────────────────────────────────────────
async function executeFunctionCall(name, args) {
  if (name === 'search_products') {
    const products = await searchProducts(args.query, args.limit);
    if (products.length === 0) {
      return { found: false, message: `No products found for "${args.query}". Try a different search term.` };
    }
    return {
      found: true,
      count: products.length,
      products: products.map(p => ({
        id: p._id,
        name: p.name,
        brand: p.brand || 'Unknown',
        price: p.price || 0,
        currency: p.currency || 'USD',
        sku: p.sku || '',
      })),
    };
  }

  if (name === 'escalate_to_support') {
    try {
      await sendSupportEmail({
        name: args.customer_name || 'Anonymous Customer',
        email: args.customer_email || 'no-reply@omnilink.com',
        orderNo: args.order_number || '',
        message: `[Chatbot Escalation]\n\n${args.issue_description}`,
      });
      return { success: true, message: 'Your issue has been escalated to the human support team. They will contact you within 24 hours.' };
    } catch (err) {
      console.warn('Escalation email failed:', err.message);
      return { success: false, message: 'Could not send email (email service may not be configured), but your issue has been logged. Please visit /contact to reach us directly.' };
    }
  }

  return { error: `Unknown function: ${name}` };
}

// ─── Main POST Handler ────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;

    if (!apiKey || apiKey === 'your_google_gemini_api_key') {
      return NextResponse.json({
        reply: '⚠️ The AI assistant is not configured yet. Please ask the admin to set GOOGLE_GENAI_API_KEY in the .env file. Get a free key at https://aistudio.google.com/app/apikey',
        products: [],
      });
    }

    const { messages: clientMessages } = await req.json();

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      systemInstruction: SYSTEM_PROMPT,
      tools,
    });

    // Build conversation history (exclude system/welcome messages)
    const history = [];
    const msgList = clientMessages || [];

    // All but the last message go into history
    for (let i = 0; i < msgList.length - 1; i++) {
      const m = msgList[i];
      history.push({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      });
    }

    const lastMessage = msgList[msgList.length - 1];
    if (!lastMessage) {
      return NextResponse.json({ reply: 'Hi! How can I help you today?', products: [] });
    }

    // Start chat with history
    const chat = model.startChat({ history });

    // Send the last user message
    let result = await chat.sendMessage(lastMessage.content);
    let response = result.response;

    let allProducts = [];

    // Handle function calls (tool use)
    let maxIterations = 3;
    while (response.candidates?.[0]?.content?.parts?.some(p => p.functionCall) && maxIterations > 0) {
      maxIterations--;
      const functionCallParts = response.candidates[0].content.parts.filter(p => p.functionCall);
      const functionResponseParts = [];

      for (const part of functionCallParts) {
        const { name, args } = part.functionCall;
        console.log(`🔧 Calling function: ${name}`, args);

        const fnResult = await executeFunctionCall(name, args);

        // Collect products for frontend
        if (name === 'search_products' && fnResult.products) {
          allProducts = [...allProducts, ...fnResult.products];
        }

        functionResponseParts.push({
          functionResponse: {
            name,
            response: fnResult,
          },
        });
      }

      // Send function results back to model
      result = await chat.sendMessage(functionResponseParts);
      response = result.response;
    }

    // Extract final text response
    const text = response.text();

    return NextResponse.json({
      reply: text || "I'm here to help! Could you please rephrase your question?",
      products: allProducts,
    });

  } catch (error) {
    const errMsg = error?.message || String(error);
    const errCode = error?.status || error?.code || 'unknown';
    console.error('🔴 Chatbot API Error:', errCode, errMsg);
    console.error('🔴 Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    let userMessage = 'Sorry, I encountered an error. Please try again.';
    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid') || errMsg.includes('INVALID_ARGUMENT')) {
      userMessage = '⚠️ Invalid API key. Please check GOOGLE_GENAI_API_KEY in the .env file.';
    } else if (errMsg.includes('quota') || errMsg.includes('QUOTA') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      userMessage = '⚠️ API quota exceeded. Please wait a moment and try again.';
    } else if (errMsg.includes('fetch') || errMsg.includes('network') || errMsg.includes('ECONNREFUSED')) {
      userMessage = '⚠️ Network error connecting to AI service. Please try again.';
    } else if (errMsg.includes('SAFETY') || errMsg.includes('safety')) {
      userMessage = "I'm sorry, I can't respond to that request. Please try a different question.";
    }
    return NextResponse.json({ reply: userMessage, products: [] });
  }
}

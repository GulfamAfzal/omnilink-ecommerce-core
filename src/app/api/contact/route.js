import { NextResponse } from 'next/server';
import { sendSupportEmail } from '@/lib/emailService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, orderNo, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
    }

    // Attempt to send email to admins via Nodemailer
    try {
      await sendSupportEmail({ name, email, orderNo, message });
    } catch (emailErr) {
      console.error("Failed to send support email:", emailErr);
      // We can still return success to the user if we just logged it,
      // but if the email is critical we return an error.
      // Usually, we return success but warn logs. Let's return error if email actually fails
      // to let the user know.
      return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

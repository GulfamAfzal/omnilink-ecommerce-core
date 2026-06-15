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
      console.error('Failed to send support email:', emailErr);

      // Distinguish between config error and SMTP error
      const isConfigError = emailErr.message?.includes('credentials') || emailErr.message?.includes('placeholder');
      if (isConfigError) {
        return NextResponse.json({
          error: 'Email service is not configured. Please set EMAIL_USER and EMAIL_PASS in your .env file.',
          details: emailErr.message,
        }, { status: 503 });
      }

      return NextResponse.json({
        error: 'Failed to send your message due to an email delivery error. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? emailErr.message : undefined,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' });

  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

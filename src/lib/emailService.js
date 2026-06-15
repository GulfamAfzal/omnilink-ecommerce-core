import nodemailer from 'nodemailer';

/**
 * emailService.js — OmniLink Order Email Notifications
 * Uses Gmail SMTP via Nodemailer to send order confirmation emails.
 *
 * Required .env variables:
 *   EMAIL_USER=your_gmail@gmail.com
 *   EMAIL_PASS=your_gmail_app_password   (NOT your real password)
 *
 * How to get Gmail App Password:
 * 1. Go to your Google Account → Security
 * 2. Enable 2-Step Verification
 * 3. Search "App passwords" → Create one for "Mail"
 * 4. Copy the 16-character code into EMAIL_PASS
 */

/**
 * Creates a Nodemailer transporter with lazy initialization.
 * Throws if credentials are missing or invalid.
 */
function createTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env');
  }

  // Detect placeholder values
  if (user === 'your_gmail@gmail.com' || pass === 'your_16_char_app_password') {
    throw new Error(
      'Email credentials are still set to placeholder values. ' +
      'Please update EMAIL_USER and EMAIL_PASS in your .env file with real Gmail credentials.'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Sends an order confirmation email to the customer.
 */
export async function sendOrderConfirmationEmail({
  toEmail,
  customerName,
  orderId,
  items = [],
  subtotal,
  taxAmount,
  totalAmount,
  currency = 'USD',
  regionName = 'Global',
}) {
  const transporter = createTransporter(); // will throw if not configured

  // Build items table rows
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #0F172A;">${item.sku || 'Product'}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #475569;">${item.quantity}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #E2E8F0; text-align: right; color: #0F172A; font-weight: 700;">${currency} ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmed — OMS OMNILINK</title>
</head>
<body style="margin:0; padding:0; background-color:#EBF2F7; font-family: 'Segoe UI', Arial, sans-serif;">

  <div style="max-width:600px; margin:32px auto; background:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1E3A5F 0%, #1E40AF 60%, #0891B2 100%); padding: 32px 40px; text-align:center;">
      <div style="font-size:22px; font-weight:900; color:#FFFFFF; letter-spacing:-0.5px;">
        OMS <span style="color:#38BDF8;">OMNILINK</span>
      </div>
      <div style="margin-top:8px; font-size:12px; color:rgba(255,255,255,0.6); letter-spacing:1px; text-transform:uppercase;">Enterprise Order Management</div>
    </div>

    <!-- Success Badge -->
    <div style="background:#DCFCE7; border-bottom: 1px solid #BBF7D0; padding: 20px 40px; text-align:center;">
      <div style="font-size:28px; margin-bottom:4px;">✓</div>
      <div style="font-size:18px; font-weight:800; color:#15803D;">Order Confirmed!</div>
      <div style="font-size:13px; color:#166534; margin-top:4px;">Your transaction has been committed successfully.</div>
    </div>

    <!-- Body -->
    <div style="padding: 32px 40px;">
      <p style="font-size:15px; color:#0F172A; margin:0 0 8px;">Hello <strong>${customerName}</strong>,</p>
      <p style="font-size:14px; color:#475569; line-height:1.6; margin:0 0 24px;">
        Thank you for your order! Your distributed transaction was committed across our Azure SQL ledger and MongoDB Atlas inventory systems.
        Here is a summary of your purchase:
      </p>

      <!-- Order ID -->
      <div style="background:#EBF2F7; border-radius:10px; padding:14px 20px; margin-bottom:24px; display:flex; justify-content:space-between;">
        <span style="font-size:13px; color:#64748B; font-weight:600;">Order Reference</span>
        <span style="font-size:14px; color:#1E40AF; font-weight:800; font-family:monospace;">#${orderId}</span>
      </div>

      <!-- Items Table -->
      <table style="width:100%; border-collapse:collapse; border-radius:10px; overflow:hidden; border: 1px solid #E2E8F0; margin-bottom:20px;">
        <thead>
          <tr style="background:#1E293B;">
            <th style="padding:12px 16px; text-align:left; font-size:11px; color:#94A3B8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Product</th>
            <th style="padding:12px 16px; text-align:center; font-size:11px; color:#94A3B8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Qty</th>
            <th style="padding:12px 16px; text-align:right; font-size:11px; color:#94A3B8; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Price Summary -->
      <div style="background:#F8FAFC; border-radius:10px; padding:16px 20px; margin-bottom:28px;">
        <div style="display:flex; justify-content:space-between; font-size:13px; color:#475569; margin-bottom:8px;">
          <span>Subtotal</span><span>${currency} ${subtotal.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:13px; color:#475569; margin-bottom:12px;">
          <span>Tax (${regionName})</span><span>${currency} ${taxAmount.toFixed(2)}</span>
        </div>
        <div style="border-top:1px solid #E2E8F0; padding-top:12px; display:flex; justify-content:space-between; font-size:17px; font-weight:900; color:#0F172A;">
          <span>Total Charged</span><span style="color:#1E40AF;">${currency} ${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <p style="font-size:13px; color:#64748B; line-height:1.6;">
        Your order status is currently <strong style="color:#B45309;">Pending</strong> and will be updated as it is processed.
        You can track your orders by logging into your account.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#0F172A; padding:20px 40px; text-align:center;">
      <div style="font-size:12px; color:#475569;">© 2026 OMS OMNILINK Systems Inc.</div>
      <div style="font-size:11px; color:#334155; margin-top:4px;">v2.0 — Glow Architecture | Azure SQL + MongoDB Atlas</div>
    </div>

  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"OMS OMNILINK" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Order #${orderId} Confirmed — OMS OMNILINK`,
    html,
  });

  console.log(`✅ Order confirmation email sent to ${toEmail}`);
}

/**
 * Sends a customer support inquiry to the administrative emails.
 */
export async function sendSupportEmail({ name, email, orderNo, message }) {
  const transporter = createTransporter(); // will throw if not configured

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Support Inquiry — OMS OMNILINK</title>
</head>
<body style="margin:0; padding:32px; background-color:#EBF2F7; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#FFFFFF; border-radius:16px; padding:32px; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <h2 style="color:#0F172A; margin-top:0;">New Support Inquiry</h2>
    <p style="color:#475569; font-size:14px;">You have received a new message from the OMNILINK Contact form.</p>
    
    <div style="background:#F4F8FA; border:1px solid #B0C4DE; border-radius:10px; padding:20px; margin-top:24px;">
      <div style="margin-bottom:12px;"><strong>Name:</strong> ${name}</div>
      <div style="margin-bottom:12px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></div>
      <div style="margin-bottom:12px;"><strong>Order Number:</strong> ${orderNo || 'N/A'}</div>
      <div style="margin-top:20px; padding-top:16px; border-top:1px solid #B0C4DE;">
        <strong>Message:</strong><br/>
        <p style="white-space: pre-wrap; color:#334155; line-height:1.6;">${message}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  await transporter.sendMail({
    from: `"OMNILINK System" <${process.env.EMAIL_USER}>`,
    to: 'gulfamafzal84@gmail.com, reehabatool3536@gmail.com',
    replyTo: email,
    subject: `Support Inquiry from ${name}${orderNo ? ` (Order #${orderNo})` : ''}`,
    html,
  });

  console.log(`✅ Support inquiry from ${email} forwarded to admins.`);
}

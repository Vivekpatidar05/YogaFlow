/**
 * Email — powered by Brevo (formerly Sendinblue)
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY BREVO instead of Resend or Gmail SMTP:
 *   • Railway blocks all SMTP ports (25, 465, 587) → Gmail/Nodemailer won't work
 *   • Resend free tier only sends to the account owner's email (testing restriction)
 *   • Brevo uses HTTPS API → Railway can't block it
 *   • Free plan: 300 emails/day, sends to ANY email address, no domain needed
 *
 * SETUP (takes 3 minutes):
 *   1. Go to https://app.brevo.com  →  Sign up free (or login)
 *   2. Top-right → My Account → SMTP & API  →  API Keys tab
 *   3. Generate a new API Key  →  copy it
 *   4. In Railway → Variables, add:
 *        BREVO_API_KEY = your_api_key_here
 *        EMAIL_FROM    = YogaFlow <hello@yogaflow.in>
 *        (you can use any "from" name — Brevo sends via their shared domain)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const https = require('https');

// ── Core send via Brevo HTTP API ──────────────────────────────────────────────
const sendEmail = async ({ to, subject, htmlContent }) => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('⚠️  BREVO_API_KEY not set in Railway env vars — email skipped');
    return { success: false, reason: 'BREVO_API_KEY not configured' };
  }

  // Parse "Name <email>" or plain "email"
  const fromRaw   = process.env.EMAIL_FROM || 'YogaFlow <hello@yogaflow.in>';
  const fromMatch = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
  const senderName  = fromMatch ? fromMatch[1].trim() : 'YogaFlow';
  const senderEmail = fromMatch ? fromMatch[2].trim() : fromRaw.trim();

  const payload = JSON.stringify({
    sender:     { name: senderName, email: senderEmail },
    to:         [{ email: to }],
    subject,
    htmlContent,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'api-key':       process.env.BREVO_API_KEY,
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`📧 Email sent to ${to} — messageId: ${data.messageId}`);
            resolve({ success: true, messageId: data.messageId });
          } else {
            console.error(`📧 Brevo error to ${to} [${res.statusCode}]:`, data.message || body);
            resolve({ success: false, reason: data.message || `HTTP ${res.statusCode}` });
          }
        } catch (e) {
          console.error('📧 Brevo parse error:', e.message);
          resolve({ success: false, reason: e.message });
        }
      });
    });
    req.on('error', (e) => {
      console.error('📧 Brevo request error:', e.message);
      resolve({ success: false, reason: e.message });
    });
    req.write(payload);
    req.end();
  });
};

// ── Date formatter ────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

// ── Base HTML template ────────────────────────────────────────────────────────
const base = (content, preheader = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>YogaFlow</title>
</head>
<body style="margin:0;padding:0;background:#F8F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:32px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #E8E2D8;overflow:hidden;max-width:580px;">

  <!-- Header -->
  <tr><td style="background:#2C5F2E;padding:24px 36px;">
    <table width="100%"><tr>
      <td style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#ffffff;">
        Yoga<span style="color:#A8D060;">Flow</span>
      </td>
      <td align="right" style="font-size:11px;color:rgba(255,255,255,0.45);letter-spacing:2px;text-transform:uppercase;">
        Booking System
      </td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 36px 28px;">${content}</td></tr>

  <!-- Footer -->
  <tr><td style="padding:18px 36px;background:#F5F0E8;border-top:1px solid #E8E2D8;">
    <p style="margin:0;font-size:11px;color:#999;line-height:1.6;">
      © ${new Date().getFullYear()} YogaFlow · All rights reserved.<br>
      If you didn't request this email, please ignore it.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;

// ── Template helpers ──────────────────────────────────────────────────────────
const H  = (t)    => `<h1 style="margin:0 0 10px;font-size:26px;font-weight:700;color:#1A3A1C;font-family:Georgia,serif;">${t}</h1>`;
const P  = (t)    => `<p  style="margin:0 0 14px;font-size:15px;color:#555;line-height:1.75;">${t}</p>`;
const Btn= (h, l) =>
  `<a href="${h}" style="display:inline-block;margin:20px 0;padding:14px 30px;background:#2C5F2E;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${l} →</a>`;
const Row= (k, v) =>
  `<tr>
     <td style="padding:10px 0;border-bottom:1px solid #F0EBE3;font-size:13px;color:#888;width:40%;">${k}</td>
     <td style="padding:10px 0;border-bottom:1px solid #F0EBE3;font-size:13px;color:#1A3A1C;font-weight:600;text-align:right;">${v}</td>
   </tr>`;

const OtpBox = (otp) => `
  <div style="background:#F5F2EC;border:2px dashed #B8D498;border-radius:12px;padding:32px;text-align:center;margin:24px 0;">
    <div style="font-size:11px;color:#888;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">One-Time Password</div>
    <div style="font-size:52px;font-weight:800;letter-spacing:14px;color:#2C5F2E;font-family:monospace;">${otp}</div>
    <div style="font-size:12px;color:#888;margin-top:10px;">Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes only</div>
  </div>
  <div style="background:#FFFBEC;border-left:3px solid #C8A84A;padding:10px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#7A5C20;margin-bottom:16px;">
    ⚠️ Never share this OTP. YogaFlow staff will never ask for it.
  </div>`;

const InfoTable = (rows) =>
  `<div style="background:#F8F5F0;border-radius:10px;padding:4px 18px;margin:20px 0;">
     <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
   </div>`;

const RefBox = (ref) =>
  `<div style="background:#EAF4E0;border:1px solid #B5D98A;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center;">
     <div style="font-size:11px;color:#5A8A3A;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Booking Reference</div>
     <div style="font-size:24px;font-weight:800;color:#2C5F2E;font-family:monospace;letter-spacing:4px;">${ref}</div>
   </div>`;

// ── Email templates ───────────────────────────────────────────────────────────
const templates = {

  otpEmail: (user, otp) => ({
    subject:     `${otp} — Your YogaFlow password reset OTP`,
    htmlContent: base(
      H('Reset your password') +
      P(`Hi ${user.firstName}, use this 6-digit code to reset your YogaFlow password.`) +
      OtpBox(otp),
      `Your OTP is ${otp}`
    ),
  }),

  emailVerification: (user, otp) => ({
    subject:     `${otp} — Verify your YogaFlow account`,
    htmlContent: base(
      H('Verify your email address') +
      P(`Hi ${user.firstName}! You're almost there — enter this code to activate your account.`) +
      OtpBox(otp) +
      P('Once verified, you can browse and book yoga sessions immediately.'),
      `Verification code: ${otp}`
    ),
  }),

  bookingConfirmation: (booking, user, session) => ({
    subject:     `✅ Confirmed — ${session.title} on ${fmtDate(booking.sessionDate)}`,
    htmlContent: base(
      H('Booking confirmed! 🧘') +
      P(`Hi ${user.firstName}, you're all set. We can't wait to see you on the mat!`) +
      RefBox(booking.bookingReference) +
      InfoTable(
        Row('Session',    session.title) +
        Row('Date',       fmtDate(booking.sessionDate)) +
        Row('Time',       booking.sessionTime) +
        Row('Duration',   `${session.duration} minutes`) +
        Row('Instructor', session.instructor.name) +
        Row('Location',   session.location?.address || '45 Green Park, Rajpur Road, Dehradun') +
        Row('Amount',     `₹${booking.payment.amount.toLocaleString('en-IN')}`) +
        Row('Payment',    `${booking.payment.method.toUpperCase()} · Pay at studio`)
      ) +
      `<div style="background:#EAF4E0;border-left:3px solid #2C5F2E;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;color:#2C5F2E;margin-bottom:20px;">
        <strong>What to bring:</strong> Comfortable clothes · Water bottle · Arrive 10 min early · Mat rentals available ₹50
      </div>` +
      P(`<strong>Cancellation policy:</strong> ${session.cancellationPolicy || 'Free cancellation up to 2 hours before the session.'}`) +
      Btn(`${process.env.FRONTEND_URL}/my-bookings`, 'View My Bookings'),
      `Booking confirmed for ${session.title}!`
    ),
  }),

  bookingCancellation: (booking, user, session) => ({
    subject:     `Booking Cancelled — ${session.title} (Ref: ${booking.bookingReference})`,
    htmlContent: base(
      H('Booking cancelled') +
      P(`Hi ${user.firstName}, your booking has been successfully cancelled.`) +
      InfoTable(
        Row('Reference', booking.bookingReference) +
        Row('Session',   session.title) +
        Row('Date',      fmtDate(booking.sessionDate)) +
        (booking.cancellation?.reason ? Row('Reason', booking.cancellation.reason) : '')
      ) +
      (booking.payment.status === 'paid'
        ? `<div style="background:#FFFBEC;border-left:3px solid #C8A84A;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;color:#7A5C20;margin-bottom:20px;">
            Refund of ₹${booking.payment.amount.toLocaleString('en-IN')} will be processed within 5–7 business days.
           </div>`
        : '') +
      Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse More Sessions')
    ),
  }),

  bookingReminder: (booking, user, session) => ({
    subject:     `⏰ Tomorrow: ${session.title} at ${booking.sessionTime}`,
    htmlContent: base(
      H("Your session is tomorrow! 🌟") +
      P(`Hi ${user.firstName}, a friendly reminder about your session tomorrow.`) +
      InfoTable(
        Row('Session',  session.title) +
        Row('Date',     fmtDate(booking.sessionDate)) +
        Row('Time',     booking.sessionTime) +
        Row('Location', session.location?.address || '45 Green Park, Rajpur Road, Dehradun')
      ) +
      P('🌙 Sleep well · 💧 Stay hydrated · 🥗 Eat light 2h before · ⏰ Arrive 10 min early') +
      Btn(`${process.env.FRONTEND_URL}/my-bookings`, 'View Booking Details')
    ),
  }),

  welcomeEmail: (user) => ({
    subject:     `Welcome to YogaFlow, ${user.firstName}! 🌿`,
    htmlContent: base(
      H(`Welcome, ${user.firstName}! 🌿`) +
      P('Your account is verified and ready. Start exploring our sessions.') +
      `<div style="margin:20px 0;">
        ${[
          '6+ yoga styles — Hatha, Vinyasa, Yin, Kundalini & more',
          'Expert RYT-certified instructors',
          'Instant booking confirmations + 24h session reminders',
          'Free cancellation up to 2 hours before any session',
        ].map(t => `
          <div style="background:#EAF4E0;border-left:3px solid #2C5F2E;padding:11px 16px;border-radius:0 6px 6px 0;font-size:14px;color:#333;margin-bottom:8px;">
            <span style="color:#2C5F2E;font-weight:bold;margin-right:8px;">›</span>${t}
          </div>`).join('')}
      </div>` +
      Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse Sessions'),
      `Welcome to YogaFlow — your account is ready!`
    ),
  }),
};

// ── Named exports ─────────────────────────────────────────────────────────────
module.exports = {
  sendEmail,
  sendOTPEmail:            (u, otp) => { const t=templates.otpEmail(u,otp);            return sendEmail({to:u.email,...t}); },
  sendEmailVerification:   (u, otp) => { const t=templates.emailVerification(u,otp);   return sendEmail({to:u.email,...t}); },
  sendBookingConfirmation: (b,u,s)  => { const t=templates.bookingConfirmation(b,u,s); return sendEmail({to:u.email,...t}); },
  sendBookingCancellation: (b,u,s)  => { const t=templates.bookingCancellation(b,u,s); return sendEmail({to:u.email,...t}); },
  sendBookingReminder:     (b)      => { const t=templates.bookingReminder(b,b.user,b.session); return sendEmail({to:b.user.email,...t}); },
  sendWelcomeEmail:        (u)      => { const t=templates.welcomeEmail(u);             return sendEmail({to:u.email,...t}); },
};

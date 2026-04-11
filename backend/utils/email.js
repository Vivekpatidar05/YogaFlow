/**
 * YogaFlow Email — using Brevo HTTP API v3
 * -------------------------------------------------------
 * Brevo (formerly Sendinblue) uses HTTPS — Railway cannot block it.
 * Free plan: 300 emails/day, ANY recipient, no domain needed.
 *
 * HOW TO SET UP (one time, 3 minutes):
 * 1. Go to https://app.brevo.com → sign up free
 * 2. Click your name (top right) → "SMTP & API" → "API Keys" tab
 * 3. Click "Generate a new API key" → name it "YogaFlow" → copy
 * 4. In Railway → Variables tab, add:
 *      BREVO_API_KEY = xkeysib-xxxxx...  (the key you just copied)
 *      EMAIL_FROM    = YogaFlow <your@email.com>
 * -------------------------------------------------------
 */

const https = require('https');

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// Core Brevo HTTP API caller
async function callBrevo(to, subject, htmlContent) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error('❌ BREVO_API_KEY is not set in Railway environment variables!');
    console.error('   Go to Railway → Your project → Variables tab → Add BREVO_API_KEY');
    return { success: false, reason: 'BREVO_API_KEY not configured' };
  }

  // Parse EMAIL_FROM like "YogaFlow <hello@example.com>"
  const fromRaw   = process.env.EMAIL_FROM || 'YogaFlow <hello@yogaflow.in>';
  const match     = fromRaw.match(/^(.*?)\s*<(.+?)>$/);
  const senderName  = match ? match[1].trim()  : 'YogaFlow';
  const senderEmail = match ? match[2].trim()  : fromRaw.trim();

  const payload = JSON.stringify({
    sender:      { name: senderName, email: senderEmail },
    to:          [{ email: to }],
    subject,
    htmlContent,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.brevo.com',
      path:     '/v3/smtp/email',
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Accept':         'application/json',
        'api-key':        apiKey,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`✅ Email sent to ${to} — Brevo messageId: ${data.messageId}`);
            resolve({ success: true, messageId: data.messageId });
          } else {
            console.error(`❌ Brevo API error [${res.statusCode}] to ${to}:`, JSON.stringify(data));
            resolve({ success: false, reason: data.message || `HTTP ${res.statusCode}` });
          }
        } catch (e) {
          console.error('❌ Brevo response parse error:', e.message, 'Raw body:', body);
          resolve({ success: false, reason: e.message });
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Brevo HTTPS request failed:', e.message);
      resolve({ success: false, reason: e.message });
    });

    req.write(payload);
    req.end();
  });
}

// ── HTML Template ──────────────────────────────────────────────────────────────
const wrap = (body, preheader = '') => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>YogaFlow</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E0D8CC;overflow:hidden;max-width:560px;">
<tr><td style="background:#2C5F2E;padding:24px 32px;">
  <span style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;">Yoga<span style="color:#A8D060;">Flow</span></span>
</td></tr>
<tr><td style="padding:32px;">${body}</td></tr>
<tr><td style="padding:16px 32px;background:#F5F0E8;border-top:1px solid #E0D8CC;">
  <p style="margin:0;font-size:11px;color:#999;">© ${new Date().getFullYear()} YogaFlow. If you didn't request this, please ignore it.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

const H   = (t) => `<h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#1A3A1C;font-family:Georgia,serif;">${t}</h1>`;
const P   = (t) => `<p style="margin:0 0 14px;font-size:15px;color:#555;line-height:1.75;">${t}</p>`;
const Btn = (href, label) => `<a href="${href}" style="display:inline-block;margin:18px 0;padding:13px 28px;background:#2C5F2E;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label} →</a>`;
const TR  = (k, v) => `<tr><td style="padding:9px 0;border-bottom:1px solid #F0EAE0;font-size:13px;color:#888;width:38%;">${k}</td><td style="padding:9px 0;border-bottom:1px solid #F0EAE0;font-size:13px;color:#1A3A1C;font-weight:600;text-align:right;">${v}</td></tr>`;
const Table = (rows) => `<div style="background:#F8F5F0;border-radius:10px;padding:4px 16px;margin:18px 0;"><table width="100%" cellpadding="0" cellspacing="0">${rows}</table></div>`;
const OtpBox = (otp) => `
<div style="background:#F0F7EC;border:2px dashed #90C860;border-radius:12px;padding:30px;text-align:center;margin:22px 0;">
  <p style="margin:0 0 10px;font-size:11px;color:#777;letter-spacing:3px;text-transform:uppercase;">One-Time Password</p>
  <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:14px;color:#2C5F2E;font-family:monospace;">${otp}</p>
  <p style="margin:10px 0 0;font-size:12px;color:#888;">Expires in ${process.env.OTP_EXPIRE_MINUTES || 10} minutes</p>
</div>
<div style="background:#FFFBEC;border-left:3px solid #D4A030;padding:10px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#7A5C20;margin-bottom:14px;">
  ⚠️ Never share this OTP with anyone. YogaFlow staff will never ask for it.
</div>`;

// ── Exported send functions ────────────────────────────────────────────────────
module.exports = {

  sendOTPEmail: (user, otp) => callBrevo(
    user.email,
    `${otp} — Your YogaFlow password reset OTP`,
    wrap(
      H('Reset your password') +
      P(`Hi ${user.firstName}, use this 6-digit code to reset your password.`) +
      OtpBox(otp)
    )
  ),

  sendEmailVerification: (user, otp) => callBrevo(
    user.email,
    `${otp} — Verify your YogaFlow account`,
    wrap(
      H('Verify your email address') +
      P(`Hi ${user.firstName}! Enter this code to activate your YogaFlow account.`) +
      OtpBox(otp) +
      P('Once verified, you can book sessions immediately.'),
      `Your verification code is ${otp}`
    )
  ),

  sendBookingConfirmation: (booking, user, session) => callBrevo(
    user.email,
    `✅ Confirmed — ${session.title} on ${fmtDate(booking.sessionDate)}`,
    wrap(
      H('Booking confirmed! 🧘') +
      P(`Hi ${user.firstName}, you're all set. See you on the mat!`) +
      `<div style="background:#EAF4E0;border:1px solid #B0D890;border-radius:10px;padding:14px 18px;margin:18px 0;text-align:center;">
        <p style="margin:0 0 4px;font-size:11px;color:#5A8A3A;letter-spacing:2px;text-transform:uppercase;">Booking Reference</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#2C5F2E;font-family:monospace;letter-spacing:4px;">${booking.bookingReference}</p>
      </div>` +
      Table(
        TR('Session',    session.title) +
        TR('Date',       fmtDate(booking.sessionDate)) +
        TR('Time',       booking.sessionTime) +
        TR('Duration',   `${session.duration} minutes`) +
        TR('Instructor', session.instructor.name) +
        TR('Location',   session.location?.address || '45 Green Park, Rajpur Road, Dehradun') +
        TR('Amount',     `₹${booking.payment.amount.toLocaleString('en-IN')}`) +
        TR('Payment',    `${booking.payment.method.toUpperCase()} · Pay at studio`)
      ) +
      `<div style="background:#EAF4E0;border-left:3px solid #2C5F2E;padding:11px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#2C5F2E;margin-bottom:18px;">
        <strong>What to bring:</strong> Comfortable clothes · Water bottle · Arrive 10 min early
      </div>` +
      Btn(`${process.env.FRONTEND_URL}/my-bookings`, 'View My Bookings')
    )
  ),

  sendBookingCancellation: (booking, user, session) => callBrevo(
    user.email,
    `Booking Cancelled — Ref: ${booking.bookingReference}`,
    wrap(
      H('Booking cancelled') +
      P(`Hi ${user.firstName}, your booking has been cancelled.`) +
      Table(
        TR('Reference', booking.bookingReference) +
        TR('Session',   session.title) +
        TR('Date',      fmtDate(booking.sessionDate)) +
        (booking.cancellation?.reason ? TR('Reason', booking.cancellation.reason) : '')
      ) +
      Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse More Sessions')
    )
  ),

  sendBookingReminder: (booking) => callBrevo(
    booking.user.email,
    `⏰ Tomorrow: ${booking.session.title} at ${booking.sessionTime}`,
    wrap(
      H('Your session is tomorrow!') +
      P(`Hi ${booking.user.firstName}, a quick reminder about tomorrow.`) +
      Table(
        TR('Session',  booking.session.title) +
        TR('Date',     fmtDate(booking.sessionDate)) +
        TR('Time',     booking.sessionTime) +
        TR('Location', booking.session.location?.address || '45 Green Park, Dehradun')
      ) +
      P('Sleep well · Stay hydrated · Eat light 2h before · Arrive 10 minutes early')
    )
  ),

  sendWelcomeEmail: (user) => callBrevo(
    user.email,
    `Welcome to YogaFlow, ${user.firstName}! 🌿`,
    wrap(
      H(`Welcome, ${user.firstName}! 🌿`) +
      P('Your account is verified. Start exploring sessions and book your first class.') +
      ['6+ yoga styles — Hatha, Vinyasa, Yin, Kundalini & more',
       'Expert RYT-certified instructors',
       'Instant booking confirmations + 24h reminders',
       'Free cancellation up to 2 hours before sessions']
        .map(t => `<div style="background:#EAF4E0;border-left:3px solid #2C5F2E;padding:10px 14px;border-radius:0 6px 6px 0;font-size:14px;color:#333;margin-bottom:8px;"><span style="color:#2C5F2E;font-weight:bold;margin-right:8px;">›</span>${t}</div>`)
        .join('') +
      Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse Sessions'),
      'Your YogaFlow account is ready!'
    )
  ),
};

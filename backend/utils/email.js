/**
 * Email utility using Resend (https://resend.com)
 * Resend uses HTTP API — NO SMTP ports needed — works on Railway free tier.
 *
 * Setup:
 *  1. Go to https://resend.com → create free account
 *  2. API Keys → Create API Key → copy it
 *  3. Add to Railway env vars: RESEND_API_KEY=re_xxxxxxxxxxxx
 *  4. From address: use "onboarding@resend.dev" (free, no domain needed)
 *     OR add your own domain in Resend dashboard for custom from address
 */

const { Resend } = require('resend');

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'YogaFlow <onboarding@resend.dev>';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// ── Base email template ───────────────────────────────────────────────────────
const base = (content, preheader = '') => `
<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>YogaFlow</title></head>
<body style="margin:0;padding:0;background:#F8F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F5F0;padding:32px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #E8E0D5;overflow:hidden;">

  <!-- Header -->
  <tr><td style="background:#2C5F2E;padding:24px 36px;">
    <table width="100%"><tr>
      <td style="font-size:22px;font-weight:700;color:#ffffff;font-family:Georgia,serif;">
        Yoga<span style="color:#A8D060;">Flow</span>
      </td>
      <td align="right" style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">
        Studio
      </td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:36px 36px 28px;">${content}</td></tr>

  <!-- Footer -->
  <tr><td style="padding:18px 36px;background:#F8F5F0;border-top:1px solid #E8E0D5;">
    <p style="margin:0;font-size:11px;color:#999;line-height:1.6;">
      © ${new Date().getFullYear()} YogaFlow · All rights reserved.<br>
      If you didn't request this, you can safely ignore this email.
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

const H1  = (t) => `<h1 style="margin:0 0 10px;font-size:26px;font-weight:700;color:#1A3A1C;font-family:Georgia,serif;">${t}</h1>`;
const P   = (t) => `<p style="margin:0 0 14px;font-size:15px;color:#555;line-height:1.75;">${t}</p>`;
const Btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;margin:20px 0;padding:14px 30px;background:#2C5F2E;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
    ${label} →
  </a>`;
const Row = (k, v) =>
  `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #F0EBE3;font-size:13px;color:#888;width:40%;">${k}</td>
    <td style="padding:10px 0;border-bottom:1px solid #F0EBE3;font-size:13px;color:#1A3A1C;font-weight:600;text-align:right;">${v}</td>
  </tr>`;

const OtpBox = (otp) =>
  `<div style="background:#F8F5F0;border:2px dashed #C8B88A;border-radius:12px;padding:32px;text-align:center;margin:24px 0;">
    <div style="font-size:11px;color:#999;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Your One-Time Password</div>
    <div style="font-size:52px;font-weight:800;letter-spacing:14px;color:#2C5F2E;font-family:monospace;">${otp}</div>
    <div style="font-size:12px;color:#999;margin-top:10px;">Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes only</div>
  </div>
  <div style="background:#FFF8EC;border-left:3px solid #C8B88A;padding:10px 14px;border-radius:0 6px 6px 0;font-size:13px;color:#8A7050;margin-bottom:16px;">
    Never share this OTP. YogaFlow staff will never ask for it.
  </div>`;

const InfoTable = (rows) =>
  `<div style="background:#F8F5F0;border-radius:10px;padding:4px 18px;margin:20px 0;">
    <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  </div>`;

const RefBox = (ref) =>
  `<div style="background:#F0F7EC;border:1px solid #B8D4A0;border-radius:10px;padding:16px 20px;margin:20px 0;text-align:center;">
    <div style="font-size:11px;color:#5A8A40;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Booking Reference</div>
    <div style="font-size:24px;font-weight:800;color:#2C5F2E;font-family:monospace;letter-spacing:4px;">${ref}</div>
  </div>`;

// ── Templates ─────────────────────────────────────────────────────────────────
const templates = {

  otpEmail: (user, otp) => ({
    subject: `${otp} — Your YogaFlow password reset OTP`,
    html: base(
      H1('Reset your password') +
      P(`Hi ${user.firstName}, use this 6-digit code to reset your YogaFlow password.`) +
      OtpBox(otp),
      `Your OTP is ${otp}`
    ),
  }),

  emailVerification: (user, otp) => ({
    subject: `${otp} — Verify your YogaFlow account`,
    html: base(
      H1('Verify your email') +
      P(`Hi ${user.firstName}! One step left — enter this code to activate your YogaFlow account.`) +
      OtpBox(otp) +
      P('Once verified, you can browse and book yoga sessions immediately.'),
      `Verification code: ${otp}`
    ),
  }),

  bookingConfirmation: (booking, user, session) => ({
    subject: `✅ Booking Confirmed — ${session.title} on ${fmtDate(booking.sessionDate)}`,
    html: base(
      H1('Booking confirmed! 🧘') +
      P(`Hi ${user.firstName}, you're all set. We can't wait to see you on the mat!`) +
      RefBox(booking.bookingReference) +
      InfoTable(
        Row('Session',    session.title) +
        Row('Date',       fmtDate(booking.sessionDate)) +
        Row('Time',       booking.sessionTime) +
        Row('Duration',   session.duration + ' minutes') +
        Row('Instructor', session.instructor.name) +
        Row('Location',   session.location?.address || '45 Green Park, Rajpur Road, Dehradun') +
        Row('Amount',     '₹' + booking.payment.amount.toLocaleString('en-IN')) +
        Row('Payment',    booking.payment.method.toUpperCase() + ' · Pay at studio')
      ) +
      `<div style="background:#F0F7EC;border-left:3px solid #2C5F2E;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;color:#4A7A30;margin-bottom:20px;">
        <strong>What to bring:</strong> Comfortable clothes · Water bottle · Arrive 10 min early · Mat available to rent ₹50
      </div>` +
      P(`<strong>Cancellation policy:</strong> ${session.cancellationPolicy || 'Free cancellation up to 2 hours before the session.'}`) +
      Btn(`${process.env.FRONTEND_URL}/my-bookings`, 'View My Bookings'),
      `Booking confirmed for ${session.title}!`
    ),
  }),

  bookingCancellation: (booking, user, session) => ({
    subject: `Booking Cancelled — ${session.title} (Ref: ${booking.bookingReference})`,
    html: base(
      H1('Booking cancelled') +
      P(`Hi ${user.firstName}, your booking has been successfully cancelled.`) +
      InfoTable(
        Row('Reference', booking.bookingReference) +
        Row('Session',   session.title) +
        Row('Date',      fmtDate(booking.sessionDate)) +
        (booking.cancellation?.reason ? Row('Reason', booking.cancellation.reason) : '')
      ) +
      (booking.payment.status === 'paid'
        ? `<div style="background:#FFF8EC;border-left:3px solid #C8B88A;padding:12px 16px;border-radius:0 6px 6px 0;font-size:13px;color:#8A7050;margin-bottom:20px;">
            Refund of ₹${booking.payment.amount.toLocaleString('en-IN')} will be processed within 5–7 business days.
           </div>`
        : '') +
      Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse More Sessions')
    ),
  }),

  bookingReminder: (booking, user, session) => ({
    subject: `⏰ Tomorrow: ${session.title} at ${booking.sessionTime}`,
    html: base(
      H1('Your session is tomorrow!') +
      P(`Hi ${user.firstName}, a reminder for your session tomorrow.`) +
      InfoTable(
        Row('Session',  session.title) +
        Row('Date',     fmtDate(booking.sessionDate)) +
        Row('Time',     booking.sessionTime) +
        Row('Location', session.location?.address || '45 Green Park, Rajpur Road, Dehradun')
      ) +
      P('Get good sleep · Stay hydrated · Eat light 2h before · Arrive 10 min early') +
      Btn(`${process.env.FRONTEND_URL}/my-bookings`, 'View Booking')
    ),
  }),

  welcomeEmail: (user) => ({
    subject: `Welcome to YogaFlow, ${user.firstName}! 🌿`,
    html: base(
      H1(`Welcome, ${user.firstName}! 🌿`) +
      P('Your account is verified and ready. Start exploring our sessions and book your first class.') +
      `<div style="margin:20px 0;">
        ${[
          '6+ yoga styles — Hatha, Vinyasa, Yin, Kundalini & more',
          'Expert RYT-certified instructors',
          'Instant booking confirmations + 24h reminders',
          'Free cancellation up to 2 hours before sessions',
        ].map(t => `<div style="background:#F0F7EC;border-left:3px solid #2C5F2E;padding:11px 16px;border-radius:0 6px 6px 0;font-size:14px;color:#444;margin-bottom:8px;">
          <span style="color:#2C5F2E;margin-right:8px;">›</span>${t}
        </div>`).join('')}
      </div>` +
      Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse Sessions'),
      `Welcome to YogaFlow — your account is ready!`
    ),
  }),
};

// ── Core send function ────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY not set — email not sent. Add it to Railway env vars.');
    return { success: false, reason: 'RESEND_API_KEY not configured' };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({ from: FROM, to: [to], subject, html });

    if (error) {
      console.error(`📧 Resend error to ${to}:`, error.message);
      return { success: false, reason: error.message };
    }

    console.log(`📧 Email sent to ${to} — id: ${data.id}`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error(`📧 Email exception to ${to}:`, err.message);
    return { success: false, reason: err.message };
  }
};

// ── Named exports ─────────────────────────────────────────────────────────────
module.exports = {
  sendOTPEmail: (u, otp) => {
    const { subject, html } = templates.otpEmail(u, otp);
    return sendEmail({ to: u.email, subject, html });
  },
  sendEmailVerification: (u, otp) => {
    const { subject, html } = templates.emailVerification(u, otp);
    return sendEmail({ to: u.email, subject, html });
  },
  sendBookingConfirmation: (b, u, s) => {
    const { subject, html } = templates.bookingConfirmation(b, u, s);
    return sendEmail({ to: u.email, subject, html });
  },
  sendBookingCancellation: (b, u, s) => {
    const { subject, html } = templates.bookingCancellation(b, u, s);
    return sendEmail({ to: u.email, subject, html });
  },
  sendBookingReminder: (b) => {
    const { subject, html } = templates.bookingReminder(b, b.user, b.session);
    return sendEmail({ to: b.user.email, subject, html });
  },
  sendWelcomeEmail: (u) => {
    const { subject, html } = templates.welcomeEmail(u);
    return sendEmail({ to: u.email, subject, html });
  },
};

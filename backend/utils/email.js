const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
});

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const base = (content, preheader = '') => `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>YogaFlow</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;border:1px solid #252525;overflow:hidden;">
<tr><td style="background:#0f0f0f;padding:24px 36px;border-bottom:1px solid #252525;">
  <table width="100%"><tr>
    <td><span style="font-size:20px;font-weight:700;color:#f0f0f0;">Yoga<span style="color:#c9a84c;">Flow</span></span></td>
    <td align="right"><span style="font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">Booking System</span></td>
  </tr></table>
</td></tr>
<tr><td style="padding:32px 36px;">${content}</td></tr>
<tr><td style="padding:18px 36px;border-top:1px solid #252525;background:#0f0f0f;">
  <p style="margin:0;font-size:11px;color:#3a3a3a;line-height:1.6;">© ${new Date().getFullYear()} YogaFlow · All rights reserved. If you didn't request this, please ignore this email.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

const H = (t) => `<h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#f0f0f0;letter-spacing:-0.5px;">${t}</h1>`;
const P = (t) => `<p style="margin:0 0 14px;font-size:14px;color:#888;line-height:1.75;">${t}</p>`;
const Row = (k, v) => `<tr><td style="padding:9px 0;border-bottom:1px solid #1e1e1e;font-size:13px;color:#555;">${k}</td><td style="padding:9px 0;border-bottom:1px solid #1e1e1e;font-size:13px;color:#e0e0e0;font-weight:600;text-align:right;">${v}</td></tr>`;
const Btn = (href, label) => `<a href="${href}" style="display:inline-block;margin:20px 0;padding:13px 28px;background:#c9a84c;color:#0a0a0a;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px;">${label} →</a>`;

const otpBox = (otp) => `
<div style="background:#0f0f0f;border:1px solid #252525;border-radius:12px;padding:28px;text-align:center;margin:20px 0;">
  <div style="font-size:10px;color:#444;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">One-Time Password</div>
  <div style="font-size:48px;font-weight:800;letter-spacing:12px;color:#c9a84c;font-family:monospace;">${otp}</div>
  <div style="font-size:12px;color:#444;margin-top:10px;">Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes only</div>
</div>
<div style="background:#1a1500;border-left:3px solid #c9a84c;padding:10px 14px;font-size:12px;color:#777;margin-bottom:16px;">
  Never share this OTP. YogaFlow staff will never ask for it.
</div>`;

const infoTable = (rows) => `
<div style="background:#0f0f0f;border:1px solid #1e1e1e;border-radius:10px;padding:4px 18px;margin:20px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
</div>`;

const templates = {
  otpEmail: (user, otp) => ({
    subject: `${otp} is your YogaFlow OTP`,
    html: base(`${H('Reset your password')}${P(`Hi ${user.firstName}, use this code to reset your password.`)}${otpBox(otp)}`, `Your OTP: ${otp}`)
  }),
  emailVerification: (user, otp) => ({
    subject: `${otp} — Verify your YogaFlow account`,
    html: base(`${H('Verify your email')}${P(`Hi ${user.firstName}, enter this code to activate your account.`)}${otpBox(otp)}${P('Once verified, you can book sessions immediately.')}`, `Verification code: ${otp}`)
  }),
  bookingConfirmation: (booking, user, session) => ({
    subject: `Confirmed · ${session.title} · ${fmtDate(booking.sessionDate)}`,
    html: base(`
      ${H('Booking confirmed!')}
      ${P(`Hi ${user.firstName}, you're all set. See you on the mat!`)}
      <div style="background:#0f0f0f;border:1px solid #1e1e1e;border-radius:10px;padding:16px 18px;margin:20px 0;">
        <div style="font-size:10px;color:#444;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Booking Reference</div>
        <div style="font-size:22px;font-weight:800;color:#c9a84c;font-family:monospace;letter-spacing:4px;">${booking.bookingReference}</div>
      </div>
      ${infoTable(
        Row('Session', session.title) +
        Row('Date', fmtDate(booking.sessionDate)) +
        Row('Time', booking.sessionTime) +
        Row('Duration', session.duration + ' min') +
        Row('Instructor', session.instructor.name) +
        Row('Location', session.location?.address || '45 Green Park, Rajpur Road, Dehradun') +
        Row('Amount', '₹' + booking.payment.amount.toLocaleString('en-IN')) +
        Row('Payment', booking.payment.method.toUpperCase() + ' · Pay at studio')
      )}
      <div style="background:#0f0f0f;border-left:3px solid #c9a84c;padding:12px 14px;font-size:13px;color:#666;margin-bottom:16px;">
        <strong style="color:#c9a84c;">What to bring:</strong> Comfortable clothes · Water bottle · Arrive 10 min early
      </div>
      ${Btn(`${process.env.FRONTEND_URL}/my-bookings`, 'View My Bookings')}
    `, `Booking confirmed for ${session.title}`)
  }),
  bookingCancellation: (booking, user, session) => ({
    subject: `Cancelled · ${session.title} · Ref: ${booking.bookingReference}`,
    html: base(`
      ${H('Booking cancelled')}
      ${P(`Hi ${user.firstName}, your booking has been cancelled.`)}
      ${infoTable(
        Row('Reference', booking.bookingReference) +
        Row('Session', session.title) +
        Row('Date', fmtDate(booking.sessionDate)) +
        (booking.cancellation?.reason ? Row('Reason', booking.cancellation.reason) : '')
      )}
      ${booking.payment.status === 'paid' ? `<div style="background:#1a1500;border-left:3px solid #c9a84c;padding:12px 14px;font-size:13px;color:#888;margin-bottom:16px;">Refund of ₹${booking.payment.amount.toLocaleString('en-IN')} will be processed in 5–7 business days.</div>` : ''}
      ${Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse More Sessions')}
    `)
  }),
  bookingReminder: (booking, user, session) => ({
    subject: `Tomorrow · ${session.title} at ${booking.sessionTime}`,
    html: base(`
      ${H("Tomorrow's session")}
      ${P(`Hi ${user.firstName}, just a reminder for your session tomorrow.`)}
      ${infoTable(Row('Session', session.title) + Row('Date', fmtDate(booking.sessionDate)) + Row('Time', booking.sessionTime) + Row('Location', session.location?.address || '45 Green Park, Dehradun'))}
      ${P('Sleep well · Stay hydrated · Eat light 2h before · Arrive 10 min early')}
    `)
  }),
  welcomeEmail: (user) => ({
    subject: `Welcome to YogaFlow, ${user.firstName}!`,
    html: base(`
      ${H(`Welcome, ${user.firstName}!`)}
      ${P('Your account is verified and ready. Start exploring our sessions.')}
      <div style="margin:20px 0;">
        ${['6+ yoga styles — Hatha, Vinyasa, Yin, Kundalini & more',
           'Expert RYT-certified instructors',
           'Instant email confirmations + 24h reminders',
           'Free cancellation up to 2 hours before'].map(t => `
          <div style="background:#0f0f0f;border:1px solid #1e1e1e;border-radius:8px;padding:11px 14px;font-size:13px;color:#777;margin-bottom:8px;">
            <span style="color:#c9a84c;margin-right:8px;">›</span>${t}
          </div>`).join('')}
      </div>
      ${Btn(`${process.env.FRONTEND_URL}/sessions`, 'Browse Sessions')}
    `, 'Your YogaFlow account is ready')
  }),
};

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email config missing — skipping send');
    return { success: false, reason: 'Email not configured' };
  }
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `YogaFlow <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`📧 Sent to ${to} — ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('📧 Email error:', err.message);
    return { success: false, reason: err.message };
  }
};

module.exports = {
  sendOTPEmail: (u, otp) => { const {subject,html} = templates.otpEmail(u,otp); return sendEmail({to:u.email,subject,html}); },
  sendEmailVerification: (u, otp) => { const {subject,html} = templates.emailVerification(u,otp); return sendEmail({to:u.email,subject,html}); },
  sendBookingConfirmation: (b, u, s) => { const {subject,html} = templates.bookingConfirmation(b,u,s); return sendEmail({to:u.email,subject,html}); },
  sendBookingCancellation: (b, u, s) => { const {subject,html} = templates.bookingCancellation(b,u,s); return sendEmail({to:u.email,subject,html}); },
  sendBookingReminder: (b) => { const {subject,html} = templates.bookingReminder(b,b.user,b.session); return sendEmail({to:b.user.email,subject,html}); },
  sendWelcomeEmail: (u) => { const {subject,html} = templates.welcomeEmail(u); return sendEmail({to:u.email,subject,html}); },
};

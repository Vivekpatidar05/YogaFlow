require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const cron      = require('node-cron');

const app = express();

// ── CRITICAL: Set trust proxy FIRST before rate limiters ─────────────────────
// Railway runs behind a reverse proxy — without this you get
// "X-Forwarded-For" errors and rate limiting breaks
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    /\.vercel\.app$/,
    /\.railway\.app$/,
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials:    true,
  methods:        ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// Rate limiters
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests.' },
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts.' },
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Database ───────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB connected'); seedDatabase(); })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/admin',    require('./routes/admin'));

// Health check — open this URL in your browser to confirm the server is running
app.get('/api/health', (req, res) => res.json({
  success: true,
  message: 'YogaFlow API running 🧘',
  time:    new Date().toISOString(),
  env:     process.env.NODE_ENV,
}));

// ── TEST EMAIL ENDPOINT — call this to verify Brevo is working ────────────────
// GET /api/test-email?to=your@email.com
// Remove or protect this in production after testing!
app.get('/api/test-email', async (req, res) => {
  const to = req.query.to;
  if (!to) return res.status(400).json({ success: false, message: 'Add ?to=your@email.com' });

  const { sendEmailVerification } = require('./utils/email');
  const result = await sendEmailVerification(
    { firstName: 'Test', email: to },
    '123456'
  );

  res.json({
    success: result.success,
    message: result.success ? `✅ Test email sent to ${to}` : `❌ Failed: ${result.reason}`,
    brevo_key_set: !!process.env.BREVO_API_KEY,
    brevo_key_preview: process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.substring(0, 15) + '...' : 'NOT SET',
    email_from: process.env.EMAIL_FROM || 'NOT SET',
  });
});

// ── Error handlers ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Cron: clean OTPs ──────────────────────────────────────────────────────────
cron.schedule('0 * * * *', async () => {
  const User = require('./models/User');
  await User.updateMany({ 'otp.expiresAt': { $lt: new Date() } }, { $unset: { otp: 1 } });
  console.log('🧹 Expired OTPs cleaned');
});

// ── Cron: reminders ───────────────────────────────────────────────────────────
cron.schedule('0 9 * * *', async () => {
  const { sendBookingReminder } = require('./utils/email');
  const Booking = require('./models/Booking');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDay   = new Date(tomorrow); nextDay.setDate(nextDay.getDate() + 1);
  const bookings  = await Booking.find({
    status: 'confirmed', sessionDate: { $gte: tomorrow, $lt: nextDay }
  }).populate('user session');
  for (const b of bookings) {
    try { await sendBookingReminder(b); } catch (e) { console.error('Reminder failed:', e.message); }
  }
  console.log(`📧 Sent ${bookings.length} reminders`);
});

// ── Seeder ────────────────────────────────────────────────────────────────────
async function seedDatabase() {
  const Session = require('./models/Session');
  if (await Session.countDocuments() > 0) return;
  const gs = (time, days) => {
    const m = {Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
    return days.map(day => ({ day, time, dayIndex: m[day] }));
  };
  await Session.insertMany([
    { title:'Morning Hatha Flow', description:'Grounding Hatha yoga for all levels. Foundational poses and breathing to start your day.', type:'Hatha', instructor:{name:'Priya Sharma',bio:'Certified RYT-500 with 12 years experience',avatar:'https://i.pravatar.cc/150?img=47'}, duration:60, maxCapacity:12, price:800, level:'Beginner', tags:['morning'], schedule:gs('07:00',['Monday','Wednesday','Friday']), image:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800', isActive:true },
    { title:'Power Vinyasa', description:'Dynamic heat-building flow. Inversions, arm balances, strength and flexibility.', type:'Vinyasa', instructor:{name:'Arjun Mehta',bio:'Former athlete turned yoga teacher',avatar:'https://i.pravatar.cc/150?img=33'}, duration:75, maxCapacity:10, price:1000, level:'Intermediate', tags:['strength'], schedule:gs('18:00',['Tuesday','Thursday','Saturday']), image:'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800', isActive:true },
    { title:'Yin & Restore', description:'Deep passive stretching 3-5 min per pose. Relaxation and flexibility.', type:'Yin', instructor:{name:'Meera Nair',bio:'Yin specialist trained in Bali',avatar:'https://i.pravatar.cc/150?img=44'}, duration:90, maxCapacity:15, price:900, level:'All Levels', tags:['relaxation'], schedule:gs('19:30',['Monday','Wednesday','Sunday']), image:'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800', isActive:true },
    { title:'Kundalini Awakening', description:'Kriyas, pranayama, mantra and meditation. Transform from root to crown.', type:'Kundalini', instructor:{name:'Priya Sharma',bio:'Certified RYT-500',avatar:'https://i.pravatar.cc/150?img=47'}, duration:90, maxCapacity:8, price:1200, level:'All Levels', tags:['spiritual'], schedule:gs('06:30',['Tuesday','Friday','Sunday']), image:'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800', isActive:true },
    { title:'Ashtanga Primary', description:'Mysore-style. Set sequence with breath and drishti. Strength and clarity.', type:'Ashtanga', instructor:{name:'Arjun Mehta',bio:'Former athlete turned yoga teacher',avatar:'https://i.pravatar.cc/150?img=33'}, duration:90, maxCapacity:8, price:1100, level:'Advanced', tags:['traditional'], schedule:gs('06:00',['Monday','Wednesday','Friday','Saturday']), image:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800', isActive:true },
    { title:'Prenatal Yoga', description:'Gentle yoga for expectant mothers. All trimesters welcome with doctor clearance.', type:'Prenatal', instructor:{name:'Meera Nair',bio:'Certified prenatal instructor',avatar:'https://i.pravatar.cc/150?img=44'}, duration:60, maxCapacity:10, price:850, level:'Beginner', tags:['prenatal'], schedule:gs('10:00',['Tuesday','Thursday','Saturday']), image:'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800', isActive:true },
  ]);
  console.log('🌱 Seeded 6 yoga sessions');
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT} [${process.env.NODE_ENV}]`));
module.exports = app;

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const bookingRoutes = require('./routes/bookings');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://yogaflow.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.' }
});

// ── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Database Connection ──────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected successfully');
    seedDatabase(); // Seed initial sessions
  })
  .catch(err => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'YogaFlow API is running 🧘',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Cron Jobs ─────────────────────────────────────────────────────────────────
// Clean up expired OTPs every hour
cron.schedule('0 * * * *', async () => {
  const User = require('./models/User');
  await User.updateMany(
    { 'otp.expiresAt': { $lt: new Date() } },
    { $unset: { otp: 1 } }
  );
  console.log('🧹  Expired OTPs cleaned up');
});

// Send reminder emails 24h before sessions
cron.schedule('0 9 * * *', async () => {
  const { sendBookingReminder } = require('./utils/email');
  const Booking = require('./models/Booking');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const bookings = await Booking.find({
    status: 'confirmed',
    sessionDate: { $gte: tomorrow, $lt: dayAfter }
  }).populate('user session');

  for (const booking of bookings) {
    try {
      await sendBookingReminder(booking);
    } catch (e) {
      console.error('Reminder email failed:', e.message);
    }
  }
  console.log(`📧  Sent ${bookings.length} reminder emails`);
});

// ── Database Seeder ───────────────────────────────────────────────────────────
async function seedDatabase() {
  const Session = require('./models/Session');
  const count = await Session.countDocuments();
  if (count > 0) return;

  const sessions = [
    {
      title: 'Morning Hatha Flow',
      description: 'Start your day with grounding Hatha yoga. Perfect for all levels, this session focuses on foundational poses and conscious breathing to awaken your body and set a peaceful tone.',
      type: 'Hatha',
      instructor: { name: 'Priya Sharma', bio: 'Certified RYT-500 with 12 years of teaching experience', avatar: 'https://i.pravatar.cc/150?img=47' },
      duration: 60,
      maxCapacity: 12,
      price: 800,
      level: 'Beginner',
      tags: ['morning', 'relaxation', 'foundation'],
      schedule: generateWeeklySchedule('07:00', ['Monday', 'Wednesday', 'Friday']),
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format',
      isActive: true
    },
    {
      title: 'Power Vinyasa',
      description: 'A dynamic, heat-building flow that links movement with breath. Challenge yourself with strong sequences, inversions, and arm balances. Build strength, flexibility and focus.',
      type: 'Vinyasa',
      instructor: { name: 'Arjun Mehta', bio: 'Former professional athlete turned yoga teacher, specializing in athletic performance', avatar: 'https://i.pravatar.cc/150?img=33' },
      duration: 75,
      maxCapacity: 10,
      price: 1000,
      level: 'Intermediate',
      tags: ['strength', 'cardio', 'flow'],
      schedule: generateWeeklySchedule('18:00', ['Tuesday', 'Thursday', 'Saturday']),
      image: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&auto=format',
      isActive: true
    },
    {
      title: 'Yin & Restore',
      description: 'Deep passive stretching held for 3-5 minutes per pose. Targets connective tissue, improves flexibility, and invites profound relaxation. Perfect for winding down.',
      type: 'Yin',
      instructor: { name: 'Meera Nair', bio: 'Yin Yoga specialist and meditation teacher trained in Bali', avatar: 'https://i.pravatar.cc/150?img=44' },
      duration: 90,
      maxCapacity: 15,
      price: 900,
      level: 'All Levels',
      tags: ['relaxation', 'flexibility', 'evening'],
      schedule: generateWeeklySchedule('19:30', ['Monday', 'Wednesday', 'Sunday']),
      image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&auto=format',
      isActive: true
    },
    {
      title: 'Kundalini Awakening',
      description: 'Ancient technology for nervous system reset. Includes kriyas, breathwork (pranayama), mantra, and meditation. Transform your energy from root to crown.',
      type: 'Kundalini',
      instructor: { name: 'Priya Sharma', bio: 'Certified RYT-500 with 12 years of teaching experience', avatar: 'https://i.pravatar.cc/150?img=47' },
      duration: 90,
      maxCapacity: 8,
      price: 1200,
      level: 'All Levels',
      tags: ['spiritual', 'breathwork', 'meditation'],
      schedule: generateWeeklySchedule('06:30', ['Tuesday', 'Friday', 'Sunday']),
      image: 'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&auto=format',
      isActive: true
    },
    {
      title: 'Ashtanga Primary Series',
      description: 'The traditional Mysore-style practice. A set sequence of poses synchronized with breath and drishti. Builds tremendous strength, flexibility, and mental clarity through consistent practice.',
      type: 'Ashtanga',
      instructor: { name: 'Arjun Mehta', bio: 'Former professional athlete turned yoga teacher', avatar: 'https://i.pravatar.cc/150?img=33' },
      duration: 90,
      maxCapacity: 8,
      price: 1100,
      level: 'Advanced',
      tags: ['traditional', 'strength', 'discipline'],
      schedule: generateWeeklySchedule('06:00', ['Monday', 'Wednesday', 'Friday', 'Saturday']),
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&auto=format',
      isActive: true
    },
    {
      title: 'Prenatal Yoga',
      description: 'Gentle, nurturing yoga specifically designed for expectant mothers. Safe modifications, breathwork for labor, and community support. All trimesters welcome with doctor clearance.',
      type: 'Prenatal',
      instructor: { name: 'Meera Nair', bio: 'Yin Yoga specialist and certified prenatal instructor', avatar: 'https://i.pravatar.cc/150?img=44' },
      duration: 60,
      maxCapacity: 10,
      price: 850,
      level: 'Beginner',
      tags: ['gentle', 'prenatal', 'community'],
      schedule: generateWeeklySchedule('10:00', ['Tuesday', 'Thursday', 'Saturday']),
      image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800&auto=format',
      isActive: true
    }
  ];

  await Session.insertMany(sessions);
  console.log('🌱  Database seeded with', sessions.length, 'yoga sessions');
}

function generateWeeklySchedule(time, days) {
  const dayMap = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  return days.map(day => ({ day, time, dayIndex: dayMap[day] }));
}

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  YogaFlow server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;

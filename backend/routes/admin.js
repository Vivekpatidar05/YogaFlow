const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalSessions, totalBookings, revenueData] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Session.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] }, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ])
    ]);

    const recentBookings = await Booking.find()
      .populate('user', 'firstName lastName email')
      .populate('session', 'title type')
      .sort({ createdAt: -1 })
      .limit(10);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$payment.amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Popular sessions
    const popularSessions = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed', 'completed'] } } },
      { $group: { _id: '$session', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'sessions', localField: '_id', foreignField: '_id', as: 'session' } },
      { $unwind: '$session' },
      { $project: { session: { title: 1, type: 1, instructor: 1 }, count: 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSessions,
        totalBookings,
        totalRevenue: revenueData[0]?.total || 0,
        monthlyRevenue,
        popularSessions,
        recentBookings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/bookings ────────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('session', 'title type instructor level price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, bookings, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/users ───────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -otp -refreshTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/bookings/:id/checkin ──────────────────────────────────────
router.patch('/bookings/:id/checkin', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { checkedIn: true, checkedInAt: new Date(), 'payment.status': 'paid', 'payment.paidAt': new Date() },
      { new: true }
    ).populate('user', 'firstName lastName').populate('session', 'title');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, message: 'Checked in successfully.', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/create-admin — Create admin account ───────────────────────
router.post('/create-admin', async (req, res) => {
  try {
    const { email, secretKey } = req.body;
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ success: false, message: 'Invalid admin secret key.' });
    }
    await User.findOneAndUpdate({ email }, { role: 'admin' });
    res.json({ success: true, message: `${email} has been granted admin access.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

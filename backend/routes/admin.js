const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');
const { sendBookingCancellation } = require('../utils/email');

router.use(protect, adminOnly);

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalSessions, totalBookings, revData] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Session.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: ['confirmed','completed'] } } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } },
      ]),
    ]);

    const recentBookings = await Booking.find()
      .populate('user', 'firstName lastName email')
      .populate('session', 'title type price')
      .sort({ createdAt: -1 }).limit(10).lean();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['confirmed','completed'] } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$payment.amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const popularSessions = await Booking.aggregate([
      { $match: { status: { $in: ['confirmed','completed'] } } },
      { $group: { _id: '$session', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'sessions', localField: '_id', foreignField: '_id', as: 'session' } },
      { $unwind: '$session' },
      { $project: { session: { title: 1, type: 1, instructor: 1, price: 1 }, count: 1 } },
    ]);

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(); todayEnd.setHours(23,59,59,999);
    const todayBookings  = await Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } });
    const todayRevenue   = await Booking.aggregate([
      { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, status: { $in: ['confirmed','completed'] } } },
      { $group: { _id: null, total: { $sum: '$payment.amount' } } },
    ]);

    // Booking status breakdown
    const statusBreakdown = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalSessions, totalBookings,
        totalRevenue:   revData[0]?.total || 0,
        todayBookings,
        todayRevenue:   todayRevenue[0]?.total || 0,
        monthlyRevenue,
        popularSessions,
        recentBookings,
        statusBreakdown,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/bookings ────────────────────────────────────────────────────
router.get('/bookings', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    let bookings = await Booking.find(filter)
      .populate('user', 'firstName lastName email phone')
      .populate('session', 'title type instructor level price')
      .sort({ createdAt: -1 })
      .lean();

    // Search by name/email/ref
    if (search) {
      const s = search.toLowerCase();
      bookings = bookings.filter(b =>
        b.bookingReference?.toLowerCase().includes(s) ||
        b.user?.firstName?.toLowerCase().includes(s) ||
        b.user?.lastName?.toLowerCase().includes(s) ||
        b.user?.email?.toLowerCase().includes(s) ||
        b.session?.title?.toLowerCase().includes(s)
      );
    }

    const total    = bookings.length;
    const paginated = bookings.slice((page - 1) * limit, page * limit);

    res.json({ success: true, bookings: paginated, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/bookings/:id/cancel — Admin cancel any booking ───────────
router.patch('/bookings/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('session');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (!['confirmed','pending'].includes(booking.status))
      return res.status(400).json({ success: false, message: `Booking is already ${booking.status}.` });

    booking.status = 'cancelled';
    booking.cancellation = { reason: reason || 'Cancelled by admin', cancelledAt: new Date(), cancelledBy: req.user._id };
    await booking.save();

    await User.findByIdAndUpdate(booking.user, { $inc: { 'stats.cancelledBookings': 1 } });

    const user = await User.findById(booking.user);
    if (user) sendBookingCancellation(booking, user, booking.session).catch(() => {});

    res.json({ success: true, message: 'Booking cancelled and user notified.', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/bookings/:id/checkin — Mark checked in + paid ────────────
router.patch('/bookings/:id/checkin', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id,
      { checkedIn: true, checkedInAt: new Date(), 'payment.status': 'paid', 'payment.paidAt': new Date() },
      { new: true }
    ).populate('user', 'firstName lastName').populate('session', 'title');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    res.json({ success: true, message: `${booking.user.firstName} checked in for ${booking.session.title}`, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/bookings/:id/status — Change booking status ──────────────
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','confirmed','completed','cancelled','no-show'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true })
      .populate('user', 'firstName lastName').populate('session', 'title');
    res.json({ success: true, message: 'Status updated.', booking });
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
      { lastName:  { $regex: search, $options: 'i' } },
      { email:     { $regex: search, $options: 'i' } },
    ];
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .select('-password -otp -refreshTokens')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    res.json({ success: true, users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/role ───────────────────────────────────────────
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user','instructor','admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password -otp');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `${user.firstName}'s role updated to ${role}.`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/toggle ─────────────────────────────────────────
router.patch('/users/:id/toggle', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, message: `Account ${user.isActive ? 'activated' : 'deactivated'}.`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/sessions ────────────────────────────────────────────────────
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 }).lean();
    // Attach booking count to each
    const withCounts = await Promise.all(sessions.map(async s => {
      const totalBookings = await Booking.countDocuments({ session: s._id });
      const activeBookings = await Booking.countDocuments({ session: s._id, status: { $in: ['confirmed','pending'] } });
      return { ...s, totalBookings, activeBookings };
    }));
    res.json({ success: true, sessions: withCounts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/sessions ─── Create new session ───────────────────────────
router.post('/sessions', async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json({ success: true, message: 'Session created successfully!', session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/admin/sessions/:id ─── Update session ────────────────────────────
router.put('/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    res.json({ success: true, message: 'Session updated.', session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/sessions/:id/toggle ─── Enable/disable session ──────────
router.patch('/sessions/:id/toggle', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    session.isActive = !session.isActive;
    await session.save();
    res.json({ success: true, message: `Session ${session.isActive ? 'activated' : 'deactivated'}.`, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/sessions/:id ────────────────────────────────────────────
router.delete('/sessions/:id', async (req, res) => {
  try {
    const active = await Booking.countDocuments({ session: req.params.id, status: { $in: ['confirmed','pending'] } });
    if (active > 0)
      return res.status(400).json({ success: false, message: `Cannot delete — ${active} active booking(s) exist. Deactivate it instead.` });
    await Session.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Session deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/create-admin ───────────────────────────────────────────────
router.post('/create-admin', async (req, res) => {
  try {
    const { email, secretKey } = req.body;
    if (secretKey !== process.env.ADMIN_SECRET_KEY)
      return res.status(403).json({ success: false, message: 'Invalid secret key.' });
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `${email} is now an admin.`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// ── GET /api/admin/instructor-applications ─────────────────────────────────────
router.get('/instructor-applications', async (req, res) => {
  try {
    const InstructorApplication = require('../models/InstructorApplication');
    const { status = 'pending' } = req.query;
    const filter = {};
    if (status !== 'all') filter.status = status;

    const applications = await InstructorApplication.find(filter)
      .populate('user', 'firstName lastName email phone avatar createdAt stats')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/instructor-applications/:id — Approve or reject ───────────
router.patch('/instructor-applications/:id', async (req, res) => {
  try {
    const { action, adminNote } = req.body; // action: 'approve' | 'reject'
    if (!['approve','reject'].includes(action))
      return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });

    const InstructorApplication = require('../models/InstructorApplication');
    const { notifyInstructorApproval } = require('../utils/notifications');
    const app = await InstructorApplication.findById(req.params.id).populate('user');

    if (!app) return res.status(404).json({ success: false, message: 'Application not found.' });

    app.status     = action === 'approve' ? 'approved' : 'rejected';
    app.adminNote  = adminNote || '';
    app.reviewedBy = req.user._id;
    app.reviewedAt = new Date();
    await app.save();

    // Update user role
    const newRole = action === 'approve' ? 'instructor' : 'user';
    await User.findByIdAndUpdate(app.user._id, {
      role: newRole,
      ...(action === 'approve' && {
        'preferences.instructorBio': app.bio,
      }),
    });

    // Send in-app notification
    await notifyInstructorApproval(app.user._id, action === 'approve', adminNote);

    // Send email notification
    const { sendEmail } = require('../utils/email');
    if (action === 'approve') {
      const { subject, htmlContent } = {
        subject: '🎉 Your YogaFlow Instructor Application is Approved!',
        htmlContent: `<div style="font-family:sans-serif;padding:20px;">
          <h2>Welcome aboard, ${app.user.firstName}! 🧘</h2>
          <p>Your instructor application has been <strong>approved</strong>. You can now:</p>
          <ul>
            <li>Create and manage your own yoga sessions</li>
            <li>View bookings made by students for your sessions</li>
            <li>Build your instructor profile</li>
          </ul>
          <p><a href="${process.env.FRONTEND_URL}/instructor/dashboard" style="background:#2C5F2E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Go to Instructor Dashboard →</a></p>
        </div>`,
      };
      await sendEmail({ to: app.user.email, subject, htmlContent }).catch(() => {});
    }

    res.json({
      success: true,
      message: `Application ${action}d. ${app.user.firstName} has been notified.`,
    });
  } catch (err) {
    console.error('Approve instructor error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

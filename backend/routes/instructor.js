const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const InstructorApplication = require('../models/InstructorApplication');
const Session    = require('../models/Session');
const Booking    = require('../models/Booking');
const User       = require('../models/User');
const Notification = require('../models/Notification');
const { protect, instructorOrAdmin } = require('../middleware/auth');
const { notifyInstructorApproval } = require('../utils/notifications');
const { sendEmail } = require('../utils/email');

// ── POST /api/instructor/apply ─────────────────────────────────────────────────
router.post('/apply', protect, [
  body('bio').notEmpty().withMessage('Bio is required').isLength({ max: 1000 }),
  body('specialties').isArray({ min: 1 }).withMessage('At least one specialty required'),
  body('experience').notEmpty().withMessage('Experience is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

    if (req.user.role === 'instructor') {
      return res.status(400).json({ success: false, message: 'You are already an instructor.' });
    }

    // Check for existing application
    const existing = await InstructorApplication.findOne({ user: req.user._id });
    if (existing) {
      if (existing.status === 'pending') {
        return res.status(409).json({ success: false, message: 'Your application is already under review.' });
      }
      if (existing.status === 'approved') {
        return res.status(409).json({ success: false, message: 'Your application is already approved.' });
      }
      // Rejected — allow reapplication
      await InstructorApplication.deleteOne({ _id: existing._id });
    }

    const application = await InstructorApplication.create({
      user:           req.user._id,
      bio:            req.body.bio,
      specialties:    req.body.specialties,
      experience:     req.body.experience,
      certifications: req.body.certifications || [],
      profilePhoto:   req.body.profilePhoto   || '',
      socialLinks:    req.body.socialLinks     || {},
    });

    // Update user role to pending_instructor
    await User.findByIdAndUpdate(req.user._id, { role: 'pending_instructor' });

    // Notify all admins
    const admins = await User.find({ role: 'admin' }).select('_id email firstName');
    for (const admin of admins) {
      await Notification.create({
        user:    admin._id,
        type:    'system',
        title:   'New instructor application',
        message: `${req.user.firstName} ${req.user.lastName} applied to become an instructor`,
        link:    '/admin',
        data:    { applicationId: application._id, userId: req.user._id },
      });
    }

    res.status(201).json({
      success:     true,
      message:     'Application submitted! You will be notified once reviewed.',
      application: { _id: application._id, status: application.status },
    });
  } catch (err) {
    console.error('Instructor apply error:', err);
    res.status(500).json({ success: false, message: 'Application failed. Please try again.' });
  }
});

// ── GET /api/instructor/application ───────────────────────────────────────────
router.get('/application', protect, async (req, res) => {
  try {
    const application = await InstructorApplication.findOne({ user: req.user._id });
    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/instructor/dashboard ─────────────────────────────────────────────
router.get('/dashboard', protect, instructorOrAdmin, async (req, res) => {
  try {
    const instructorName = `${req.user.firstName} ${req.user.lastName}`;

    const mySessions = await Session.find({
      'instructor.name': { $regex: instructorName, $options: 'i' },
      isActive: true,
    }).lean();

    const sessionIds = mySessions.map(s => s._id);

    const [totalBookings, upcomingBookings, revenue, recentBookings] = await Promise.all([
      Booking.countDocuments({ session: { $in: sessionIds }, status: { $in: ['confirmed','completed'] } }),
      Booking.countDocuments({ session: { $in: sessionIds }, status: 'confirmed', sessionDate: { $gte: new Date() } }),
      Booking.aggregate([
        { $match: { session: { $in: sessionIds }, status: { $in: ['confirmed','completed'] } } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } },
      ]),
      Booking.find({ session: { $in: sessionIds } })
        .populate('user', 'firstName lastName email')
        .populate('session', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    res.json({
      success: true,
      dashboard: {
        totalSessions:  mySessions.length,
        totalBookings,
        upcomingBookings,
        totalRevenue:   revenue[0]?.total || 0,
        sessions:       mySessions,
        recentBookings,
      },
    });
  } catch (err) {
    console.error('Instructor dashboard error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/instructor/sessions ──────────────────────────────────────────────
router.get('/sessions', protect, instructorOrAdmin, async (req, res) => {
  try {
    const instructorName = `${req.user.firstName} ${req.user.lastName}`;
    const sessions = await Session.find({
      'instructor.name': { $regex: instructorName, $options: 'i' },
    }).sort({ createdAt: -1 }).lean();

    // Attach booking counts
    const enriched = await Promise.all(sessions.map(async s => {
      const [total, upcoming] = await Promise.all([
        Booking.countDocuments({ session: s._id }),
        Booking.countDocuments({ session: s._id, status: 'confirmed', sessionDate: { $gte: new Date() } }),
      ]);
      return { ...s, totalBookings: total, upcomingBookings: upcoming };
    }));

    res.json({ success: true, sessions: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/instructor/sessions ─── Create session ──────────────────────────
router.post('/sessions', protect, instructorOrAdmin, async (req, res) => {
  try {
    const instructorName  = `${req.user.firstName} ${req.user.lastName}`;
    const instructorAvatar = req.user.avatar || req.body.instructorAvatar || '';
    const instructorBio    = req.body.instructorBio || '';

    const session = await Session.create({
      ...req.body,
      instructor: {
        name:   instructorName,
        bio:    instructorBio,
        avatar: instructorAvatar,
      },
      isActive: true,
    });

    res.status(201).json({ success: true, message: 'Session created!', session });
  } catch (err) {
    console.error('Create session error:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/instructor/sessions/:id ─── Update own session ───────────────────
router.put('/sessions/:id', protect, instructorOrAdmin, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    const instructorName = `${req.user.firstName} ${req.user.lastName}`;
    if (req.user.role !== 'admin' && !session.instructor.name.toLowerCase().includes(req.user.firstName.toLowerCase())) {
      return res.status(403).json({ success: false, message: 'You can only edit your own sessions.' });
    }

    const updated = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Session updated.', session: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/instructor/bookings ──────────────────────────────────────────────
router.get('/bookings', protect, instructorOrAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const instructorName = `${req.user.firstName} ${req.user.lastName}`;

    const mySessions = await Session.find({
      'instructor.name': { $regex: instructorName, $options: 'i' },
    }).select('_id').lean();

    const sessionIds = mySessions.map(s => s._id);
    const filter = { session: { $in: sessionIds } };
    if (status && status !== 'all') filter.status = status;

    const total    = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('user',    'firstName lastName email phone avatar')
      .populate('session', 'title type price level')
      .sort({ sessionDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      bookings,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/instructor/profile/:id ─── Public instructor profile ─────────────
router.get('/profile/:id', async (req, res) => {
  try {
    const instructor = await User.findById(req.params.id)
      .select('firstName lastName avatar role stats')
      .lean();

    if (!instructor || !['instructor','admin'].includes(instructor.role)) {
      return res.status(404).json({ success: false, message: 'Instructor not found.' });
    }

    const application = await InstructorApplication.findOne({ user: req.params.id }).lean();

    const instructorName = `${instructor.firstName} ${instructor.lastName}`;
    const sessions = await Session.find({
      'instructor.name': { $regex: instructorName, $options: 'i' },
      isActive: true,
    }).lean();

    res.json({
      success:     true,
      instructor:  { ...instructor, application },
      sessions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

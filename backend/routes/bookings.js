const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

const Booking       = require('../models/Booking');
const { generateRef } = require('../models/Booking');
const Session       = require('../models/Session');
const User          = require('../models/User');
const { protect }   = require('../middleware/auth');
const { sendBookingConfirmation, sendBookingCancellation } = require('../utils/email');

// ── POST /api/bookings — create booking ───────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const {
      sessionId, sessionDate, sessionTime,
      notes, specialRequirements, paymentMethod = 'cash',
    } = req.body;

    if (!sessionId || !sessionDate || !sessionTime)
      return res.status(400).json({ success: false, message: 'Session ID, date and time are required.' });

    // Validate sessionId is a valid ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(sessionId))
      return res.status(400).json({ success: false, message: 'Invalid session ID.' });

    const session = await Session.findById(sessionId);
    if (!session || !session.isActive)
      return res.status(404).json({ success: false, message: 'Session not found.' });

    const bookingDate = new Date(sessionDate);
    if (isNaN(bookingDate.getTime()))
      return res.status(400).json({ success: false, message: 'Invalid date.' });

    const dayStart = new Date(bookingDate); dayStart.setHours(0,  0,  0,   0);
    const dayEnd   = new Date(bookingDate); dayEnd.setHours(23, 59, 59, 999);

    // Duplicate check
    const exists = await Booking.findOne({
      user:        req.user._id,
      session:     sessionId,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      status:      { $in: ['confirmed', 'pending'] },
    });
    if (exists)
      return res.status(409).json({ success: false, message: 'You already have a booking for this session on that date.' });

    // Capacity check
    const taken = await Booking.countDocuments({
      session:     sessionId,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      status:      { $in: ['confirmed', 'pending'] },
    });
    if (taken >= session.maxCapacity)
      return res.status(409).json({ success: false, message: 'Session is fully booked for that date.' });

    // ── Optional coupon application ────────────────────────────────────────────
    let finalPrice = session.price;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (req.body.couponCode) {
      const Coupon = require('../models/Coupon');
      const coupon = await Coupon.findOne({
        code: req.body.couponCode.toUpperCase().trim(),
        isActive: true,
        validFrom:  { $lte: new Date() },
        validUntil: { $gte: new Date() },
      });
      if (coupon && !coupon.usedBy.includes(req.user._id)) {
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round((session.price * coupon.discountValue) / 100);
          if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        } else {
          discountAmount = Math.min(coupon.discountValue, session.price);
        }
        finalPrice = Math.max(0, session.price - discountAmount);
        appliedCoupon = coupon;
        // Mark coupon as used
        await coupon.updateOne({ $inc: { usageCount: 1 }, $push: { usedBy: req.user._id } });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const bookingReference = generateRef();
    const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });

    const booking = await Booking.create({
      bookingReference,
      user:        req.user._id,
      session:     sessionId,
      sessionDate: bookingDate,
      sessionTime,
      sessionDay:  dayName,
      status:      'confirmed',
      payment: {
        amount:   finalPrice,
        originalAmount: session.price,
        discountAmount,
        currency: session.currency || 'INR',
        method:   paymentMethod,
        status:   'pending',
      },
      guestInfo: {
        firstName: req.user.firstName,
        lastName:  req.user.lastName,
        email:     req.user.email,
        phone:     req.user.phone || '',
      },
      notes:               notes || '',
      specialRequirements: specialRequirements || '',
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalBookings': 1 } });

    // Populate for email + response
    const full = await Booking.findById(booking._id).populate('session').lean();
    const user = await User.findById(req.user._id).lean();

    sendBookingConfirmation(full, user, full.session)
      .catch(e => console.error('Booking confirmation email failed:', e.message));

    res.status(201).json({
      success: true,
      message: `Booking confirmed! Confirmation sent to ${user.email}`,
      booking: full,
    });

  } catch (err) {
    console.error('POST /bookings error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Booking failed. Please try again.' });
  }
});

// ── GET /api/bookings/my ──────────────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;

    // ── Auto-complete past sessions in ONE atomic operation (no loop!) ────────
    // Old code: for loop with findByIdAndUpdate per booking = N DB writes = CRASH
    // New code: single updateMany + single user stat correction
    const now = new Date();
    const autocompleteResult = await Booking.updateMany(
      { user: userId, status: 'confirmed', sessionDate: { $lt: now } },
      { $set: { status: 'completed' } }
    );

    // Update user stats once if any were completed
    if (autocompleteResult.modifiedCount > 0) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.completedSessions': autocompleteResult.modifiedCount },
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Build filter
    const filter = { user: userId };
    if (status && status !== 'all') filter.status = status;

    const total    = await Booking.countDocuments(filter);
    const pageNum  = parseInt(page,  10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const bookings = await Booking.find(filter)
      .populate({
        path:   'session',
        select: 'title type instructor duration level image price location cancellationPolicy isActive',
      })
      .sort({ sessionDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    res.json({
      success:    true,
      bookings,
      pagination: {
        total,
        page:  pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });

  } catch (err) {
    console.error('GET /bookings/my error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings. Error: ' + err.message });
  }
});

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });

    const booking = await Booking.findById(req.params.id)
      .populate('session')
      .populate('user', 'firstName lastName email phone')
      .lean();

    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found.' });

    const ownerId = booking.user._id?.toString() || booking.user?.toString();
    if (ownerId !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    res.json({ success: true, booking });

  } catch (err) {
    console.error('GET /bookings/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
});

// ── PATCH /api/bookings/:id/cancel ────────────────────────────────────────────
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });

    const booking = await Booking.findById(req.params.id).populate('session');
    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found.' });

    const ownerId = booking.user?.toString();
    if (ownerId !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    if (!['confirmed', 'pending'].includes(booking.status))
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });

    // 2-hour window
    if (req.user.role !== 'admin' && booking.sessionTime) {
      const sessionDT = new Date(booking.sessionDate);
      const [h, m]    = (booking.sessionTime || '00:00').split(':');
      sessionDT.setHours(parseInt(h) || 0, parseInt(m) || 0, 0, 0);
      if ((sessionDT - new Date()) < 2 * 60 * 60 * 1000)
        return res.status(400).json({ success: false, message: 'Cancellations must be at least 2 hours before the session.' });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      reason:      req.body.reason || 'Cancelled by user',
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
    };
    await booking.save();

    await User.findByIdAndUpdate(booking.user, { $inc: { 'stats.cancelledBookings': 1 } });

    const user = await User.findById(booking.user).lean();
    if (user && booking.session) {
      sendBookingCancellation(booking, user, booking.session)
        .catch(e => console.error('Cancel email failed:', e.message));
    }

    res.json({ success: true, message: 'Booking cancelled. Confirmation email sent.', booking });

  } catch (err) {
    console.error('PATCH /bookings/:id/cancel error:', err.message);
    res.status(500).json({ success: false, message: 'Cancellation failed.' });
  }
});

// ── POST /api/bookings/:id/feedback ───────────────────────────────────────────
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ success: false, message: 'Invalid booking ID.' });

    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({ success: false, message: 'Booking not found.' });

    if (booking.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    if (booking.status !== 'completed')
      return res.status(400).json({ success: false, message: 'Can only review completed sessions.' });

    if (booking.feedback?.rating)
      return res.status(400).json({ success: false, message: 'Feedback already submitted.' });

    booking.feedback = { rating, comment: comment || '', submittedAt: new Date() };
    await booking.save();

    // Update session average rating
    const all = await Booking.find({
      session:          booking.session,
      'feedback.rating': { $exists: true },
    });
    if (all.length > 0) {
      const avg = all.reduce((s, b) => s + (b.feedback.rating || 0), 0) / all.length;
      await Session.findByIdAndUpdate(booking.session, {
        'rating.average': Math.round(avg * 10) / 10,
        'rating.count':   all.length,
      });
    }

    res.json({ success: true, message: 'Thank you for your feedback!', booking });

  } catch (err) {
    console.error('POST /bookings/:id/feedback error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
});

module.exports = router;

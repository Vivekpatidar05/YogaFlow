const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Session = require('../models/Session');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { sendBookingConfirmation, sendBookingCancellation } = require('../utils/email');

// ── POST /api/bookings — Create a booking ─────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { sessionId, sessionDate, sessionTime, notes, specialRequirements, paymentMethod = 'cash' } = req.body;

    if (!sessionId || !sessionDate || !sessionTime) {
      return res.status(400).json({ success: false, message: 'Session ID, date, and time are required.' });
    }

    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return res.status(404).json({ success: false, message: 'Session not found or no longer active.' });
    }

    // Parse and validate date
    const bookingDate = new Date(sessionDate);
    if (isNaN(bookingDate)) {
      return res.status(400).json({ success: false, message: 'Invalid session date.' });
    }

    // Ensure it's in the future
    const sessionDateTime = new Date(bookingDate);
    const [h, m] = sessionTime.split(':');
    sessionDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
    if (sessionDateTime <= new Date()) {
      return res.status(400).json({ success: false, message: 'Cannot book a session in the past.' });
    }

    // Check if user already booked this session on this date
    const existingBooking = await Booking.findOne({
      user: req.user._id,
      session: sessionId,
      sessionDate: {
        $gte: new Date(new Date(bookingDate).setHours(0,0,0,0)),
        $lt: new Date(new Date(bookingDate).setHours(23,59,59,999))
      },
      status: { $in: ['confirmed', 'pending'] }
    });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: 'You have already booked this session for that date.' });
    }

    // Check capacity
    const bookedCount = await Booking.countDocuments({
      session: sessionId,
      sessionDate: {
        $gte: new Date(new Date(bookingDate).setHours(0,0,0,0)),
        $lt: new Date(new Date(bookingDate).setHours(23,59,59,999))
      },
      status: { $in: ['confirmed', 'pending'] }
    });
    if (bookedCount >= session.maxCapacity) {
      return res.status(409).json({ success: false, message: 'This session is fully booked for that date. Please choose another date.' });
    }

    const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Create booking
    const booking = await Booking.create({
      user: req.user._id,
      session: sessionId,
      sessionDate: bookingDate,
      sessionTime,
      sessionDay: dayName,
      status: 'confirmed',
      payment: {
        amount: session.price,
        currency: session.currency || 'INR',
        method: paymentMethod,
        status: paymentMethod === 'online' ? 'pending' : 'pending'
      },
      guestInfo: {
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone
      },
      notes,
      specialRequirements
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalBookings': 1 } });

    // Populate for email
    const populatedBooking = await Booking.findById(booking._id).populate('session');
    const user = await User.findById(req.user._id);

    // Send confirmation email (non-blocking)
    sendBookingConfirmation(populatedBooking, user, populatedBooking.session)
      .catch(e => console.error('Booking email failed:', e.message));

    res.status(201).json({
      success: true,
      message: `Booking confirmed! A confirmation email has been sent to ${user.email}`,
      booking: populatedBooking
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ success: false, message: 'Booking failed. Please try again.' });
  }
});

// ── GET /api/bookings/my — Get user's own bookings ────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('session', 'title type instructor duration level image price location')
      .sort({ sessionDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Auto-update completed bookings
    const now = new Date();
    for (const booking of bookings) {
      if (booking.status === 'confirmed' && new Date(booking.sessionDate) < now) {
        booking.status = 'completed';
        await booking.save();
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.completedSessions': 1 } });
      }
    }

    res.json({
      success: true,
      bookings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
});

// ── GET /api/bookings/:id — Get single booking ────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('session')
      .populate('user', 'firstName lastName email phone avatar');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // Check ownership (or admin)
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
});

// ── PATCH /api/bookings/:id/cancel — Cancel a booking ────────────────────────
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id).populate('session');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (!['confirmed', 'pending'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${booking.status} booking.` });
    }

    // Check cancellation window (2 hours before)
    const sessionDateTime = new Date(booking.sessionDate);
    const [h, m] = booking.sessionTime.split(':');
    sessionDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
    const hoursUntil = (sessionDateTime - new Date()) / (1000 * 60 * 60);

    if (hoursUntil < 2 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cancellations must be made at least 2 hours before the session.'
      });
    }

    booking.status = 'cancelled';
    booking.cancellation = {
      reason: reason || 'Cancelled by user',
      cancelledAt: new Date(),
      cancelledBy: req.user._id
    };
    await booking.save();

    // Update user stats
    await User.findByIdAndUpdate(booking.user, { $inc: { 'stats.cancelledBookings': 1 } });

    // Send cancellation email
    const user = await User.findById(booking.user);
    sendBookingCancellation(booking, user, booking.session)
      .catch(e => console.error('Cancel email failed:', e.message));

    res.json({ success: true, message: 'Booking cancelled successfully. A confirmation email has been sent.', booking });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ success: false, message: 'Cancellation failed. Please try again.' });
  }
});

// ── POST /api/bookings/:id/feedback — Submit feedback ─────────────────────────
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (booking.status !== 'completed') return res.status(400).json({ success: false, message: 'Can only review completed sessions.' });
    if (booking.feedback?.rating) return res.status(400).json({ success: false, message: 'You have already submitted feedback.' });

    booking.feedback = { rating, comment, submittedAt: new Date() };
    await booking.save();

    // Update session rating
    const allFeedback = await Booking.find({ session: booking.session, 'feedback.rating': { $exists: true } });
    const avgRating = allFeedback.reduce((sum, b) => sum + b.feedback.rating, 0) / allFeedback.length;
    await Session.findByIdAndUpdate(booking.session, {
      'rating.average': Math.round(avgRating * 10) / 10,
      'rating.count': allFeedback.length
    });

    res.json({ success: true, message: 'Feedback submitted. Thank you!', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
});

module.exports = router;

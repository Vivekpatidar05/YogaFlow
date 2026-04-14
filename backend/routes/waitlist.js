const express  = require('express');
const router   = express.Router();
const Waitlist = require('../models/Waitlist');
const Booking  = require('../models/Booking');
const Session  = require('../models/Session');
const User     = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { notifyWaitlistOpen } = require('../utils/notifications');

// ── POST /api/waitlist — Join waitlist ────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { sessionId, sessionDate, sessionTime } = req.body;
    if (!sessionId || !sessionDate || !sessionTime)
      return res.status(400).json({ success: false, message: 'sessionId, sessionDate and sessionTime required.' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });

    const bookingDate = new Date(sessionDate);
    const dayStart = new Date(bookingDate); dayStart.setHours(0,  0,  0,   0);
    const dayEnd   = new Date(bookingDate); dayEnd.setHours(23, 59, 59, 999);

    // Check if spot is actually available (don't need waitlist)
    const taken = await Booking.countDocuments({
      session: sessionId,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ['confirmed', 'pending'] },
    });
    if (taken < session.maxCapacity)
      return res.status(400).json({ success: false, message: 'Spots are available — no need to join waitlist. Book directly!' });

    // Already on waitlist?
    const existing = await Waitlist.findOne({
      user:        req.user._id,
      session:     sessionId,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      status:      'waiting',
    });
    if (existing)
      return res.status(409).json({ success: false, message: 'You are already on the waitlist for this session.' });

    // Get position
    const ahead = await Waitlist.countDocuments({
      session:     sessionId,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      status:      'waiting',
    });

    const entry = await Waitlist.create({
      user:        req.user._id,
      session:     sessionId,
      sessionDate: bookingDate,
      sessionTime,
      position:    ahead + 1,
      expiresAt:   new Date(bookingDate.getTime() - 2 * 60 * 60 * 1000), // expires 2h before session
    });

    res.status(201).json({
      success:  true,
      message:  `You are #${ahead + 1} on the waitlist. We'll notify you if a spot opens!`,
      position: ahead + 1,
      entry:    entry._id,
    });
  } catch (err) {
    console.error('Waitlist join error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/waitlist/:id — Leave waitlist ─────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const entry = await Waitlist.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Waitlist entry not found.' });
    if (entry.user.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Access denied.' });

    await Waitlist.deleteOne({ _id: entry._id });
    res.json({ success: true, message: 'Removed from waitlist.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/waitlist/my — User's waitlist entries ────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const entries = await Waitlist.find({ user: req.user._id, status: 'waiting' })
      .populate('session', 'title type instructor image')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Export a helper to notify waitlist when booking is cancelled ───────────────
async function processWaitlist(sessionId, sessionDate) {
  try {
    const bookingDate = new Date(sessionDate);
    const dayStart = new Date(bookingDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd   = new Date(bookingDate); dayEnd.setHours(23, 59, 59, 999);

    const next = await Waitlist.findOne({
      session:     sessionId,
      sessionDate: { $gte: dayStart, $lte: dayEnd },
      status:      'waiting',
    }).sort({ position: 1 }).populate('user', 'firstName lastName email').lean();

    if (!next) return;

    const session = await Session.findById(sessionId).lean();
    if (!session) return;

    // Notify
    await notifyWaitlistOpen(next.user._id, session, sessionDate);
    await Waitlist.findByIdAndUpdate(next._id, { status: 'notified', notifiedAt: new Date() });

    console.log(`✅ Notified waitlist user: ${next.user.firstName} for ${session.title}`);
  } catch (err) {
    console.error('Waitlist process error:', err.message);
  }
}

module.exports = router;
module.exports.processWaitlist = processWaitlist;

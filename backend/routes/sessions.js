const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');

// ── GET /api/sessions — List all sessions ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { type, level, instructor, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (level) filter.level = level;
    if (instructor) filter['instructor.name'] = { $regex: instructor, $options: 'i' };
    if (search) filter.$text = { $search: search };

    const total = await Session.countDocuments(filter);
    const sessions = await Session.find(filter)
      .sort({ 'rating.average': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Attach availability for next 14 days
    const today = new Date();
    const enriched = await Promise.all(sessions.map(async (session) => {
      const upcoming = [];
      for (let i = 0; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const slot = session.schedule?.find(s => s.day === dayName);
        if (slot) {
          const sessionDateTime = new Date(date);
          const [h, m] = slot.time.split(':');
          sessionDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
          if (sessionDateTime > new Date()) {
            const count = await Booking.countDocuments({
              session: session._id,
              sessionDate: {
                $gte: new Date(date.setHours(0,0,0,0)),
                $lt: new Date(date.setHours(23,59,59,999))
              },
              status: { $in: ['confirmed', 'pending'] }
            });
            upcoming.push({
              date: new Date(sessionDateTime),
              time: slot.time,
              day: dayName,
              spotsLeft: session.maxCapacity - count,
              isFull: count >= session.maxCapacity
            });
          }
        }
      }
      return { ...session, upcoming: upcoming.slice(0, 6) };
    }));

    res.json({
      success: true,
      sessions: enriched,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch sessions.' });
  }
});

// ── GET /api/sessions/types — Get unique types ───────────────────────────────
router.get('/types', async (req, res) => {
  try {
    const types = await Session.distinct('type', { isActive: true });
    const levels = await Session.distinct('level', { isActive: true });
    const instructors = await Session.distinct('instructor.name', { isActive: true });
    res.json({ success: true, types, levels, instructors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch filters.' });
  }
});

// ── GET /api/sessions/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).lean();
    if (!session || !session.isActive) {
      return res.status(404).json({ success: false, message: 'Session not found.' });
    }

    // Get availability for next 21 days
    const today = new Date();
    const availability = [];
    for (let i = 0; i <= 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const slot = session.schedule?.find(s => s.day === dayName);
      if (slot) {
        const sessionDateTime = new Date(date);
        const [h, m] = slot.time.split(':');
        sessionDateTime.setHours(parseInt(h), parseInt(m), 0, 0);
        if (sessionDateTime > new Date()) {
          const count = await Booking.countDocuments({
            session: session._id,
            sessionDate: {
              $gte: new Date(new Date(date).setHours(0,0,0,0)),
              $lt: new Date(new Date(date).setHours(23,59,59,999))
            },
            status: { $in: ['confirmed', 'pending'] }
          });
          availability.push({
            date: sessionDateTime,
            time: slot.time,
            day: dayName,
            spotsLeft: session.maxCapacity - count,
            isFull: count >= session.maxCapacity
          });
        }
      }
    }

    res.json({ success: true, session: { ...session, availability } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch session details.' });
  }
});

// ── POST /api/sessions — Admin: Create session ────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.status(201).json({ success: true, message: 'Session created.', session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/sessions/:id — Admin: Update session ─────────────────────────────
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    res.json({ success: true, message: 'Session updated.', session });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/sessions/:id — Admin: Delete session ──────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Session.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Session deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete session.' });
  }
});

module.exports = router;

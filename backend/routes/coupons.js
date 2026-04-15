const express = require('express');
const router  = express.Router();
const Coupon  = require('../models/Coupon');
const { protect, adminOnly } = require('../middleware/auth');

// ── POST /api/coupons/validate — check if coupon is valid ─────────────────────
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, sessionId, amount } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!coupon)
      return res.status(404).json({ success: false, message: 'Invalid coupon code.' });

    const now = new Date();
    if (coupon.validFrom > now)
      return res.status(400).json({ success: false, message: 'This coupon is not valid yet.' });
    if (coupon.validUntil < now)
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit)
      return res.status(400).json({ success: false, message: 'This coupon has reached its usage limit.' });

    // Check if user already used it
    if (coupon.usedBy.includes(req.user._id))
      return res.status(400).json({ success: false, message: 'You have already used this coupon.' });

    // Check min order value
    if (amount && coupon.minOrderValue > 0 && amount < coupon.minOrderValue)
      return res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString('en-IN')} required.`
      });

    // Check session applicability
    if (coupon.applicableTo === 'specific_sessions' && sessionId) {
      if (!coupon.sessions.map(s => s.toString()).includes(sessionId))
        return res.status(400).json({ success: false, message: 'This coupon is not valid for this session.' });
    }

    // Calculate discount
    let discountAmount;
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((amount * coupon.discountValue) / 100);
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.discountValue, amount);
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    res.json({
      success: true,
      coupon: {
        _id:           coupon._id,
        code:          coupon.code,
        description:   coupon.description,
        discountType:  coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discountAmount,
      finalAmount,
      message: `Coupon applied! You save ₹${discountAmount.toLocaleString('en-IN')}`,
    });
  } catch (err) {
    console.error('Coupon validate error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: GET all coupons ─────────────────────────────────────────────────────
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, coupons });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Admin: POST create coupon ──────────────────────────────────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Coupon created!', coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Coupon code already exists.' });
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── Admin: PATCH toggle coupon ─────────────────────────────────────────────────
router.patch('/:id/toggle', protect, adminOnly, async (req, res) => {
  try {
    const c = await Coupon.findById(req.params.id);
    if (!c) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    c.isActive = !c.isActive;
    await c.save();
    res.json({ success: true, message: `Coupon ${c.isActive ? 'activated' : 'deactivated'}.`, coupon: c });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Admin: DELETE coupon ───────────────────────────────────────────────────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

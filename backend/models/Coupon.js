const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:  { type: String, required: true },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue:{ type: Number, required: true, min: 0 },
  minOrderValue:{ type: Number, default: 0 },
  maxDiscount:  { type: Number },          // cap for percentage discounts
  usageLimit:   { type: Number, default: 0 }, // 0 = unlimited
  usageCount:   { type: Number, default: 0 },
  validFrom:    { type: Date, default: Date.now },
  validUntil:   { type: Date, required: true },
  isActive:     { type: Boolean, default: true },
  applicableTo: { type: String, enum: ['all', 'specific_sessions'], default: 'all' },
  sessions:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
  usedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ validUntil: 1, isActive: 1 });

module.exports = mongoose.model('Coupon', couponSchema);

const mongoose = require('mongoose');

const generateRef = () => {
  const d   = new Date();
  const yr  = d.getFullYear().toString().slice(-2);
  const mo  = String(d.getMonth() + 1).padStart(2, '0');
  const rnd = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `YF${yr}${mo}${rnd}`;
};

const bookingSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  bookingReference: { type: String, unique: true, sparse: true, default: generateRef },
  sessionDate:  { type: Date,   required: true },
  sessionTime:  { type: String, required: true },
  sessionDay:   { type: String, required: true },
  status: { type: String, enum: ['pending','confirmed','cancelled','completed','no-show'], default: 'confirmed' },
  payment: {
    amount:        { type: Number, required: true },
    currency:      { type: String, default: 'INR' },
    method:        { type: String, enum: ['online','cash','card','upi','free'], default: 'cash' },
    status:        { type: String, enum: ['pending','paid','refunded','failed'], default: 'pending' },
    transactionId: String, paidAt: Date, refundedAt: Date, refundAmount: Number,
  },
  guestInfo:           { firstName: String, lastName: String, email: String, phone: String },
  notes:               { type: String, maxlength: 500 },
  specialRequirements: String,
  checkedIn:           { type: Boolean, default: false },
  checkedInAt:         Date,
  cancellation:        { reason: String, cancelledAt: Date, cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } },
  reminder:            { sent: { type: Boolean, default: false }, sentAt: Date },
  feedback:            { rating: { type: Number, min: 1, max: 5 }, comment: String, submittedAt: Date },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Only two additional indexes — bookingReference index is auto-created by unique:true
bookingSchema.index({ user: 1, sessionDate: -1 });
bookingSchema.index({ session: 1, sessionDate: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
module.exports.generateRef = generateRef;

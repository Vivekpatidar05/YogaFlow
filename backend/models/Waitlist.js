const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  session:     { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  sessionDate: { type: Date, required: true },
  sessionTime: { type: String, required: true },
  position:    { type: Number, required: true },
  status:      { type: String, enum: ['waiting', 'notified', 'converted', 'expired'], default: 'waiting' },
  notifiedAt:  Date,
  expiresAt:   { type: Date, required: true },
}, { timestamps: true });

waitlistSchema.index({ session: 1, sessionDate: 1, status: 1 });
waitlistSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);

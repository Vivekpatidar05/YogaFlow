const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    {
    type: String,
    enum: ['booking_confirmed', 'booking_cancelled', 'session_reminder', 'waitlist_spot',
           'instructor_approved', 'instructor_rejected', 'new_booking_on_session',
           'session_cancelled_by_instructor', 'review_received', 'system'],
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  link:    String,
  read:    { type: Boolean, default: false },
  data:    mongoose.Schema.Types.Mixed,
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

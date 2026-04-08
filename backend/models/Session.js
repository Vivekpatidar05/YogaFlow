const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['Hatha', 'Vinyasa', 'Yin', 'Kundalini', 'Ashtanga', 'Restorative', 'Prenatal', 'Power', 'Hot Yoga', 'Aerial', 'Meditation']
  },
  instructor: {
    name: { type: String, required: true },
    bio: String,
    avatar: String
  },
  duration: {
    type: Number, // minutes
    required: true,
    min: 30,
    max: 180
  },
  maxCapacity: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    required: true
  },
  tags: [String],
  schedule: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    time: String, // "HH:MM" 24h format
    dayIndex: Number
  }],
  location: {
    type: { type: String, enum: ['in-person', 'online', 'hybrid'], default: 'in-person' },
    address: String,
    room: String,
    onlineLink: String,
    onlinePlatform: String
  },
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 }
  },
  equipment: [String],
  whatToBring: [String],
  cancellationPolicy: {
    type: String,
    default: 'Free cancellation up to 2 hours before the session.'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: formatted price
sessionSchema.virtual('formattedPrice').get(function () {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: this.currency }).format(this.price);
});

// Text search index
sessionSchema.index({ title: 'text', description: 'text', type: 'text', tags: 'text' });
sessionSchema.index({ type: 1, level: 1, isActive: 1 });

module.exports = mongoose.model('Session', sessionSchema);

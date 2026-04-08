const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[\d\s\-()]{10,15}$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'instructor', 'admin'],
    default: 'user'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },
  refreshTokens: [{ type: String }],
  preferences: {
    yogaTypes: [String],
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'], default: 'Beginner' },
    notifications: {
      email: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    }
  },
  healthInfo: {
    injuries: String,
    medicalConditions: String,
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String
    }
  },
  stats: {
    totalBookings: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    cancelledBookings: { type: Number, default: 0 },
    memberSince: { type: Date, default: Date.now }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = {
    code: otp,
    expiresAt: new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000),
    attempts: 0
  };
  return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function (code) {
  if (!this.otp || !this.otp.code) return { valid: false, reason: 'No OTP found' };
  if (new Date() > this.otp.expiresAt) return { valid: false, reason: 'OTP has expired' };
  if (this.otp.attempts >= 5) return { valid: false, reason: 'Too many OTP attempts' };
  if (this.otp.code !== code) {
    this.otp.attempts += 1;
    return { valid: false, reason: 'Invalid OTP' };
  }
  return { valid: true };
};

module.exports = mongoose.model('User', userSchema);

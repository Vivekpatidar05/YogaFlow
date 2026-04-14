const mongoose = require('mongoose');

const instructorApplicationSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  bio:         { type: String, maxlength: 1000 },
  specialties: [String],
  experience:  String,
  certifications: [String],
  profilePhoto: String,
  socialLinks: {
    instagram: String,
    website:   String,
    youtube:   String,
  },
  adminNote:   String,
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:  Date,
}, { timestamps: true });

module.exports = mongoose.model('InstructorApplication', instructorApplicationSchema);

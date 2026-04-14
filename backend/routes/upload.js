const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { uploadImage, isConfigured } = require('../utils/cloudinary');
const { protect, instructorOrAdmin, adminOnly } = require('../middleware/auth');

// Store in memory — max 5 MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP and GIF are allowed.'));
  },
});

// ── Helper ────────────────────────────────────────────────────────────────────
const notConfigured = (res) => res.status(503).json({
  success: false,
  message: 'Image upload not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Railway environment variables.',
  setup:   'https://cloudinary.com → sign up free → Dashboard → copy the 3 values',
});

// ── POST /api/upload/image ─────────────────────────────────────────────────────
// General image upload (session images, instructor avatars, etc.)
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });
    if (!isConfigured()) return notConfigured(res);

    const type   = req.body.type || 'general';
    const folder = `yogaflow/${type}s`;

    const result = await uploadImage(req.file.buffer, { folder });

    if (!result.success)
      return res.status(500).json({ success: false, message: result.reason || 'Upload failed.' });

    res.json({ success: true, message: 'Image uploaded!', url: result.url, public_id: result.public_id });

  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 5MB.' });
    console.error('Upload /image error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

// ── POST /api/upload/avatar ────────────────────────────────────────────────────
// Upload and save user profile picture
router.post('/avatar', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });
    if (!isConfigured()) return notConfigured(res);

    const result = await uploadImage(req.file.buffer, {
      folder:    'yogaflow/avatars',
      public_id: `yogaflow/avatars/user_${req.user._id}`,
    });

    if (!result.success)
      return res.status(500).json({ success: false, message: result.reason || 'Upload failed.' });

    // Save to user record
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { avatar: result.url });

    res.json({ success: true, message: 'Profile picture updated!', url: result.url });

  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 5MB.' });
    console.error('Upload /avatar error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

// ── POST /api/upload/session/:id ───────────────────────────────────────────────
// Upload and save session image directly to a session document
router.post('/session/:id', protect, instructorOrAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });
    if (!isConfigured()) return notConfigured(res);

    const result = await uploadImage(req.file.buffer, {
      folder:    'yogaflow/sessions',
      public_id: `yogaflow/sessions/session_${req.params.id}`,
    });

    if (!result.success)
      return res.status(500).json({ success: false, message: result.reason || 'Upload failed.' });

    const Session = require('../models/Session');
    await Session.findByIdAndUpdate(req.params.id, { image: result.url });

    res.json({ success: true, message: 'Session image updated!', url: result.url });

  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 5MB.' });
    console.error('Upload /session error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

module.exports = router;

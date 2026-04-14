const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { uploadImage, isConfigured } = require('../utils/cloudinary');
const { protect } = require('../middleware/auth');

// Store uploads in memory (max 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed.'));
    }
  },
});

// ── POST /api/upload/image ─────────────────────────────────────────────────────
// Upload any image. Type can be: 'avatar' | 'session' | 'instructor'
router.post('/image', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Image upload not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Railway environment variables.',
        setup: 'https://cloudinary.com → sign up free → Dashboard → copy credentials',
      });
    }

    const type    = req.body.type || 'general';
    const folder  = `yogaflow/${type}s`;

    const result = await uploadImage(req.file.buffer, {
      folder,
      mimeType: req.file.mimetype,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.reason || 'Upload failed.' });
    }

    res.json({
      success:   true,
      message:   'Image uploaded successfully.',
      url:       result.url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height,
      bytes:     result.bytes,
    });

  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 5MB.' });
    }
    console.error('Upload error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Upload failed.' });
  }
});

// ── POST /api/upload/avatar — update user avatar ──────────────────────────────
router.post('/avatar', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided.' });

    if (!isConfigured()) {
      return res.status(503).json({ success: false, message: 'Image upload not configured. See Railway Variables.' });
    }

    const result = await uploadImage(req.file.buffer, {
      folder:    `yogaflow/avatars`,
      mimeType:  req.file.mimetype,
      public_id: `yogaflow/avatars/user_${req.user._id}`,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: result.reason || 'Upload failed.' });
    }

    // Update user avatar
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, { avatar: result.url });

    res.json({
      success: true,
      message: 'Profile picture updated!',
      url:     result.url,
    });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Image too large. Maximum size is 5MB.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

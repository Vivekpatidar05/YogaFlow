const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { uploadImage, isConfigured } = require('../utils/cloudinary');
const { protect }  = require('../middleware/auth');
const User         = require('../models/User');

const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP and GIF images are allowed.'));
  },
});

// Wrap multer so we can return JSON errors instead of Express default HTML
const handleUpload = (fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ success: false, message: `Image too large. Maximum size is ${MAX_BYTES / 1024 / 1024}MB.` });
    return res.status(400).json({ success: false, message: err.message || 'Upload error.' });
  });
};

// Shared check
const checkCloudinary = (res) => {
  if (!isConfigured()) {
    res.status(503).json({
      success: false,
      message: 'Image upload not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to Railway environment variables.',
      setup: 'https://cloudinary.com → sign up free → Dashboard → copy credentials → paste into Railway Variables',
    });
    return false;
  }
  return true;
};

// ── POST /api/upload/image ────────────────────────────────────────────────────
// For session images, instructor avatars, general images
// Body: multipart with field "image" + optional field "type" ('session'|'instructor'|'general')
router.post('/image', protect, handleUpload('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided. Send the file in a field named "image".' });
    if (!checkCloudinary(res)) return;

    const type   = req.body.type || 'general';
    const folder = `yogaflow/${type}s`;

    const result = await uploadImage(req.file.buffer, { folder, mimeType: req.file.mimetype });

    if (!result.success) return res.status(500).json({ success: false, message: result.reason });

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
    console.error('POST /upload/image error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/upload/avatar ───────────────────────────────────────────────────
// Updates the authenticated user's avatar in their profile
router.post('/avatar', protect, handleUpload('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image file provided. Send the file in a field named "image".' });
    if (!checkCloudinary(res)) return;

    const result = await uploadImage(req.file.buffer, {
      folder:    'yogaflow/avatars',
      public_id: `yogaflow/avatars/user_${req.user._id}`,
      mimeType:  req.file.mimetype,
    });

    if (!result.success) return res.status(500).json({ success: false, message: result.reason });

    // Persist to DB
    await User.findByIdAndUpdate(req.user._id, { avatar: result.url });

    res.json({
      success: true,
      message: 'Profile picture updated!',
      url:     result.url,
    });
  } catch (err) {
    console.error('POST /upload/avatar error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

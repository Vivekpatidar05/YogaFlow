require('dotenv').config();
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateTokens, protect } = require('../middleware/auth');
const { sendOTPEmail, sendEmailVerification, sendWelcomeEmail } = require('../utils/email');

const ok = (req, res) => {
  const e = validationResult(req);
  if (!e.isEmpty()) { res.status(400).json({ success: false, message: e.array()[0].msg }); return false; }
  return true;
};

// ── POST /api/auth/register ────────────────────────────────────────────────────
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password needs uppercase, lowercase, and a number'),
], async (req, res) => {
  try {
    if (!ok(req, res)) return;
    const { firstName, lastName, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      // If registered but not verified, resend OTP
      if (!existing.isEmailVerified) {
        const otp = existing.generateOTP();
        await existing.save({ validateBeforeSave: false });
        sendEmailVerification(existing, otp).catch(e => console.error('Resend OTP error:', e.message));
        return res.status(409).json({
          success: false,
          message: 'Account exists but email not verified. We resent a verification OTP.',
          needsVerification: true,
          email
        });
      }
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Create unverified user
    const user = new User({ firstName, lastName, email, password, phone, isEmailVerified: false });
    const otp = user.generateOTP();
    await user.save();

    // Send verification OTP
    const emailResult = await sendEmailVerification(user, otp);
    console.log('Verification email result:', emailResult);

    res.status(201).json({
      success: true,
      message: `Verification OTP sent to ${email}. Please check your inbox.`,
      needsVerification: true,
      email
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/verify-email — Verify OTP after signup ──────────────────────
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Enter the 6-digit OTP'),
], async (req, res) => {
  try {
    if (!ok(req, res)) return;
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ success: false, message: 'Account not found.' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified. Please login.' });

    const result = user.verifyOTP(otp);
    if (!result.valid) {
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: result.reason });
    }

    // Mark verified
    user.isEmailVerified = true;
    user.otp = undefined;
    user.lastLogin = new Date();
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens = [refreshToken];
    user.stats.memberSince = new Date();
    await user.save({ validateBeforeSave: false });

    // Welcome email (non-blocking)
    sendWelcomeEmail(user).catch(e => console.error('Welcome email error:', e.message));

    res.json({
      success: true,
      message: 'Email verified! Welcome to YogaFlow.',
      accessToken,
      refreshToken,
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, phone: user.phone, role: user.role,
        avatar: user.avatar, stats: user.stats, preferences: user.preferences,
      }
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ success: false, message: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/auth/resend-verification ────────────────────────────────────────
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    if (!ok(req, res)) return;
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ success: true, message: 'If that account exists, we sent a new OTP.' });
    if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email already verified.' });

    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });
    await sendEmailVerification(user, otp);
    res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  try {
    if (!ok(req, res)) return;
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });

    if (!user.isEmailVerified) {
      // Resend OTP
      const otp = user.generateOTP();
      await user.save({ validateBeforeSave: false });
      sendEmailVerification(user, otp).catch(e => console.error(e.message));
      return res.status(403).json({
        success: false,
        message: 'Email not verified. We sent a new OTP to your email.',
        needsVerification: true,
        email
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), refreshToken];
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Login successful!',
      accessToken,
      refreshToken,
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, phone: user.phone, role: user.role,
        avatar: user.avatar, stats: user.stats, preferences: user.preferences,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ── POST /api/auth/refresh ─────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required.' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken))
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    const tokens = generateTokens(user._id);
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save({ validateBeforeSave: false });
    res.json({ success: true, ...tokens });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────────
router.post('/logout', protect, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: refreshToken }
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch {
    res.status(500).json({ success: false, message: 'Logout failed.' });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    if (!ok(req, res)) return;
    const { email } = req.body;
    const msg = `If an account exists for ${email}, we sent a 6-digit OTP.`;
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: true, message: msg });

    // Rate limit: 60 second cooldown
    if (user.otp?.expiresAt) {
      const expire = parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000;
      const remaining = new Date(user.otp.expiresAt) - Date.now();
      if (remaining > expire - 60000)
        return res.status(429).json({ success: false, message: 'Wait 60 seconds before requesting another OTP.' });
    }

    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    const result = await sendOTPEmail(user, otp);
    if (!result.success) console.error('OTP email failed:', result.reason);

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
});

// ── POST /api/auth/verify-otp ──────────────────────────────────────────────────
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
], async (req, res) => {
  try {
    if (!ok(req, res)) return;
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid request.' });

    const result = user.verifyOTP(otp);
    if (!result.valid) {
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ success: false, message: result.reason });
    }

    const jwt = require('jsonwebtoken');
    const resetToken = jwt.sign(
      { id: user._id, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ success: true, message: 'OTP verified.', resetToken });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post('/reset-password', [
  body('resetToken').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password needs uppercase, lowercase, and a number'),
  body('confirmPassword').custom((v, { req }) => v === req.body.password).withMessage('Passwords do not match'),
], async (req, res) => {
  try {
    if (!ok(req, res)) return;
    const jwt = require('jsonwebtoken');
    let decoded;
    try { decoded = jwt.verify(req.body.resetToken, process.env.JWT_SECRET); }
    catch { return res.status(400).json({ success: false, message: 'Reset token expired. Please request a new OTP.' }); }
    if (decoded.purpose !== 'password_reset')
      return res.status(400).json({ success: false, message: 'Invalid reset token.' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = req.body.password;
    user.otp = undefined;
    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Password reset failed.' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -refreshTokens');
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
});

module.exports = router;

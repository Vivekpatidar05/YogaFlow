/**
 * Cloudinary utility — uses official Cloudinary v2 SDK
 * SDK handles ALL signature generation automatically — no manual crypto.
 *
 * Setup (free — 10GB storage, 25 credits/month):
 * 1. https://cloudinary.com → sign up free
 * 2. Dashboard → copy Cloud Name, API Key, API Secret
 * 3. Add to Railway Variables:
 *    CLOUDINARY_CLOUD_NAME = your_cloud_name
 *    CLOUDINARY_API_KEY    = your_api_key
 *    CLOUDINARY_API_SECRET = your_api_secret
 */

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY    &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Upload an image buffer to Cloudinary.
 * @param {Buffer} buffer  - Image file buffer from multer
 * @param {Object} options - { folder, public_id }
 * @returns {Promise<{success, url, public_id, bytes}>}
 */
async function uploadImage(buffer, options = {}) {
  if (!isConfigured()) {
    return {
      success: false,
      reason:  'Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Railway variables.',
    };
  }

  try {
    // Upload buffer via stream — Cloudinary SDK handles everything
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder:          options.folder    || 'yogaflow',
          public_id:       options.public_id || undefined,
          resource_type:   'image',
          overwrite:       true,
          transformation:  [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else        resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    console.log(`✅ Cloudinary upload OK: ${result.secure_url}`);
    return {
      success:   true,
      url:       result.secure_url,
      public_id: result.public_id,
      width:     result.width,
      height:    result.height,
      bytes:     result.bytes,
      format:    result.format,
    };

  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * Delete an image by public_id.
 */
async function deleteImage(publicId) {
  if (!isConfigured() || !publicId) return { success: false };
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: result.result === 'ok' };
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
    return { success: false };
  }
}

module.exports = { uploadImage, deleteImage, isConfigured };

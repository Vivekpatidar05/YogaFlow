/**
 * Cloudinary image upload utility
 * Uses HTTPS API directly — works on Railway (no blocked ports)
 * 
 * Setup (FREE — 10GB storage, 25 credits/month):
 * 1. Go to https://cloudinary.com → sign up free
 * 2. Dashboard → copy Cloud Name, API Key, API Secret
 * 3. Add to Railway Variables:
 *    CLOUDINARY_CLOUD_NAME = your_cloud_name
 *    CLOUDINARY_API_KEY    = your_api_key
 *    CLOUDINARY_API_SECRET = your_api_secret
 */

const https  = require('https');
const http   = require('http');
const crypto = require('crypto');

const CLOUD   = () => process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = () => process.env.CLOUDINARY_API_KEY;
const SECRET  = () => process.env.CLOUDINARY_API_SECRET;

function isConfigured() {
  return !!(CLOUD() && API_KEY() && SECRET());
}

/**
 * Upload a buffer/base64 image to Cloudinary
 * @param {Buffer|string} imageData - Buffer or base64 string
 * @param {Object} options - { folder, public_id, transformation }
 * @returns {Promise<{success, url, public_id, width, height}>}
 */
async function uploadImage(imageData, options = {}) {
  if (!isConfigured()) {
    console.warn('⚠️  Cloudinary not configured — image upload skipped');
    return { success: false, reason: 'Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Railway variables.' };
  }

  try {
    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder    = options.folder || 'yogaflow';
    const publicId  = options.public_id || `${folder}/${timestamp}_${crypto.randomBytes(6).toString('hex')}`;

    // Build signature
    const sigParams = {
      folder,
      public_id: publicId,
      timestamp,
    };
    const sigString = Object.keys(sigParams).sort()
      .map(k => `${k}=${sigParams[k]}`)
      .join('&') + SECRET();
    const signature = crypto.createHash('sha256').update(sigString).digest('hex');

    // Convert buffer to base64 data URI if needed
    let base64Data;
    if (Buffer.isBuffer(imageData)) {
      base64Data = imageData.toString('base64');
    } else if (typeof imageData === 'string' && imageData.startsWith('data:')) {
      base64Data = imageData.split(',')[1];
    } else {
      base64Data = imageData;
    }

    // Build multipart form body
    const boundary = `----CloudinaryBoundary${crypto.randomBytes(8).toString('hex')}`;
    const mimeType = options.mimeType || 'image/jpeg';

    const fields = {
      file:      `data:${mimeType};base64,${base64Data}`,
      api_key:   API_KEY(),
      timestamp,
      signature,
      folder,
      public_id: publicId,
      eager:     'c_fill,w_800,h_600,q_auto|c_fill,w_200,h_200,r_max,q_auto',
    };

    let body = '';
    for (const [key, val] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${val}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const bodyBuffer = Buffer.from(body, 'utf8');

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.cloudinary.com',
        path:     `/v1_1/${CLOUD()}/image/upload`,
        method:   'POST',
        headers:  {
          'Content-Type':   `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuffer.length,
        },
      }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
          catch (e) { reject(new Error('Cloudinary response parse error: ' + data)); }
        });
      });
      req.on('error', reject);
      req.write(bodyBuffer);
      req.end();
    });

    if (result.status !== 200) {
      console.error('Cloudinary upload error:', result.data);
      return { success: false, reason: result.data.error?.message || 'Upload failed' };
    }

    const d = result.data;
    console.log(`✅ Image uploaded: ${d.secure_url}`);
    return {
      success:   true,
      url:       d.secure_url,
      public_id: d.public_id,
      width:     d.width,
      height:    d.height,
      format:    d.format,
      bytes:     d.bytes,
    };

  } catch (err) {
    console.error('Cloudinary upload exception:', err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * Delete an image from Cloudinary by public_id
 */
async function deleteImage(publicId) {
  if (!isConfigured() || !publicId) return { success: false };
  try {
    const timestamp = Math.round(Date.now() / 1000).toString();
    const sigString = `public_id=${publicId}&timestamp=${timestamp}${SECRET()}`;
    const signature = crypto.createHash('sha256').update(sigString).digest('hex');

    const body = `public_id=${encodeURIComponent(publicId)}&timestamp=${timestamp}&api_key=${API_KEY()}&signature=${signature}`;
    const bodyBuffer = Buffer.from(body);

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.cloudinary.com',
        path:     `/v1_1/${CLOUD()}/image/destroy`,
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': bodyBuffer.length },
      }, (res) => {
        let data = '';
        res.on('data', c => { data += c; });
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
      });
      req.on('error', reject);
      req.write(bodyBuffer);
      req.end();
    });
    return { success: result.result === 'ok' };
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
    return { success: false };
  }
}

module.exports = { uploadImage, deleteImage, isConfigured };

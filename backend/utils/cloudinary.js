/**
 * Cloudinary image upload — YogaFlow
 * Uses Cloudinary HTTP API directly (no SDK needed, works on Railway)
 *
 * SETUP (free — 10GB storage):
 * 1. https://cloudinary.com → sign up free
 * 2. Dashboard → copy Cloud Name, API Key, API Secret
 * 3. Add to Railway Variables:
 *    CLOUDINARY_CLOUD_NAME = your_cloud_name
 *    CLOUDINARY_API_KEY    = your_api_key
 *    CLOUDINARY_API_SECRET = your_api_secret
 */

const https  = require('https');
const crypto = require('crypto');

const CLOUD  = () => process.env.CLOUDINARY_CLOUD_NAME;
const KEY    = () => process.env.CLOUDINARY_API_KEY;
const SECRET = () => process.env.CLOUDINARY_API_SECRET;

function isConfigured() {
  return !!(CLOUD() && KEY() && SECRET());
}

/**
 * Upload image buffer to Cloudinary.
 * Signature covers EXACTLY the params sent (alphabetical, no file/api_key/resource_type).
 */
async function uploadImage(buffer, options = {}) {
  if (!isConfigured()) {
    return {
      success: false,
      reason:  'Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to Railway variables.',
    };
  }

  try {
    const timestamp = String(Math.round(Date.now() / 1000));
    const folder    = options.folder    || 'yogaflow';
    const publicId  = options.public_id ||
      `${folder}/${timestamp}_${crypto.randomBytes(6).toString('hex')}`;

    // ── Build ONLY the params we actually send (no eager, no extras) ─────────
    // Rule: sign every param except file, api_key, resource_type, type, callback
    const toSign = { folder, public_id: publicId, timestamp };

    // Signature: params sorted alphabetically, joined with &, appended with secret
    const sigString =
      Object.keys(toSign).sort()
        .map(k => `${k}=${toSign[k]}`)
        .join('&') + SECRET();

    const signature = crypto.createHash('sha256').update(sigString).digest('hex');

    // ── Convert buffer to base64 data URI ────────────────────────────────────
    const mime   = options.mimeType || 'image/jpeg';
    const b64    = buffer.toString('base64');
    const dataURI = `data:${mime};base64,${b64}`;

    // ── Build multipart form body ─────────────────────────────────────────────
    const boundary = `----YF${crypto.randomBytes(8).toString('hex')}`;
    const fields   = {
      file:      dataURI,
      api_key:   KEY(),
      timestamp,
      signature,
      folder,
      public_id: publicId,
    };

    let body = '';
    for (const [k, v] of Object.entries(fields)) {
      body += `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`;
    }
    body += `--${boundary}--\r\n`;

    const bodyBuf = Buffer.from(body, 'utf8');

    // ── POST to Cloudinary ────────────────────────────────────────────────────
    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.cloudinary.com',
        path:     `/v1_1/${CLOUD()}/image/upload`,
        method:   'POST',
        headers:  {
          'Content-Type':   `multipart/form-data; boundary=${boundary}`,
          'Content-Length': bodyBuf.length,
        },
      }, (res) => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
          catch (e) { reject(new Error('Response parse error: ' + raw.slice(0, 200))); }
        });
      });
      req.on('error', reject);
      req.write(bodyBuf);
      req.end();
    });

    if (result.status !== 200) {
      console.error('Cloudinary upload error:', JSON.stringify(result.data));
      return { success: false, reason: result.data?.error?.message || `HTTP ${result.status}` };
    }

    const d = result.data;
    console.log(`✅ Cloudinary upload OK: ${d.secure_url}`);
    return { success: true, url: d.secure_url, public_id: d.public_id, bytes: d.bytes };

  } catch (err) {
    console.error('Cloudinary exception:', err.message);
    return { success: false, reason: err.message };
  }
}

/**
 * Delete an image by public_id.
 */
async function deleteImage(publicId) {
  if (!isConfigured() || !publicId) return { success: false };
  try {
    const timestamp = String(Math.round(Date.now() / 1000));
    const sigString = `public_id=${publicId}&timestamp=${timestamp}${SECRET()}`;
    const signature = crypto.createHash('sha256').update(sigString).digest('hex');
    const body      = `public_id=${encodeURIComponent(publicId)}&timestamp=${timestamp}&api_key=${KEY()}&signature=${signature}`;
    const bodyBuf   = Buffer.from(body);

    const r = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.cloudinary.com',
        path:     `/v1_1/${CLOUD()}/image/destroy`,
        method:   'POST',
        headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': bodyBuf.length },
      }, (res) => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
      });
      req.on('error', reject);
      req.write(bodyBuf);
      req.end();
    });

    return { success: r.result === 'ok' };
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
    return { success: false };
  }
}

module.exports = { uploadImage, deleteImage, isConfigured };

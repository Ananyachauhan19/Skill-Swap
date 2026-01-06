const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const User = require('../models/User');
const DeviceSession = require('../models/DeviceSession');
const bcrypt = require('bcryptjs');

// Multer memory storage and filter
const storage = multer.memoryStorage();
const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid image type. Allowed: jpeg, png, webp'));
    }
    cb(null, true);
  },
}).single('image');

// Reuse same constraints for cover image (private profile banner)
const uploadCoverImage = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Invalid image type. Allowed: jpeg, png, webp'));
    }
    cb(null, true);
  },
}).single('image');

// Controller handler
const updateProfilePhoto = async (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ message: 'No image file provided' });

  try {
    // Validate Cloudinary configuration before attempting upload
    const requiredEnv = ['CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'];
    const missing = requiredEnv.filter(k => !process.env[k]);
    if (missing.length) {
      console.error('[profile photo] Missing Cloudinary env vars:', missing.join(', '));
      return res.status(500).json({ message: `Cloudinary not configured. Missing: ${missing.join(', ')}` });
    }
    // Upload via stream for buffer
    const uploadFolder = process.env.CLOUDINARY_PROFILE_FOLDER || 'SkillSwaphub';
    const streamUpload = () => {
      return new Promise((resolve, reject) => {
        // Diagnostic logging (without leaking secrets) for signature issues
        const cfg = cloudinary.config();
        console.log('[profile photo] Pre-upload config:', {
          cloud_name: cfg.cloud_name,
          api_key_present: !!cfg.api_key,
          secret_present: !!cfg.api_secret,
          buffer_bytes: req.file && req.file.buffer ? req.file.buffer.length : 0,
          mimetype: req.file && req.file.mimetype,
        });
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: uploadFolder,
            resource_type: 'image',
            transformation: [
              { width: 512, height: 512, crop: 'fill', gravity: 'auto' },
              { quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const result = await streamUpload();
    console.log('[profile photo] Cloudinary upload success:', { public_id: result.public_id, secure_url: result.secure_url, folder: uploadFolder });

    // Delete previous image if exists
    if (req.user.profileImagePublicId) {
      try {
        await cloudinary.uploader.destroy(req.user.profileImagePublicId);
      } catch (e) {
        console.warn('[profile photo] Failed to delete previous image:', e.message);
      }
    }

    req.user.profileImageUrl = result.secure_url;
    req.user.profileImagePublicId = result.public_id;

    // Maintain backwards compat: update legacy profilePic
    req.user.profilePic = result.secure_url;

    await req.user.save();

    res.json({
      message: 'Profile image updated',
      profileImageUrl: req.user.profileImageUrl,
      profilePic: req.user.profilePic,
      publicId: req.user.profileImagePublicId,
    });
  } catch (err) {
    console.error('[profile photo] Upload failed:', err);
    if (err.message && err.message.includes('Invalid image type')) {
      return res.status(400).json({ message: err.message });
    }
    // Provide a sanitized error response instead of generic 500 middleware
    return res.status(500).json({ message: 'Cloudinary upload failed', error: err.message || 'Unknown error' });
  }
};

const updateCoverPhoto = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ message: 'No image file provided' });

  try {
    const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = requiredEnv.filter((k) => !process.env[k]);
    if (missing.length) {
      console.error('[cover photo] Missing Cloudinary env vars:', missing.join(', '));
      return res.status(500).json({ message: `Cloudinary not configured. Missing: ${missing.join(', ')}` });
    }

    const uploadFolder = process.env.CLOUDINARY_COVER_FOLDER || process.env.CLOUDINARY_PROFILE_FOLDER || 'SkillSwaphub';
    const streamUpload = () => {
      return new Promise((resolve, reject) => {
        const cfg = cloudinary.config();
        console.log('[cover photo] Pre-upload config:', {
          cloud_name: cfg.cloud_name,
          api_key_present: !!cfg.api_key,
          secret_present: !!cfg.api_secret,
          buffer_bytes: req.file && req.file.buffer ? req.file.buffer.length : 0,
          mimetype: req.file && req.file.mimetype,
        });

        const stream = cloudinary.uploader.upload_stream(
          {
            folder: uploadFolder,
            resource_type: 'image',
            transformation: [
              // Banner-like crop; keep wide aspect and avoid distortion
              { width: 1600, height: 450, crop: 'fill', gravity: 'auto' },
              { quality: 'auto' },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const result = await streamUpload();
    console.log('[cover photo] Cloudinary upload success:', { public_id: result.public_id, secure_url: result.secure_url, folder: uploadFolder });

    if (req.user.coverImagePublicId) {
      try {
        await cloudinary.uploader.destroy(req.user.coverImagePublicId);
      } catch (e) {
        console.warn('[cover photo] Failed to delete previous image:', e.message);
      }
    }

    req.user.coverImageUrl = result.secure_url;
    req.user.coverImagePublicId = result.public_id;
    await req.user.save();

    return res.json({
      message: 'Cover image updated',
      coverImageUrl: req.user.coverImageUrl,
      publicId: req.user.coverImagePublicId,
    });
  } catch (err) {
    console.error('[cover photo] Upload failed:', err);
    if (err.message && err.message.includes('Invalid image type')) {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Cloudinary upload failed', error: err.message || 'Unknown error' });
  }
};

module.exports = { uploadProfileImage, updateProfilePhoto, uploadCoverImage, updateCoverPhoto };

// Update email address for logged-in user, ensuring uniqueness
async function updateEmail(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { email } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const newEmail = email.trim().toLowerCase();
    if (!newEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // If same as current, allow but no-op
    if (req.user.email && req.user.email.toLowerCase() === newEmail) {
      return res.status(200).json({ message: 'Email is unchanged', user: req.user });
    }

    const existing = await User.findOne({ email: newEmail, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ message: 'This email is already registered with another account.' });
    }

    req.user.email = newEmail;
    await req.user.save();

    return res.json({ message: 'Email updated successfully.', user: req.user });
  } catch (err) {
    console.error('[updateEmail] error:', err);
    return res.status(500).json({ message: 'Failed to update email.' });
  }
}

// Send OTP for phone number change, ensuring uniqueness
async function sendPhoneOtp(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { phone } = req.body || {};
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const existing = await User.findOne({ phone: normalizedPhone, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ message: 'This phone number is already registered with another account.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    req.user.pendingPhone = normalizedPhone;
    req.user.otp = otp;
    req.user.otpExpires = expires;
    await req.user.save();

    // In production you would integrate with an SMS provider here.
    // For now, log OTP on the server for testing.
    console.log('[sendPhoneOtp] OTP for user', req.user._id.toString(), 'phone', normalizedPhone, 'otp', otp);

    return res.json({ message: 'OTP sent to phone number.' });
  } catch (err) {
    console.error('[sendPhoneOtp] error:', err);
    return res.status(500).json({ message: 'Failed to send OTP.' });
  }
}

// Verify OTP and update phone number
async function verifyPhoneOtp(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { phone, otp } = req.body || {};
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const normalizedPhone = phone.trim();

    if (!req.user.pendingPhone || req.user.pendingPhone !== normalizedPhone) {
      return res.status(400).json({ message: 'No pending verification for this phone number.' });
    }

    if (!req.user.otp || !req.user.otpExpires || req.user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (String(req.user.otp) !== String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    const existing = await User.findOne({ phone: normalizedPhone, _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(409).json({ message: 'This phone number is already registered with another account.' });
    }

    req.user.phone = normalizedPhone;
    req.user.pendingPhone = undefined;
    req.user.otp = undefined;
    req.user.otpExpires = undefined;
    await req.user.save();

    return res.json({ message: 'Phone verified and updated successfully.', user: req.user });
  } catch (err) {
    console.error('[verifyPhoneOtp] error:', err);
    return res.status(500).json({ message: 'Failed to verify OTP.' });
  }
}

module.exports.updateEmail = updateEmail;
module.exports.sendPhoneOtp = sendPhoneOtp;
module.exports.verifyPhoneOtp = verifyPhoneOtp;

// Change password for logged-in user
async function changePassword(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Password change is not available for this account.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password || '');
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Basic server-side validation to mirror frontend
    if (typeof newPassword !== 'string' || newPassword.length < 6 || !newPassword.includes('@')) {
      return res.status(400).json({ message: "New password must be at least 6 characters long and include '@'." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[changePassword] error:', err);
    return res.status(500).json({ message: 'Failed to update password.' });
  }
}

module.exports.changePassword = changePassword;

// List active device sessions for the logged-in user
async function getActiveDevices(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    let sessions = await DeviceSession.find({ user: req.user._id, revoked: false })
      .sort({ lastActive: -1 });

    // If no device sessions exist yet (e.g. legacy logins before this feature),
    // create a session entry for the current request so that at least one
    // active device is shown.
    if (!sessions.length) {
      try {
        const userAgent = req.get('user-agent') || 'Unknown device';
        const ip =
          (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) ||
          req.ip ||
          '';
        const created = await DeviceSession.create({ user: req.user._id, userAgent, ip });
        sessions = [created];
      } catch (e) {
        console.error('[getActiveDevices] failed to create fallback session:', e);
      }
    }

    let currentId = req.sessionId;
    if (!currentId && sessions.length === 1) {
      currentId = sessions[0]._id.toString();
    }

    const devices = sessions.map((s) => ({
      id: s._id,
      device: s.userAgent || 'Unknown device',
      location: s.ip ? `IP: ${s.ip}` : 'Unknown location',
      lastActive: s.lastActive,
      current: currentId && String(s._id) === String(currentId),
      revoked: !!s.revoked,
    }));

    return res.json({ devices });
  } catch (err) {
    console.error('[getActiveDevices] error:', err);
    return res.status(500).json({ message: 'Failed to load devices.' });
  }
}

// Logout a specific device session
async function logoutDevice(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { id } = req.params;
    const session = await DeviceSession.findOne({ _id: id, user: req.user._id });
    if (!session) {
      return res.status(404).json({ message: 'Device session not found.' });
    }

    session.revoked = true;
    await session.save();

    return res.json({ message: 'Device logged out successfully.' });
  } catch (err) {
    console.error('[logoutDevice] error:', err);
    return res.status(500).json({ message: 'Failed to logout device.' });
  }
}

// Logout all other devices except the current one
async function logoutAllDevices(req, res) {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const currentId = req.sessionId;

    const query = { user: req.user._id };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    await DeviceSession.updateMany(query, { revoked: true });

    return res.json({ message: 'Logged out from all other devices.' });
  } catch (err) {
    console.error('[logoutAllDevices] error:', err);
    return res.status(500).json({ message: 'Failed to logout from all devices.' });
  }
}

module.exports.getActiveDevices = getActiveDevices;
module.exports.logoutDevice = logoutDevice;
module.exports.logoutAllDevices = logoutAllDevices;
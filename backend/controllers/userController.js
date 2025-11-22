const multer = require('multer');
const cloudinary = require('../utils/cloudinary');
const User = require('../models/User');

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

module.exports = { uploadProfileImage, updateProfilePhoto };
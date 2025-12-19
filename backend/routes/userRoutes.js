const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { uploadProfileImage, updateProfilePhoto, updateEmail, sendPhoneOtp, verifyPhoneOtp, changePassword } = require('../controllers/userController');

const router = express.Router();

// PATCH /api/user/profile-photo
router.patch('/user/profile-photo', requireAuth, (req, res, next) => {
  uploadProfileImage(req, res, function(err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Image too large. Max 1MB.' });
      }
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    updateProfilePhoto(req, res, next);
  });
});

// PATCH /api/user/email - update email if not already taken
router.patch('/user/email', requireAuth, updateEmail);

// POST /api/user/phone/send-otp - start phone verification
router.post('/user/phone/send-otp', requireAuth, sendPhoneOtp);

// POST /api/user/phone/verify-otp - verify OTP and update phone
router.post('/user/phone/verify-otp', requireAuth, verifyPhoneOtp);

// POST /api/user/password - change password for logged-in user
router.post('/user/password', requireAuth, changePassword);

module.exports = router;
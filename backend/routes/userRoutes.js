const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { uploadProfileImage, updateProfilePhoto } = require('../controllers/userController');

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

module.exports = router;
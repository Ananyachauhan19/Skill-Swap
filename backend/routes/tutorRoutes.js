const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const tutor = require('../controllers/tutorController');

// User submits application
router.post('/tutor/apply', requireAuth, tutor.uploadFields, tutor.apply);
// User checks status
router.get('/tutor/status', requireAuth, tutor.ensureTutorActivation, tutor.status);

// Admin views all applications
router.get('/admin/tutor/applications', requireAuth, requireAdmin, tutor.list);
router.put('/admin/tutor/applications/:id/approve', requireAuth, requireAdmin, tutor.approve);
router.put('/admin/tutor/applications/:id/reject', requireAuth, requireAdmin, tutor.reject);

module.exports = router;

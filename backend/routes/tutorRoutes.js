const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const tutor = require('../controllers/tutorController');

// User submits application
router.post('/tutor/apply', requireAuth, tutor.uploadFields, tutor.apply);
// User checks status
router.get('/tutor/status', requireAuth, tutor.ensureTutorActivation, tutor.status);
// Get verified tutor skills (approved skills from TutorApplication)
router.get('/tutor/verified-skills', requireAuth, tutor.getVerifiedSkills);
// Prefill defaults for apply/tutor form
router.get('/tutor/apply/defaults', requireAuth, tutor.prefillApplyDefaults);
// Tutor requests a skills update (pending until admin approval)
router.post('/tutor/skills/update-request', requireAuth, tutor.uploadOptionalFields, tutor.requestSkillsUpdate);
// User can revert a pending skills-update to start fresh
router.post('/tutor/skills/revert-pending', requireAuth, tutor.revertPendingUpdate);

// Admin views all applications
router.get('/admin/tutor/applications', requireAuth, requireAdmin, tutor.list);
router.put('/admin/tutor/applications/:id/approve', requireAuth, requireAdmin, tutor.approve);
router.put('/admin/tutor/applications/:id/reject', requireAuth, requireAdmin, tutor.reject);

module.exports = router;

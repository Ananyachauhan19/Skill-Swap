const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Public routes
router.get('/public/jobs', careerController.getActiveJobPostings);
router.get('/public/jobs/:id', careerController.getJobPostingById);

// User routes (optional auth - can apply without login)
router.post('/applications', careerController.submitJobApplication);

// Admin routes
router.post('/admin/jobs', requireAuth, requireAdmin, careerController.createJobPosting);
router.get('/admin/jobs', requireAuth, requireAdmin, careerController.getAllJobPostingsAdmin);
router.put('/admin/jobs/:id', requireAuth, requireAdmin, careerController.updateJobPosting);
router.delete('/admin/jobs/:id', requireAuth, requireAdmin, careerController.deleteJobPosting);
router.patch('/admin/jobs/:id/toggle-status', requireAuth, requireAdmin, careerController.toggleJobStatus);

router.get('/admin/applications', requireAuth, requireAdmin, careerController.getAllApplications);
router.get('/admin/jobs/:jobId/applications', requireAuth, requireAdmin, careerController.getJobApplications);
router.patch('/admin/applications/:id/status', requireAuth, requireAdmin, careerController.updateApplicationStatus);

router.get('/admin/stats', requireAuth, requireAdmin, careerController.getCareerStats);

module.exports = router;

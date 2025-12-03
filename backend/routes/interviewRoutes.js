const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const ctrl = require('../controllers/interviewController');

// Create interview request (by logged-in user)
router.post('/create', requireAuth, ctrl.submitRequest);

// Apply to become an interviewer (upload resume)
router.post('/apply', requireAuth, ctrl.applyInterviewer);

// Public: list approved interviewers (filter by company/position)
router.get('/interviewers', requireAuth, ctrl.getApprovedInterviewers);

// Admin: list all interviewer applications
router.get('/applications', requireAuth, ctrl.listApplications);

// Get current user's application
router.get('/application', requireAuth, ctrl.getMyApplication);

// Admin approve application
router.post('/applications/:id/approve', requireAuth, ctrl.approveApplication);
// Admin reject application
router.post('/applications/:id/reject', requireAuth, ctrl.rejectApplication);

// Get requests for user (or all if admin)
router.get('/requests', requireAuth, ctrl.getUserRequests);

// Get single interview request by ID
router.get('/requests/:id', requireAuth, ctrl.getRequestById);

// Admin: get all requests
router.get('/all-requests', requireAuth, ctrl.getAllRequests);

// Admin assigns an interviewer by username
router.post('/assign', requireAuth, ctrl.assignInterviewer);

// Interviewer schedules assigned interview
router.post('/schedule', requireAuth, ctrl.scheduleInterview);

// Get scheduled interviews for user or interviewer
router.get('/scheduled', requireAuth, ctrl.getScheduledForUserOrInterviewer);

// Rate interviewer after completed interview
router.post('/rate', requireAuth, ctrl.rateInterviewer);

// Get user's interview history
router.get('/my-interviews', requireAuth, ctrl.getMyInterviews);

// Get interview statistics
router.get('/stats', requireAuth, ctrl.getInterviewStats);

// Optional public endpoints used by frontend: past interviews and faqs
router.get('/past', ctrl.getPastInterviews);

router.get('/faqs', ctrl.getFaqs);

module.exports = router;

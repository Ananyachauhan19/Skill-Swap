const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { requireEmployee, requireEmployeeAccess } = require('../middleware/requireEmployee');
const ctrl = require('../controllers/interviewController');

// Create interview request (by logged-in user)
router.post('/create', requireAuth, ctrl.submitRequest);

// Upload resume for interview request
router.post('/upload-resume', requireAuth, ctrl.uploadResume);

// Apply to become an interviewer (upload resume)
router.post('/apply', requireAuth, ctrl.applyInterviewer);

// Get qualifications list from CSV
router.get('/qualifications', ctrl.getQualifications);

// Public: list approved interviewers (filter by company/position)
router.get('/interviewers', requireAuth, ctrl.getApprovedInterviewers);

// Admin / employee: list all interviewer applications
router.get('/applications', requireAuth, ctrl.listApplications);
// Employee-only listing with explicit access check (interviewer approval module)
router.get('/employee/applications', requireEmployee, requireEmployeeAccess('interviewer'), ctrl.listApplications);

// Get current user's application
router.get('/application', requireAuth, ctrl.getMyApplication);

// Get interviewer verification status
router.get('/verification-status', requireAuth, ctrl.getInterviewerStatus);

// Admin approve application
router.post('/applications/:id/approve', requireAuth, requireAdmin, ctrl.approveApplication);
// Admin reject application
router.post('/applications/:id/reject', requireAuth, requireAdmin, ctrl.rejectApplication);

// Employee approve/reject interviewer application (interview-expert module)
router.post('/employee/applications/:id/approve', requireEmployee, requireEmployeeAccess('interviewer'), ctrl.approveApplication);
router.post('/employee/applications/:id/reject', requireEmployee, requireEmployeeAccess('interviewer'), ctrl.rejectApplication);

// Get requests for user (or all if admin)
router.get('/requests', requireAuth, ctrl.getUserRequests);

// Get single interview request by ID
router.get('/requests/:id', requireAuth, ctrl.getRequestById);

// Admin: get all requests
router.get('/all-requests', requireAuth, requireAdmin, ctrl.getAllRequests);

// Admin assigns an interviewer by username
router.post('/assign', requireAuth, ctrl.assignInterviewer);

// Admin: search for approved interviewers (for autocomplete)
router.get('/search-interviewers', requireAuth, requireAdmin, ctrl.searchInterviewers);

// Interviewer schedules assigned interview
router.post('/schedule', requireAuth, ctrl.scheduleInterview);

// Time negotiation: interviewer suggests slots, requester responds
router.post('/suggest-slots', requireAuth, ctrl.suggestInterviewerSlots);
router.post('/requester/accept-slot', requireAuth, ctrl.requesterAcceptInterviewerSlot);
router.post('/requester/alternate-slots', requireAuth, ctrl.requesterSuggestAlternateSlots);
router.post('/interviewer/accept-alternate', requireAuth, ctrl.interviewerAcceptAlternateSlot);
router.post('/interviewer/reject-alternate', requireAuth, ctrl.interviewerRejectAlternateSlots);

// Assigned interviewer approves or rejects the interview
router.post('/approve', requireAuth, ctrl.approveAssignedInterview);
router.post('/reject', requireAuth, ctrl.rejectAssignedInterview);

// Get scheduled interviews for user or interviewer
router.get('/scheduled', requireAuth, ctrl.getScheduledForUserOrInterviewer);

// Rate interviewer after completed interview
router.post('/rate', requireAuth, ctrl.rateInterviewer);

// Get user's interview history
router.get('/my-interviews', requireAuth, ctrl.getMyInterviews);

// Get interview statistics
router.get('/stats', requireAuth, ctrl.getInterviewStats);

// Get global top performers (interviewers and candidates)
router.get('/top-performers', ctrl.getTopPerformers);

// Get feedback for a specific interviewer
router.get('/interviewer/:interviewerId/feedback', ctrl.getInterviewerFeedback);

// Optional public endpoints used by frontend: past interviews and faqs
router.get('/past', ctrl.getPastInterviews);

router.get('/faqs', ctrl.getFaqs);

// Admin: delete interviewer and cascade remove related documents
router.delete('/interviewer', requireAuth, requireAdmin, ctrl.deleteInterviewerAndCascade);

module.exports = router;

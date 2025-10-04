const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const ctrl = require('../controllers/interviewController');

// Create interview request (by logged-in user)
router.post('/create', requireAuth, ctrl.submitRequest);

// Get requests for user (or all if admin)
router.get('/requests', requireAuth, ctrl.getUserRequests);

// Admin: get all requests
router.get('/all-requests', requireAuth, ctrl.getAllRequests);

// Admin assigns an interviewer by username
router.post('/assign', requireAuth, ctrl.assignInterviewer);

// Interviewer schedules assigned interview
router.post('/schedule', requireAuth, ctrl.scheduleInterview);

// Get scheduled interviews for user or interviewer
router.get('/scheduled', requireAuth, ctrl.getScheduledForUserOrInterviewer);

module.exports = router;

const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Public route - track visitor (no auth required)
router.post('/track', visitorController.trackVisitor);

// Admin routes - require authentication and admin authorization
router.get('/stats', requireAuth, requireAdmin, visitorController.getVisitorStats);
router.get('/all', requireAuth, requireAdmin, visitorController.getAllVisitors);
router.get('/analytics', requireAuth, requireAdmin, visitorController.getVisitorAnalytics);
router.delete('/cleanup', requireAuth, requireAdmin, visitorController.deleteOldVisitors);

module.exports = router;

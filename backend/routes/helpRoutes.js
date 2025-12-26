const express = require('express');
const router = express.Router();
const helpController = require('../controllers/helpController');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

// Public route - submit help request
router.post('/contact', helpController.submitHelpRequest);

// Admin routes
router.get('/messages', requireAuth, requireAdmin, helpController.getAllHelpMessages);
router.get('/messages/:id', requireAuth, requireAdmin, helpController.getHelpMessageById);
router.post('/messages/:id/reply', requireAuth, requireAdmin, helpController.replyToHelpMessage);
router.patch('/messages/:id/status', requireAuth, requireAdmin, helpController.updateHelpMessageStatus);
router.get('/statistics', requireAuth, requireAdmin, helpController.getHelpStatistics);
router.get('/date-statistics', requireAuth, requireAdmin, helpController.getDateStatistics);

module.exports = router;

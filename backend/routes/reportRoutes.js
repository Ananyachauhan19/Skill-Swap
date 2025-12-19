const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { createReport, listReports, markResolved } = require('../controllers/reportController');

// User submits a report (video or account)
router.post('/report', requireAuth, createReport);

// Admin fetches reports (optionally filter by ?type=video|account)
router.get('/admin/reports', requireAuth, requireAdmin, listReports);

// Mark a report as resolved
router.post('/admin/reports/:id/resolve', requireAuth, requireAdmin, markResolved);

module.exports = router;

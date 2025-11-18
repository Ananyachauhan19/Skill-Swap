// filepath: d:\Skill-Swap\backend\routes\adminRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const adminStatsController = require('../controllers/adminStatsController');

// Protect all routes in this file with both authentication and admin authorization
router.use(requireAuth, requireAdmin);

// Example route to get admin dashboard data
// New consolidated stats route
router.get('/stats', adminStatsController.getStats);
// Analytics route for charts
router.get('/analytics', adminStatsController.getAnalytics);

module.exports = router;
// filepath: d:\Skill-Swap\backend\routes\adminRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');

// Protect all routes in this file with both authentication and admin authorization
router.use(requireAuth, requireAdmin);

// Example route to get admin dashboard data
router.get('/dashboard-stats', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    // Add more stats as needed
    res.json({
      message: `Welcome Admin, ${req.user.name}`,
      stats: {
        totalUsers: userCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching admin stats.' });
  }
});

module.exports = router;
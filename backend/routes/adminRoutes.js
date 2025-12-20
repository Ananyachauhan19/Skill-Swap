// filepath: d:\Skill-Swap\backend\routes\adminRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const Session = require('../models/Session');
const SkillMate = require('../models/SkillMate');
const Video = require('../models/Video');
const supabase = require('../utils/supabaseClient');
const adminStatsController = require('../controllers/adminStatsController');

// Protect all routes in this file with both authentication and admin authorization
router.use(requireAuth, requireAdmin);

// Example route to get admin dashboard data
// New consolidated stats route
router.get('/stats', adminStatsController.getStats);
// Analytics route for charts
router.get('/analytics', adminStatsController.getAnalytics);

// Get all users with filtering
router.get('/users', async (req, res) => {
  try {
    const { role, search, startDate, endDate } = req.query;
    
    let query = {};
    
    // Filter by role
    if (role && role !== 'all') {
      if (role === 'expert') {
        // Expert users are those who are teachers or both
        query.role = { $in: ['teacher', 'both'] };
      } else {
        query.role = role;
      }
    }
    
    // Search by name or username
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    const users = await User.find(query)
      .select('-password -otp -otpExpires')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get user details with related data
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user details
    const user = await User.findById(userId)
      .select('-password -otp -otpExpires')
      .populate('skillMates', 'username firstName lastName profilePic role')
      .lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get sessions where user is creator or requester
    const sessions = await Session.find({
      $or: [{ creator: userId }, { requester: userId }]
    })
      .populate('creator', 'username firstName lastName')
      .populate('requester', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .lean();
    
    // Get SkillMate requests (both sent and received)
    const skillMateRequests = await SkillMate.find({
      $or: [{ requester: userId }, { recipient: userId }]
    })
      .populate('requester', 'username firstName lastName profilePic')
      .populate('recipient', 'username firstName lastName profilePic')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      user,
      sessions,
      skillMateRequests,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// Delete a user account (admin only) and detach basic relations
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove this user from other users' skillMates arrays
    await User.updateMany(
      { skillMates: userId },
      { $pull: { skillMates: userId } }
    );

    // Delete SkillMate relationship documents
    await SkillMate.deleteMany({
      $or: [{ requester: userId }, { recipient: userId }],
    });

    // Delete user's videos (including Supabase files where possible)
    const videos = await Video.find({ userId }).lean();
    if (Array.isArray(videos) && videos.length) {
      const pathsToRemove = [];
      for (const v of videos) {
        if (v.videoPath) pathsToRemove.push(v.videoPath);
        if (v.thumbnailPath) pathsToRemove.push(v.thumbnailPath);
      }
      if (pathsToRemove.length) {
        try {
          const { error } = await supabase.storage
            .from('videos')
            .remove(pathsToRemove);
          if (error) {
            console.error('[Admin] Failed to delete some Supabase video assets:', error.message);
          }
        } catch (e) {
          console.error('[Admin] Supabase deletion error:', e.message);
        }
      }
      await Video.deleteMany({ userId });
    }

    // Finally delete the user document
    await User.deleteOne({ _id: userId });

    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ message: 'Failed to delete user account' });
  }
});

module.exports = router;
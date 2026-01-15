// filepath: d:\Skill-Swap\backend\routes\adminRoutes.js
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Session = require('../models/Session');
const SkillMate = require('../models/SkillMate');
const Video = require('../models/Video');
const SessionRequest = require('../models/SessionRequest');
const InterviewRequest = require('../models/InterviewRequest');
const ApprovedInterviewer = require('../models/ApprovedInterviewer');
const InterviewerApplication = require('../models/InterviewerApplication');
const Employee = require('../models/Employee');
const employeeActivityController = require('../controllers/employeeActivityController');
const Report = require('../models/Report');
const supabase = require('../utils/supabaseClient');
const adminStatsController = require('../controllers/adminStatsController');
const analyticsController = require('../controllers/analyticsController');

// Protect all routes in this file with both authentication and admin authorization
router.use(requireAuth, requireAdmin);

// Employee activity profile (admin view)
router.get('/employees/:id/activity', employeeActivityController.getEmployeeActivityForAdmin);

// Example route to get admin dashboard data
// New consolidated stats route
router.get('/stats', adminStatsController.getStats);
// Analytics route for charts
router.get('/analytics', adminStatsController.getAnalytics);

// New Analytics Dashboard Routes
router.get('/analytics/overview', analyticsController.getOverview);
router.get('/analytics/users', analyticsController.getUsers);
router.get('/analytics/sessions', analyticsController.getSessions);
router.get('/analytics/interviews', analyticsController.getInterviews);
router.get('/analytics/skills', analyticsController.getSkills);
router.get('/analytics/rewards', analyticsController.getRewards);
router.get('/analytics/reports', analyticsController.getReports);
router.get('/analytics/visitors', analyticsController.getVisitorAnalytics);

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

    // Get user core details
    const user = await User.findById(userId)
      .select('-password -otp -otpExpires')
      .populate('skillMates', 'username firstName lastName profilePic role')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get sessions where user is creator or requester (legacy session model)
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

    // One-on-one session stats (SessionRequest model)
    const sessionRequests = await SessionRequest.find({
      sessionType: 'one-on-one',
      $or: [{ requester: userId }, { tutor: userId }],
    })
      .select('requester tutor status')
      .lean();

    const totalSessions = sessionRequests.length;
    const sessionsAsStudent = sessionRequests.filter((s) => String(s.requester) === String(userId)).length;
    const sessionsAsTutor = sessionRequests.filter((s) => String(s.tutor) === String(userId)).length;

    const sessionStats = {
      totalSessions,
      sessionsAsStudent,
      sessionsAsTutor,
    };

    // Interview stats (InterviewRequest + interviewer aggregates)
    const interviewRequests = await InterviewRequest.find({
      $or: [{ requester: userId }, { assignedInterviewer: userId }],
    })
      .select('requester assignedInterviewer status rating scheduledAt company position')
      .populate('requester', 'username firstName lastName profilePic')
      .populate('assignedInterviewer', 'username firstName lastName profilePic')
      .lean();

    // Count only completed interviews
    const completedInterviews = interviewRequests.filter((r) => r.status === 'completed');
    const totalCompletedInterviews = completedInterviews.length;
    const completedAsRequester = completedInterviews.filter((r) => String(r.requester._id || r.requester) === String(userId)).length;
    const completedAsInterviewer = completedInterviews.filter((r) => String(r.assignedInterviewer?._id || r.assignedInterviewer) === String(userId)).length;

    // Get scheduled interviews (all interviews with scheduled status, regardless of time)
    const scheduledInterviews = interviewRequests
      .filter((r) => 
        r.scheduledAt && 
        ['scheduled', 'assigned'].includes(r.status)
      )
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
      .slice(0, 20); // Show up to 20 scheduled interviews

    const ratingsAsInterviewer = interviewRequests.filter(
      (r) => r.rating != null && String(r.assignedInterviewer?._id || r.assignedInterviewer) === String(userId)
    );
    const ratingsCountAsInterviewer = ratingsAsInterviewer.length;
    const averageRatingAsInterviewer =
      ratingsCountAsInterviewer > 0
        ? ratingsAsInterviewer.reduce((sum, r) => sum + (r.rating || 0), 0) / ratingsCountAsInterviewer
        : 0;

    const interviewerApp = await InterviewerApplication.findOne({ user: userId })
      .select('-resumeUrl')
      .lean();

    const approvedInterviewer = await ApprovedInterviewer.findOne({ user: userId })
      .select('-profile.resumeUrl')
      .lean();

    const interviewStats = {
      totalCompletedInterviews,
      completedAsRequester,
      completedAsInterviewer,
      scheduledInterviews,
      ratingsCountAsInterviewer,
      averageRatingAsInterviewer,
      interviewerApp,
      approvedInterviewer,
    };

    // Reports against this user (account reports)
    const reports = await Report.find({
      type: 'account',
      $or: [
        { reportedUserId: String(userId) },
        { reportedUsername: user.username },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Employee record (if this user is also an employee)
    let employee = null;
    if (user.email) {
      employee = await Employee.findOne({ email: user.email.toLowerCase() }).lean();
    }

    res.json({
      user,
      sessions,
      skillMateRequests,
      sessionStats,
      interviewStats,
      reports,
      employee,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
});

// Get user profile by username (for admin profile view page)
router.get('/users/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Find user by username
    const user = await User.findOne({ username })
      .select('-password -otp -otpExpires')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user profile data (same structure as regular profile)
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Get user's SkillMates connections
router.get('/users/:userId/skillmates', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's SkillMates from the user document
    const user = await User.findById(userId)
      .populate('skillMates', 'username firstName lastName profilePic email country connectedAt')
      .select('skillMates')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also get SkillMate relationship documents for connection dates
    const skillMateRelations = await SkillMate.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted'
    })
      .populate('requester', 'username firstName lastName profilePic')
      .populate('recipient', 'username firstName lastName profilePic')
      .sort({ createdAt: -1 })
      .lean();

    // Combine data from both sources
    const skillMatesWithDates = user.skillMates.map(mate => {
      const relation = skillMateRelations.find(rel => 
        String(rel.requester._id) === String(mate._id) || 
        String(rel.recipient._id) === String(mate._id)
      );
      return {
        ...mate,
        connectedAt: relation?.createdAt || null
      };
    });

    res.json({ skillmates: skillMatesWithDates });
  } catch (error) {
    console.error('Error fetching skillmates:', error);
    res.status(500).json({ message: 'Failed to fetch skillmates' });
  }
});

// Employee activity profile (admin view)
router.get('/employees/:id/activity', requireAuth, requireAdmin, employeeActivityController.getEmployeeActivityForAdmin);

// Get user's session history (one-on-one sessions)
router.get('/users/:userId/session-history', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all session requests where user is requester or tutor
    const sessions = await SessionRequest.find({
      sessionType: 'one-on-one',
      $or: [{ requester: userId }, { tutor: userId }]
    })
      .populate('requester', 'username firstName lastName profilePic')
      .populate('tutor', 'username firstName lastName profilePic')
      .sort({ createdAt: -1 })
      .lean();

    // Format the data for frontend
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      date: session.scheduledDate || session.createdAt,
      role: String(session.tutor) === String(userId) ? 'tutor' : 'student',
      topic: session.topic || session.subject || 'N/A',
      duration: session.duration || 'N/A',
      rating: session.rating || null,
      status: session.status || 'pending',
      partner: String(session.tutor) === String(userId) ? session.requester : session.tutor,
      createdAt: session.createdAt
    }));

    res.json({ sessions: formattedSessions });
  } catch (error) {
    console.error('Error fetching session history:', error);
    res.status(500).json({ message: 'Failed to fetch session history' });
  }
});

// Get user's interview history
router.get('/users/:userId/interview-history', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all interview requests where user is requester or interviewer
    const interviews = await InterviewRequest.find({
      $or: [{ requester: userId }, { assignedInterviewer: userId }]
    })
      .populate('requester', 'username firstName lastName profilePic')
      .populate('assignedInterviewer', 'username firstName lastName profilePic')
      .sort({ createdAt: -1 })
      .lean();

    // Format the data for frontend
    const formattedInterviews = interviews.map(interview => ({
      _id: interview._id,
      date: interview.scheduledAt || interview.createdAt,
      role: String(interview.assignedInterviewer) === String(userId) ? 'interviewer' : 'requester',
      company: interview.company || 'N/A',
      position: interview.position || 'N/A',
      duration: interview.duration || 'N/A',
      status: interview.status || 'pending',
      rating: interview.rating || null,
      partner: String(interview.assignedInterviewer) === String(userId) ? interview.requester : interview.assignedInterviewer,
      createdAt: interview.createdAt
    }));

    res.json({ interviews: formattedInterviews });
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ message: 'Failed to fetch interview history' });
  }
});

// Get user's coin/wallet transaction history
router.get('/users/:userId/coin-history', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user's current coin balance
    const user = await User.findById(userId)
      .select('goldCoins silverCoins bronzeCoins firstName lastName')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Coin rates for calculation
    const COIN_RATES = {
      gold:   { spendPerMinute: 2, earnMultiplier: 0.75 },
      silver: { spendPerMinute: 1, earnMultiplier: 0.75 },
      bronze: { spendPerMinute: 4, earnMultiplier: 0.75 },
    };

    // Get completed sessions where user was student (coins spent)
    const learningTransactions = await SessionRequest.find({
      requester: userId,
      status: 'completed'
    })
      .populate('tutor', 'firstName lastName profilePic')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get completed sessions where user was teacher (coins earned)
    const teachingTransactions = await SessionRequest.find({
      tutor: userId,
      status: 'completed'
    })
      .populate('requester', 'firstName lastName profilePic')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Format learning transactions (spent coins)
    const formattedLearning = learningTransactions.map(session => {
      const duration = session.duration || 0;
      const coinType = (session.coinType || 'silver').toLowerCase();
      const spendRate = (COIN_RATES[coinType] || COIN_RATES.silver).spendPerMinute;
      const coinsSpent = duration * spendRate;
      
      return {
        _id: session._id,
        date: session.createdAt,
        type: 'debit',
        description: `Session with ${session.tutor ? `${session.tutor.firstName} ${session.tutor.lastName}` : 'Unknown'}`,
        subject: session.subject || 'N/A',
        topic: session.topic || 'N/A',
        duration: duration,
        coinType: coinType,
        amount: coinsSpent,
        goldAmount: coinType === 'gold' ? coinsSpent : 0,
        silverAmount: coinType === 'silver' ? coinsSpent : 0,
        partner: session.tutor ? `${session.tutor.firstName} ${session.tutor.lastName}` : 'Unknown',
        sessionType: session.sessionType || 'ONE-ON-ONE'
      };
    });

    // Format teaching transactions (earned coins)
    const formattedTeaching = teachingTransactions.map(session => {
      const duration = session.duration || 0;
      const coinType = (session.coinType || 'silver').toLowerCase();
      const spendRate = (COIN_RATES[coinType] || COIN_RATES.silver).spendPerMinute;
      const earnMultiplier = (COIN_RATES[coinType] || COIN_RATES.silver).earnMultiplier;
      const baseSpent = duration * spendRate;
      const coinsEarned = Math.round(baseSpent * earnMultiplier);
      
      return {
        _id: session._id,
        date: session.createdAt,
        type: 'credit',
        description: `Taught ${session.requester ? `${session.requester.firstName} ${session.requester.lastName}` : 'Unknown'}`,
        subject: session.subject || 'N/A',
        topic: session.topic || 'N/A',
        duration: duration,
        coinType: coinType,
        amount: coinsEarned,
        goldAmount: coinType === 'gold' ? coinsEarned : 0,
        silverAmount: coinType === 'silver' ? coinsEarned : 0,
        partner: session.requester ? `${session.requester.firstName} ${session.requester.lastName}` : 'Unknown',
        sessionType: session.sessionType || 'ONE-ON-ONE'
      };
    });

    // Combine and sort all transactions by date
    const allTransactions = [...formattedLearning, ...formattedTeaching]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ 
      transactions: allTransactions,
      currentBalance: {
        gold: user.goldCoins || 0,
        silver: user.silverCoins || 0,
        bronze: user.bronzeCoins || 0,
      },
      summary: {
        totalSpent: formattedLearning.reduce((sum, t) => sum + t.amount, 0),
        totalEarned: formattedTeaching.reduce((sum, t) => sum + t.amount, 0),
        learningSessionCount: learningTransactions.length,
        teachingSessionCount: teachingTransactions.length
      }
    });
  } catch (error) {
    console.error('Error fetching coin history:', error);
    res.status(500).json({ message: 'Failed to fetch coin history' });
  }
});

// Get user's activity logs
router.get('/users/:userId/activity-logs', async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = [];

    // Get recent sessions
    const recentSessions = await SessionRequest.find({
      $or: [{ requester: userId }, { tutor: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    recentSessions.forEach(session => {
      const role = String(session.tutor) === String(userId) ? 'tutor' : 'student';
      activities.push({
        _id: session._id,
        type: 'session',
        action: `${session.status === 'completed' ? 'Completed' : 'Scheduled'} a session as ${role}`,
        details: `Topic: ${session.topic || session.subject || 'N/A'}`,
        timestamp: session.createdAt,
        createdAt: session.createdAt
      });
    });

    // Get recent interviews
    const recentInterviews = await InterviewRequest.find({
      $or: [{ requester: userId }, { assignedInterviewer: userId }]
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    recentInterviews.forEach(interview => {
      const role = String(interview.assignedInterviewer) === String(userId) ? 'interviewer' : 'candidate';
      activities.push({
        _id: interview._id,
        type: 'interview',
        action: `${interview.status === 'completed' ? 'Completed' : 'Scheduled'} an interview as ${role}`,
        details: `${interview.company || 'Company'} - ${interview.position || 'Position'}`,
        timestamp: interview.createdAt,
        createdAt: interview.createdAt
      });
    });

    // Get recent coin events
    const ContributionEvent = require('../models/ContributionEvent');
    const recentCoinEvents = await ContributionEvent.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    recentCoinEvents.forEach(event => {
      activities.push({
        _id: event._id,
        type: 'wallet',
        action: `${event.goldCoins > 0 || event.silverCoins > 0 ? 'Earned' : 'Spent'} coins`,
        details: `${event.type || 'Transaction'} - ${Math.abs(event.goldCoins || 0)} gold, ${Math.abs(event.silverCoins || 0)} silver`,
        timestamp: event.createdAt,
        createdAt: event.createdAt
      });
    });

    // Get recent SkillMate connections
    const recentSkillMates = await SkillMate.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('requester', 'username firstName lastName')
      .populate('recipient', 'username firstName lastName')
      .lean();

    recentSkillMates.forEach(sm => {
      const partner = String(sm.requester._id) === String(userId) ? sm.recipient : sm.requester;
      activities.push({
        _id: sm._id,
        type: 'skillmate',
        action: 'Connected with a SkillMate',
        details: `${partner.firstName || partner.username}`,
        timestamp: sm.createdAt,
        createdAt: sm.createdAt
      });
    });

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit to most recent 50 activities
    const limitedActivities = activities.slice(0, 50);

    res.json({ activities: limitedActivities });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

// Get user's contribution calendar data
router.get('/users/:userId/contribution-calendar', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user to verify existence
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get contribution data from Contribution model
    const Contribution = require('../models/Contribution');
    
    // Get last 365 days of contribution data
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const dateKeyStart = oneYearAgo.toISOString().split('T')[0];

    const contributions = await Contribution.find({
      userId: userId,
      dateKey: { $gte: dateKeyStart }
    })
      .select('dateKey count breakdown')
      .sort({ dateKey: 1 })
      .lean();

    // Calculate summary statistics
    const totalContributions = contributions.reduce((sum, c) => sum + (c.count || 0), 0);
    
    // Calculate current streak
    const today = new Date().toISOString().split('T')[0];
    let currentStreak = 0;
    let checkDate = new Date();
    
    const contributionMap = {};
    contributions.forEach(c => {
      contributionMap[c.dateKey] = c.count;
    });

    // Check backwards from today for consecutive days
    while (currentStreak < 365) {
      const dateKey = checkDate.toISOString().split('T')[0];
      if (contributionMap[dateKey] && contributionMap[dateKey] > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateKey === today) {
        // If today has no contributions, start from yesterday
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = Object.keys(contributionMap).sort();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const dateKey = sortedDates[i];
      if (contributionMap[dateKey] > 0) {
        tempStreak++;
        
        // Check if next date is consecutive
        if (i < sortedDates.length - 1) {
          const currentDate = new Date(dateKey);
          const nextDate = new Date(sortedDates[i + 1]);
          const dayDiff = Math.floor((nextDate - currentDate) / (1000 * 60 * 60 * 24));
          
          if (dayDiff > 1) {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 0;
          }
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      contributions,
      summary: {
        total: totalContributions,
        currentStreak,
        longestStreak,
        daysActive: contributions.filter(c => c.count > 0).length
      }
    });
  } catch (error) {
    console.error('Error fetching contribution calendar:', error);
    res.status(500).json({ message: 'Failed to fetch contribution calendar' });
  }
});

// Delete a user account (admin only) and detach basic relations
router.delete('/users/:userId', async (req, res) => {
  console.log('DELETE /users/:userId route hit with userId:', req.params.userId);
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found with ID:', userId);
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

// Update user role (admin only)
router.put('/users/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ['teacher', 'learner', 'both', 'campus_ambassador'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role. Valid roles are: ${validRoles.join(', ')}` 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;

    await user.save();

    res.json({ 
      message: 'User role updated successfully',
      user: {
        _id: user._id,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});

// Create new Campus Ambassador (admin only)
router.post('/create-campus-ambassador', async (req, res) => {
  console.log('[CREATE CAMPUS AMBASSADOR] Route hit');
  console.log('[CREATE CAMPUS AMBASSADOR] Request body:', req.body);
  console.log('[CREATE CAMPUS AMBASSADOR] User:', req.user ? req.user._id : 'No user');
  
  try {
    const { firstName, lastName, email, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      console.log('[CREATE CAMPUS AMBASSADOR] Validation failed: Missing fields');
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      console.log('[CREATE CAMPUS AMBASSADOR] Validation failed: Password too short');
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('[CREATE CAMPUS AMBASSADOR] User already exists:', email);
      console.log('[CREATE CAMPUS AMBASSADOR] Existing user details:', {
        _id: existingUser._id,
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role
      });
      return res.status(400).json({ 
        message: 'User with this email already exists',
        details: 'This email is already registered in the system'
      });
    }

    // Generate unique username
    const baseUsername = email.split('@')[0].toLowerCase();
    let username = baseUsername;
    let counter = 1;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    console.log('[CREATE CAMPUS AMBASSADOR] Generated username:', username);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('[CREATE CAMPUS AMBASSADOR] About to create user with:', {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      username,
      role: 'learner'
    });

    // Create new user (credentials only; ambassador profile stored separately)
    const newUser = new User({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      username,
      password: hashedPassword,
      role: 'learner'
    });

    await newUser.save();
    console.log('[CREATE CAMPUS AMBASSADOR] User created successfully:', newUser._id);

    // Create CampusAmbassador profile document
    const CampusAmbassador = require('../models/CampusAmbassador');
    const ambassador = await CampusAmbassador.create({
      user: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      isFirstLogin: true,
      createdBy: req.user ? req.user._id : null,
    });

    const responseData = {
      message: 'Campus Ambassador created successfully',
      ambassador: {
        _id: ambassador._id,
        userId: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        isFirstLogin: ambassador.isFirstLogin,
      }
    };

    console.log('[CREATE CAMPUS AMBASSADOR] Sending response:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('[CREATE CAMPUS AMBASSADOR] Error:', error);
    res.status(500).json({ message: 'Failed to create campus ambassador' });
  }
});

// List all campus ambassadors (admin only)
router.get('/campus-ambassadors', async (req, res) => {
  try {
    const CampusAmbassador = require('../models/CampusAmbassador');
    const ambassadors = await CampusAmbassador.find()
      .populate('user', 'firstName lastName email username')
      .lean();

    const result = ambassadors.map(a => ({
      _id: a._id,
      userId: a.user && a.user._id,
      firstName: a.user ? a.user.firstName : a.firstName,
      lastName: a.user ? a.user.lastName : a.lastName,
      email: a.user ? a.user.email : a.email,
      username: a.user ? a.user.username : undefined,
      isFirstLogin: a.isFirstLogin,
      createdAt: a.createdAt,
    }));

    res.json({ ambassadors: result });
  } catch (error) {
    console.error('[LIST CAMPUS AMBASSADORS] Error:', error);
    res.status(500).json({ message: 'Failed to fetch campus ambassadors' });
  }
});

// Delete Campus Ambassador (admin only)
router.delete('/campus-ambassadors/:ambassadorId', async (req, res) => {
  try {
    const CampusAmbassador = require('../models/CampusAmbassador');
    const { ambassadorId } = req.params;

    // Find the campus ambassador document
    const ambassador = await CampusAmbassador.findById(ambassadorId);
    if (!ambassador) {
      return res.status(404).json({ message: 'Campus Ambassador not found' });
    }

    const userId = ambassador.user;

    // Delete the campus ambassador document
    await CampusAmbassador.deleteOne({ _id: ambassadorId });

    // Delete the associated user account
    const user = await User.findById(userId);
    if (user) {
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
    }

    res.json({ message: 'Campus Ambassador deleted successfully' });
  } catch (error) {
    console.error('[DELETE CAMPUS AMBASSADOR] Error:', error);
    res.status(500).json({ message: 'Failed to delete campus ambassador' });
  }
});

// Get activity logs for any campus ambassador (admin only)
router.get('/campus-ambassadors/:ambassadorId/activity-logs', async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const { ambassadorId } = req.params;
    const { page = 1, limit = 20, actionType } = req.query;
    
    const query = { ambassadorId };
    
    // Filter by action type if provided
    if (actionType && actionType !== 'all') {
      query.actionType = actionType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [activities, totalCount] = await Promise.all([
      ActivityLog.find(query)
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments(query)
    ]);

    res.status(200).json({
      activities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasMore: skip + activities.length < totalCount
      }
    });
  } catch (error) {
    console.error('Admin - Get activity logs error:', error);
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
});

// Get activity stats for any campus ambassador (admin only)
router.get('/campus-ambassadors/:ambassadorId/activity-stats', async (req, res) => {
  try {
    const ActivityLog = require('../models/ActivityLog');
    const mongoose = require('mongoose');
    const { ambassadorId } = req.params;

    const stats = await ActivityLog.aggregate([
      { $match: { ambassadorId: new mongoose.Types.ObjectId(ambassadorId) } },
      { $group: {
        _id: '$actionType',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    const totalActivities = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.status(200).json({
      stats: stats.map(s => ({
        actionType: s._id,
        count: s.count
      })),
      totalActivities
    });
  } catch (error) {
    console.error('Admin - Get activity stats error:', error);
    res.status(500).json({ message: 'Error fetching activity stats', error: error.message });
  }
});

module.exports = router;
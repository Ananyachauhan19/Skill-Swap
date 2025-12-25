const User = require('../models/User');
const Session = require('../models/Session');
const InterviewRequest = require('../models/InterviewRequest');
const Report = require('../models/Report');
const Contribution = require('../models/Contribution');
const AnonymousVisitor = require('../models/AnonymousVisitor');

// Helper: Get date range based on query params
function getDateRange(req) {
  const { range, startDate, endDate } = req.query;
  const now = new Date();
  let start, end;

  if (range === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (range === 'week') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'month') {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range === 'year') {
    start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  } else {
    // Default to week
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  end = end || now;
  return { start, end };
}

// Helper: Generate daily date buckets
function generateDateBuckets(start, end) {
  const buckets = [];
  const current = new Date(start);
  
  while (current <= end) {
    buckets.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return buckets;
}

// Overview Tab
exports.getOverview = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const now = new Date();
    const dateBuckets = generateDateBuckets(start, end);

    // Summary stats
    const [totalUsers, totalSessions, totalInterviews] = await Promise.all([
      // All registered users on the platform (independent of date filter)
      User.countDocuments({}),
      Session.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      InterviewRequest.countDocuments({ createdAt: { $gte: start, $lte: end } })
    ]);

    // Active user analytics based on lastActivityAt
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const [dau, wau, mau, realtimeActive] = await Promise.all([
      User.countDocuments({ lastActivityAt: { $gte: oneDayAgo } }),
      User.countDocuments({ lastActivityAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastActivityAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ lastActivityAt: { $gte: tenMinutesAgo } })
    ]);

    // User growth over time
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const userGrowthMap = userGrowth.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const userGrowthData = dateBuckets.map(date => ({
      date,
      count: userGrowthMap[date] || 0
    }));

    // Active vs Inactive users over time
    const activeUsersCount = mau;
    const inactiveUsersCount = Math.max(totalUsers - activeUsersCount, 0);

    // Activity trends (sessions and interviews)
    const sessionTrend = await Session.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const interviewTrend = await InterviewRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const sessionMap = sessionTrend.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const interviewMap = interviewTrend.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const activityTrends = dateBuckets.map(date => ({
      date,
      sessions: sessionMap[date] || 0,
      interviews: interviewMap[date] || 0
    }));

    // Reports breakdown
    const reportStats = await Report.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$resolved',
          count: { $sum: 1 }
        }
      }
    ]);

    const resolved = reportStats.find(r => r._id === true)?.count || 0;
    const unresolved = reportStats.find(r => r._id === false)?.count || 0;

    res.json({
      summary: {
        totalUsers,
        totalSessions,
        totalInterviews,
      },
      userGrowth: userGrowthData,
      activeVsInactive: {
        active: activeUsersCount,
        inactive: inactiveUsersCount
      },
      activityTrends,
      activeUserAnalytics: {
        dau,
        wau,
        mau,
        realtime: realtimeActive
      },
      reports: {
        resolved,
        unresolved
      }
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Users Tab
exports.getUsers = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const dateBuckets = generateDateBuckets(start, end);

    // Summary
    // All-time registered users; date filter only applies to newUsers/registrations
    const totalUsers = await User.countDocuments({});
    const newUsers = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastActivityAt: { $gte: thirtyDaysAgo } });

    // Retention rate calculation
    const usersFromPreviousPeriod = await User.countDocuments({
      createdAt: { $lt: start }
    });
    const activeFromPrevious = await User.countDocuments({
      createdAt: { $lt: start },
      lastLogin: { $gte: start, $lte: end }
    });
    const retentionRate = usersFromPreviousPeriod > 0 
      ? Math.round((activeFromPrevious / usersFromPreviousPeriod) * 100) 
      : 0;

    // New registrations over time
    const registrations = await User.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const registrationMap = registrations.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const registrationData = dateBuckets.map(date => ({
      date,
      count: registrationMap[date] || 0
    }));

    // Role distribution
    const roleDistribution = await User.aggregate([
      { $match: { createdAt: { $lte: end } } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Activity frequency
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [daily, weekly, monthly, inactive] = await Promise.all([
      User.countDocuments({ lastLogin: { $gte: oneDayAgo } }),
      User.countDocuments({ lastLogin: { $gte: oneWeekAgo, $lt: oneDayAgo } }),
      User.countDocuments({ lastLogin: { $gte: oneMonthAgo, $lt: oneWeekAgo } }),
      User.countDocuments({ $or: [
        { lastLogin: { $lt: oneMonthAgo } },
        { lastLogin: { $exists: false } }
      ]})
    ]);

    res.json({
      summary: {
        total: totalUsers,
        newUsers,
        activeUsers,
        retentionRate
      },
      registrations: registrationData,
      roleDistribution,
      activityFrequency: [
        { frequency: 'Daily', count: daily },
        { frequency: 'Weekly', count: weekly },
        { frequency: 'Monthly', count: monthly },
        { frequency: 'Inactive', count: inactive }
      ]
    });
  } catch (error) {
    console.error('Analytics users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Sessions Tab
exports.getSessions = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const dateBuckets = generateDateBuckets(start, end);

    // Summary
    const totalSessions = await Session.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const completedSessions = await Session.countDocuments({ 
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });

    // Calculate average duration for completed sessions
    const durationStats = await Session.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          status: 'completed',
          duration: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const avgDuration = durationStats[0]?.avgDuration 
      ? Math.round(durationStats[0].avgDuration) 
      : 0;

    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100)
      : 0;

    // Sessions over time
    const sessionsOverTime = await Session.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const sessionMap = sessionsOverTime.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const sessionsData = dateBuckets.map(date => ({
      date,
      count: sessionMap[date] || 0
    }));

    // Role breakdown - sessions as student vs tutor
    const roleBreakdown = await Session.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          asStudent: { $sum: { $cond: [{ $ne: ['$studentId', null] }, 1, 0] } },
          asTutor: { $sum: { $cond: [{ $ne: ['$tutorId', null] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const roleMap = roleBreakdown.reduce((acc, item) => {
      acc[item._id] = { asStudent: item.asStudent, asTutor: item.asTutor };
      return acc;
    }, {});

    const roleData = dateBuckets.map(date => ({
      date,
      asStudent: roleMap[date]?.asStudent || 0,
      asTutor: roleMap[date]?.asTutor || 0
    }));

    // Status breakdown
    const statusBreakdown = await Session.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Duration distribution
    const durationDistribution = await Session.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          duration: { $exists: true }
        }
      },
      {
        $bucket: {
          groupBy: '$duration',
          boundaries: [0, 15, 30, 45, 60, 90, 120, 999999],
          default: '120+',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const durationLabels = ['0-15 min', '15-30 min', '30-45 min', '45-60 min', '60-90 min', '90-120 min', '120+ min'];
    const durationData = durationLabels.map((label, index) => {
      const bucket = durationDistribution.find(d => d._id === [0, 15, 30, 45, 60, 90, 120, 999999][index]);
      return {
        range: label,
        count: bucket?.count || 0
      };
    });

    res.json({
      summary: {
        total: totalSessions,
        completed: completedSessions,
        avgDuration,
        completionRate
      },
      sessionsOverTime: sessionsData,
      roleBreakdown: roleData,
      statusBreakdown,
      durationDistribution: durationData
    });
  } catch (error) {
    console.error('Analytics sessions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Interviews Tab
exports.getInterviews = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const dateBuckets = generateDateBuckets(start, end);

    // Summary
    const totalInterviews = await InterviewRequest.countDocuments({ 
      createdAt: { $gte: start, $lte: end } 
    });
    const completedInterviews = await InterviewRequest.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });
    const scheduledInterviews = await InterviewRequest.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'scheduled'
    });

    // Calculate average rating
    const ratingStats = await InterviewRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          interviewerRating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$interviewerRating' }
        }
      }
    ]);

    const avgRating = ratingStats[0]?.avgRating 
      ? Math.round(ratingStats[0].avgRating * 10) / 10
      : 0;

    // Interviews over time
    const interviewsOverTime = await InterviewRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const interviewMap = interviewsOverTime.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const interviewsData = dateBuckets.map(date => ({
      date,
      count: interviewMap[date] || 0
    }));

    // Participation breakdown
    const participation = {
      asRequester: await InterviewRequest.countDocuments({
        createdAt: { $gte: start, $lte: end },
        requesterId: { $exists: true }
      }),
      asInterviewer: await InterviewRequest.countDocuments({
        createdAt: { $gte: start, $lte: end },
        interviewerId: { $exists: true, $ne: null }
      })
    };

    // Average ratings distribution
    const avgRatings = await InterviewRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          interviewerRating: { $exists: true, $ne: null }
        }
      },
      {
        $bucket: {
          groupBy: '$interviewerRating',
          boundaries: [0, 1, 2, 3, 4, 5, 6],
          default: 'other',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const ratingsData = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: avgRatings.find(r => r._id === rating)?.count || 0
    }));

    // Interviewer pipeline
    const [applied, approved, active, experienced] = await Promise.all([
      InterviewRequest.distinct('requesterId', { createdAt: { $gte: start, $lte: end } }).then(ids => ids.length),
      InterviewRequest.distinct('interviewerId', { 
        createdAt: { $gte: start, $lte: end },
        interviewerId: { $exists: true, $ne: null }
      }).then(ids => ids.length),
      InterviewRequest.distinct('interviewerId', {
        createdAt: { $gte: start, $lte: end },
        status: 'scheduled',
        interviewerId: { $exists: true, $ne: null }
      }).then(ids => ids.length),
      InterviewRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            interviewerId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: '$interviewerId',
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gte: 5 } }
        }
      ]).then(result => result.length)
    ]);

    res.json({
      summary: {
        total: totalInterviews,
        completed: completedInterviews,
        scheduled: scheduledInterviews,
        avgRating
      },
      interviewsOverTime: interviewsData,
      participation,
      avgRatings: ratingsData,
      pipeline: {
        applied,
        approved,
        active,
        experienced
      }
    });
  } catch (error) {
    console.error('Analytics interviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Skills Tab
exports.getSkills = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    // Get active users in the selected window and use their skillsToLearn
    let users = await User.find({
      lastActivityAt: { $gte: start, $lte: end }
    }).select('skillsToLearn');

    // Fallback: if no active users in range, use all users so the card is never empty
    if (!users.length) {
      users = await User.find({}).select('skillsToLearn');
    }

    // Count skill occurrences from users' skillsToLearn
    const skillCounts = {};

    users.forEach(user => {
      if (Array.isArray(user.skillsToLearn)) {
        user.skillsToLearn.forEach((skill) => {
          if (!skill || typeof skill !== 'string') return;
          const trimmed = skill.trim();
          if (!trimmed) return;
          skillCounts[trimmed] = (skillCounts[trimmed] || 0) + 1;
        });
      }
    });

    // Get most requested skills (top 15)
    const mostRequested = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }));

    // Get least used skills (bottom 10)
    const leastUsed = Object.entries(skillCounts)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Summary
    const totalSkills = Object.keys(skillCounts).length;
    const activeSkills = Object.values(skillCounts).filter(count => count > 0).length;
    const avgCompletionRate = 0; // Not computed without per-skill session data

    const mostPopular = mostRequested[0]?.skill || 'N/A';

    res.json({
      summary: {
        totalSkills,
        activeSkills,
        avgCompletionRate,
        mostPopular
      },
      mostRequested,
      leastUsed,
      completionRate: []
    });
  } catch (error) {
    console.error('Analytics skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Rewards Tab
exports.getRewards = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const dateBuckets = generateDateBuckets(start, end);

    // Get all users with their coins
    const users = await User.find().select('silverCoins goldCoins firstName lastName email');

    // Calculate totals
    const totalSilver = users.reduce((sum, user) => sum + (user.silverCoins || 0), 0);
    const totalGold = users.reduce((sum, user) => sum + (user.goldCoins || 0), 0);
    const activeEarners = users.filter(user => (user.silverCoins || 0) > 0 || (user.goldCoins || 0) > 0).length;
    const avgPerUser = users.length > 0 
      ? Math.round((totalSilver + totalGold * 10) / users.length)
      : 0;

    // Coins distribution
    const coinsDistribution = {
      silver: totalSilver,
      gold: totalGold
    };

    // Coins over time (using contribution events if available)
    let coinsOverTime = [];
    
    try {
      const ContributionEvent = require('../models/ContributionEvent');
      
      const coinEvents = await ContributionEvent.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            silver: { $sum: { $cond: [{ $eq: ['$coinType', 'silver'] }, '$amount', 0] } },
            gold: { $sum: { $cond: [{ $eq: ['$coinType', 'gold'] }, '$amount', 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const coinMap = coinEvents.reduce((acc, item) => {
        acc[item._id] = { silver: item.silver, gold: item.gold };
        return acc;
      }, {});

      coinsOverTime = dateBuckets.map(date => ({
        date,
        silver: coinMap[date]?.silver || 0,
        gold: coinMap[date]?.gold || 0
      }));
    } catch (err) {
      // If ContributionEvent model doesn't exist, create mock data
      coinsOverTime = dateBuckets.map(date => ({
        date,
        silver: 0,
        gold: 0
      }));
    }

    // Leaderboard (top 20 earners)
    const leaderboard = users
      .map(user => ({
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        silver: user.silverCoins || 0,
        gold: user.goldCoins || 0,
        total: (user.silverCoins || 0) + (user.goldCoins || 0) * 10
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);

    res.json({
      summary: {
        totalSilver,
        totalGold,
        activeEarners,
        avgPerUser
      },
      coinsDistribution,
      coinsOverTime,
      leaderboard
    });
  } catch (error) {
    console.error('Analytics rewards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reports Tab
exports.getReports = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const dateBuckets = generateDateBuckets(start, end);

    // Summary
    const totalReports = await Report.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const resolvedReports = await Report.countDocuments({ 
      createdAt: { $gte: start, $lte: end },
      resolved: true 
    });
    const unresolvedReports = totalReports - resolvedReports;
    const resolutionRate = totalReports > 0 
      ? Math.round((resolvedReports / totalReports) * 100)
      : 0;

    // Reports over time
    const reportsOverTime = await Report.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const reportMap = reportsOverTime.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const reportsData = dateBuckets.map(date => ({
      date,
      count: reportMap[date] || 0
    }));

    // Resolution status
    const resolutionStatus = {
      resolved: resolvedReports,
      unresolved: unresolvedReports,
      inProgress: 0 // Can be enhanced if you have an 'inProgress' status
    };

    // Users with frequent reports or low ratings
    const problematicUsers = await Report.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$reportedUserId',
          reportCount: { $sum: 1 }
        }
      },
      { $match: { reportCount: { $gte: 2 } } },
      { $sort: { reportCount: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    // Get session ratings for these users
    const problematicUsersWithRatings = await Promise.all(
      problematicUsers.map(async (item) => {
        const sessions = await Session.find({
          $or: [
            { tutorId: item._id },
            { studentId: item._id }
          ],
          rating: { $exists: true }
        }).select('rating');

        const avgRating = sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length
          : null;

        return {
          _id: item._id,
          name: `${item.user.firstName} ${item.user.lastName}`,
          email: item.user.email,
          reportCount: item.reportCount,
          avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null
        };
      })
    );

    res.json({
      summary: {
        total: totalReports,
        resolved: resolvedReports,
        unresolved: unresolvedReports,
        resolutionRate
      },
      reportsOverTime: reportsData,
      resolutionStatus,
      problematicUsers: problematicUsersWithRatings
    });
  } catch (error) {
    console.error('Analytics reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Anonymous Visitor Analytics (for Overview tab)
exports.getVisitorAnalytics = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const now = new Date();

    // Define "active" anonymous visitor thresholds
    const MIN_TIME_SPENT = 15; // seconds
    const MIN_PAGE_VIEWS = 2;

    // Date windows for DAU/WAU/MAU
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const rangeMatch = { lastSeenAt: { $gte: start, $lte: end } };

    // Active visitor criteria: time spent > threshold OR multiple page views OR repeated visits
    const activeVisitorMatch = {
      lastSeenAt: { $gte: start, $lte: end },
      $or: [
        { totalTimeSpent: { $gte: MIN_TIME_SPENT } },
        { $expr: { $gte: [{ $size: { $ifNull: ['$pageViews', []] } }, MIN_PAGE_VIEWS] } },
        { visitCount: { $gte: 2 } },
      ],
    };

    const [
      totalVisitors,
      activeVisitors,
      newVisitorsAgg,
      avgVisitsAgg,
      avgTimeSpentAgg,
      conversions,
      dauAnon,
      wauAnon,
      mauAnon,
    ] = await Promise.all([
      AnonymousVisitor.countDocuments(rangeMatch),
      AnonymousVisitor.countDocuments(activeVisitorMatch),
      AnonymousVisitor.aggregate([
        { $match: { firstSeenAt: { $gte: start, $lte: end } } },
        { $count: 'count' },
      ]),
      AnonymousVisitor.aggregate([
        { $match: rangeMatch },
        { $group: { _id: null, avgVisits: { $avg: '$visitCount' } } },
      ]),
      AnonymousVisitor.aggregate([
        { $match: rangeMatch },
        { $group: { _id: null, avgTime: { $avg: '$totalTimeSpent' } } },
      ]),
      AnonymousVisitor.countDocuments({ 
        isConverted: true,
        convertedAt: { $gte: start, $lte: end } 
      }),
      // DAU/WAU/MAU for anonymous visitors
      AnonymousVisitor.countDocuments({
        isConverted: false,
        lastSeenAt: { $gte: oneDayAgo },
        $or: [
          { totalTimeSpent: { $gte: MIN_TIME_SPENT } },
          { visitCount: { $gte: 2 } },
        ],
      }),
      AnonymousVisitor.countDocuments({
        isConverted: false,
        lastSeenAt: { $gte: sevenDaysAgo },
        $or: [
          { totalTimeSpent: { $gte: MIN_TIME_SPENT } },
          { visitCount: { $gte: 2 } },
        ],
      }),
      AnonymousVisitor.countDocuments({
        isConverted: false,
        lastSeenAt: { $gte: thirtyDaysAgo },
        $or: [
          { totalTimeSpent: { $gte: MIN_TIME_SPENT } },
          { visitCount: { $gte: 2 } },
        ],
      }),
    ]);

    const newVisitors = newVisitorsAgg[0]?.count || 0;
    const returningVisitors = Math.max(totalVisitors - newVisitors, 0);
    const avgVisitsPerVisitor = avgVisitsAgg[0]?.avgVisits || 0;
    const avgTimeSpentPerVisitor = avgTimeSpentAgg[0]?.avgTime || 0;

    // Top pages by all anonymous visitors
    const topLandingPages = await AnonymousVisitor.aggregate([
      { $match: rangeMatch },
      { $unwind: { path: '$pageViews', preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: '$pageViews.path',
          views: { $sum: 1 },
          avgTimeSpent: { $avg: '$pageViews.timeSpent' },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]).then((rows) =>
      rows.map((r) => ({
        path: r._id,
        views: r.views,
        avgTimeSpent: Math.round(r.avgTimeSpent || 0),
      }))
    );

    // Top pages before conversion (last page before user registered/logged in)
    const topPagesBeforeConversion = await AnonymousVisitor.aggregate([
      {
        $match: {
          isConverted: true,
          convertedAt: { $gte: start, $lte: end },
          pageViews: { $exists: true, $ne: [] },
        },
      },
      {
        $project: {
          lastPage: { $arrayElemAt: ['$pageViews.path', -1] },
        },
      },
      {
        $group: {
          _id: '$lastPage',
          conversions: { $sum: 1 },
        },
      },
      { $sort: { conversions: -1 } },
      { $limit: 5 },
    ]).then((rows) => rows.map((r) => ({ path: r._id, conversions: r.conversions })));

    // Traffic sources distribution
    const topReferrers = await AnonymousVisitor.aggregate([
      { $match: rangeMatch },
      {
        $group: {
          _id: { $ifNull: ['$source', 'direct'] },
          visitors: { $sum: 1 },
        },
      },
      { $sort: { visitors: -1 } },
      { $limit: 8 },
    ]).then((rows) => rows.map((r) => ({ source: r._id, visitors: r.visitors })));

    // Visit frequency distribution
    const visitFrequency = await AnonymousVisitor.aggregate([
      { $match: rangeMatch },
      {
        $bucket: {
          groupBy: '$visitCount',
          boundaries: [1, 2, 5, 10, 20, 999999],
          default: '20+',
          output: { count: { $sum: 1 } },
        },
      },
    ]).then((rows) => {
      const labels = ['1 visit', '2-4 visits', '5-9 visits', '10-19 visits', '20+ visits'];
      return labels.map((label, idx) => {
        const bucket = rows.find((r) => r._id === [1, 2, 5, 10, 20, 999999][idx]);
        return { label, count: bucket?.count || 0 };
      });
    });

    const conversionRate = totalVisitors > 0 ? Math.round((conversions / totalVisitors) * 100) : 0;
    const inactiveVisitors = totalVisitors - activeVisitors;

    res.json({
      summary: {
        totalVisitors,
        activeVisitors,
        inactiveVisitors,
        newVisitors,
        returningVisitors,
        avgVisitsPerVisitor: Math.round(avgVisitsPerVisitor * 10) / 10,
        avgTimeSpentPerVisitor: Math.round(avgTimeSpentPerVisitor),
        conversions,
        conversionRate,
      },
      activeAnonymous: {
        dau: dauAnon,
        wau: wauAnon,
        mau: mauAnon,
      },
      topLandingPages,
      topPagesBeforeConversion,
      topReferrers,
      visitFrequency,
    });
  } catch (error) {
    console.error('Analytics visitors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

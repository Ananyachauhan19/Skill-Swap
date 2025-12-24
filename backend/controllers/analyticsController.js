const User = require('../models/User');
const Session = require('../models/Session');
const InterviewRequest = require('../models/InterviewRequest');
const Report = require('../models/Report');
const Contribution = require('../models/Contribution');

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
    const dateBuckets = generateDateBuckets(start, end);

    // Summary stats
    const [totalUsers, totalSessions, totalInterviews, activeUsers] = await Promise.all([
      User.countDocuments({ createdAt: { $lte: end } }),
      Session.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      InterviewRequest.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({ isOnline: true })
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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsersCount = await User.countDocuments({ 
      lastLogin: { $gte: thirtyDaysAgo, $lte: end }
    });
    const inactiveUsersCount = totalUsers - activeUsersCount;

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
        activeUsers
      },
      userGrowth: userGrowthData,
      activeVsInactive: {
        active: activeUsersCount,
        inactive: inactiveUsersCount
      },
      activityTrends,
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
    const totalUsers = await User.countDocuments({ createdAt: { $lte: end } });
    const newUsers = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastLogin: { $gte: thirtyDaysAgo } });

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

    // Get all sessions to analyze skills
    const sessions = await Session.find({
      createdAt: { $gte: start, $lte: end }
    }).select('skillsToLearn status');

    // Count skill occurrences
    const skillCounts = {};
    const skillCompletions = {};

    sessions.forEach(session => {
      if (session.skillsToLearn && Array.isArray(session.skillsToLearn)) {
        session.skillsToLearn.forEach(skill => {
          skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          
          if (!skillCompletions[skill]) {
            skillCompletions[skill] = { completed: 0, incomplete: 0 };
          }
          
          if (session.status === 'completed') {
            skillCompletions[skill].completed++;
          } else {
            skillCompletions[skill].incomplete++;
          }
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

    // Completion rate by skill (top 10 most used skills)
    const completionRate = Object.entries(skillCompletions)
      .sort((a, b) => (b[1].completed + b[1].incomplete) - (a[1].completed + a[1].incomplete))
      .slice(0, 10)
      .map(([skill, data]) => ({
        skill,
        completed: data.completed,
        incomplete: data.incomplete
      }));

    // Summary
    const totalSkills = Object.keys(skillCounts).length;
    const activeSkills = Object.values(skillCounts).filter(count => count > 0).length;
    
    const totalCompletions = Object.values(skillCompletions).reduce((sum, data) => sum + data.completed, 0);
    const totalSessions = Object.values(skillCompletions).reduce((sum, data) => sum + data.completed + data.incomplete, 0);
    const avgCompletionRate = totalSessions > 0 
      ? Math.round((totalCompletions / totalSessions) * 100)
      : 0;

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
      completionRate
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

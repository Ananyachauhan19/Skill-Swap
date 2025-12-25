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
    const now = new Date();

    // Summary
    const totalUsers = await User.countDocuments({});
    const newUsers = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastActivityAt: { $gte: thirtyDaysAgo } });

    // Retention rate
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

    // 1. Role Engagement Matrix - actual behavior by role
    const SessionRequest = require('../models/SessionRequest');
    const ApprovedInterviewer = require('../models/ApprovedInterviewer');
    
    const roleEngagement = await Promise.all(
      ['learner', 'teacher', 'both'].map(async (role) => {
        const usersInRole = await User.find({ role }).select('_id');
        const userIds = usersInRole.map(u => u._id);

        const [sessionsAttended, sessionsConducted, interviewsRequested, interviewsConducted] = await Promise.all([
          SessionRequest.countDocuments({
            requester: { $in: userIds },
            status: 'completed',
            createdAt: { $gte: start, $lte: end }
          }),
          SessionRequest.countDocuments({
            tutor: { $in: userIds },
            status: 'completed',
            createdAt: { $gte: start, $lte: end }
          }),
          InterviewRequest.countDocuments({
            requester: { $in: userIds },
            createdAt: { $gte: start, $lte: end }
          }),
          InterviewRequest.countDocuments({
            assignedInterviewer: { $in: userIds },
            status: 'completed',
            createdAt: { $gte: start, $lte: end }
          })
        ]);

        return {
          role,
          userCount: userIds.length,
          sessionsAttended,
          sessionsConducted,
          interviewsRequested,
          interviewsConducted
        };
      })
    );

    // 2. User Conversion Funnel
    const [registered, profileCompleted, firstSessionBooked, repeatUsers, tutorApproved, interviewerApproved] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      User.countDocuments({
        createdAt: { $gte: start, $lte: end },
        skillsToLearn: { $exists: true, $ne: [] }
      }),
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $lookup: {
            from: 'sessionrequests',
            localField: '_id',
            foreignField: 'requester',
            as: 'sessions'
          }
        },
        { $match: { 'sessions.0': { $exists: true } } },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0),
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $lookup: {
            from: 'sessionrequests',
            localField: '_id',
            foreignField: 'requester',
            as: 'sessions'
          }
        },
        { $match: { $expr: { $gte: [{ $size: '$sessions' }, 2] } } },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0),
      User.countDocuments({
        createdAt: { $gte: start, $lte: end },
        isTutor: true
      }),
      ApprovedInterviewer.countDocuments({
        createdAt: { $gte: start, $lte: end }
      })
    ]);

    const conversionFunnel = [
      { stage: 'Registered', count: registered },
      { stage: 'Profile Completed', count: profileCompleted },
      { stage: 'First Session', count: firstSessionBooked },
      { stage: 'Repeat User', count: repeatUsers },
      { stage: 'Tutor Approved', count: tutorApproved },
      { stage: 'Interviewer Approved', count: interviewerApproved }
    ];

    // 3. Repeat vs One-Time Users
    const userSegmentation = await User.aggregate([
      {
        $lookup: {
          from: 'sessionrequests',
          localField: '_id',
          foreignField: 'requester',
          as: 'sessions'
        }
      },
      {
        $addFields: {
          sessionCount: { $size: '$sessions' }
        }
      },
      {
        $bucket: {
          groupBy: '$sessionCount',
          boundaries: [0, 1, 3, 999999],
          default: 'power',
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const oneTime = userSegmentation.find(s => s._id === 1)?.count || 0;
    const repeat = userSegmentation.find(s => s._id === 3)?.count || 0;
    const power = userSegmentation.find(s => s._id === 'power' || s._id >= 999999)?.count || 0;
    const noActivity = userSegmentation.find(s => s._id === 0)?.count || 0;

    // 4. Cross-Role Transitions
    const roleTransitions = await User.aggregate([
      {
        $match: {
          createdAt: { $lte: end },
          $or: [
            { role: 'both' },
            { isTutor: true },
            { _id: { $in: (await ApprovedInterviewer.find({}).select('user')).map(a => a.user) } }
          ]
        }
      },
      {
        $group: {
          _id: {
            isBoth: { $eq: ['$role', 'both'] },
            isTutor: '$isTutor',
            isInterviewer: { $cond: [{ $in: ['$_id', (await ApprovedInterviewer.find({}).select('user')).map(a => a.user)] }, true, false] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const studentToTutor = roleTransitions.find(r => r._id.isTutor && !r._id.isBoth)?.count || 0;
    const studentToBoth = roleTransitions.find(r => r._id.isBoth)?.count || 0;
    const tutorToInterviewer = await ApprovedInterviewer.countDocuments({
      user: { $in: (await User.find({ isTutor: true }).select('_id')).map(u => u._id) }
    });

    // 5. Time-Based Engagement Patterns
    const timePatterns = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $project: {
          hour: { $hour: { date: '$createdAt', timezone: 'UTC' } },
          dayOfWeek: { $dayOfWeek: { date: '$createdAt', timezone: 'UTC' } }
        }
      },
      {
        $group: {
          _id: { hour: '$hour', day: '$dayOfWeek' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 6. User Reliability & Quality Signals by role
    const reliabilityMetrics = await Promise.all(
      ['learner', 'teacher', 'both'].map(async (role) => {
        const usersInRole = await User.find({ role }).select('_id');
        const userIds = usersInRole.map(u => u._id);

        const [total, completed, cancelled, noShow] = await Promise.all([
          SessionRequest.countDocuments({
            $or: [{ requester: { $in: userIds } }, { tutor: { $in: userIds } }],
            createdAt: { $gte: start, $lte: end }
          }),
          SessionRequest.countDocuments({
            $or: [{ requester: { $in: userIds } }, { tutor: { $in: userIds } }],
            status: 'completed',
            createdAt: { $gte: start, $lte: end }
          }),
          SessionRequest.countDocuments({
            $or: [{ requester: { $in: userIds } }, { tutor: { $in: userIds } }],
            status: 'cancelled',
            createdAt: { $gte: start, $lte: end }
          }),
          SessionRequest.countDocuments({
            $or: [{ requester: { $in: userIds } }, { tutor: { $in: userIds } }],
            status: 'no-show',
            createdAt: { $gte: start, $lte: end }
          })
        ]);

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
        const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;

        return {
          role,
          completionRate,
          cancellationRate,
          noShowRate,
          total
        };
      })
    );

    // 7. New vs Established User Behavior
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newUserIds = (await User.find({ createdAt: { $gte: sevenDaysAgo } }).select('_id')).map(u => u._id);
    const establishedUserIds = (await User.find({ createdAt: { $lt: sevenDaysAgo } }).select('_id')).map(u => u._id);

    const [newUserSessions, establishedUserSessions, newUserCancellations, establishedUserCancellations] = await Promise.all([
      SessionRequest.countDocuments({
        requester: { $in: newUserIds },
        createdAt: { $gte: start, $lte: end }
      }),
      SessionRequest.countDocuments({
        requester: { $in: establishedUserIds },
        createdAt: { $gte: start, $lte: end }
      }),
      SessionRequest.countDocuments({
        requester: { $in: newUserIds },
        status: 'cancelled',
        createdAt: { $gte: start, $lte: end }
      }),
      SessionRequest.countDocuments({
        requester: { $in: establishedUserIds },
        status: 'cancelled',
        createdAt: { $gte: start, $lte: end }
      })
    ]);

    // 8. Churn Risk Indicators
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const [inactiveUsers, highCancellationUsers] = await Promise.all([
      User.countDocuments({
        lastActivityAt: { $lt: fourteenDaysAgo },
        createdAt: { $lt: fourteenDaysAgo }
      }),
      User.aggregate([
        {
          $lookup: {
            from: 'sessionrequests',
            localField: '_id',
            foreignField: 'requester',
            as: 'sessions'
          }
        },
        {
          $addFields: {
            cancelledCount: {
              $size: {
                $filter: {
                  input: '$sessions',
                  as: 'session',
                  cond: { $eq: ['$$session.status', 'cancelled'] }
                }
              }
            },
            totalCount: { $size: '$sessions' }
          }
        },
        {
          $match: {
            totalCount: { $gte: 3 },
            $expr: { $gte: [{ $divide: ['$cancelledCount', '$totalCount'] }, 0.5] }
          }
        },
        { $count: 'count' }
      ]).then(r => r[0]?.count || 0)
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
      ],
      roleEngagement,
      conversionFunnel,
      userSegmentation: {
        oneTime,
        repeat,
        power,
        noActivity
      },
      roleTransitions: {
        studentToTutor,
        studentToBoth,
        tutorToInterviewer
      },
      timePatterns,
      reliabilityMetrics,
      newVsEstablished: {
        newUsers: {
          sessions: newUserSessions,
          cancellations: newUserCancellations,
          cancellationRate: newUserSessions > 0 ? Math.round((newUserCancellations / newUserSessions) * 100) : 0
        },
        established: {
          sessions: establishedUserSessions,
          cancellations: establishedUserCancellations,
          cancellationRate: establishedUserSessions > 0 ? Math.round((establishedUserCancellations / establishedUserSessions) * 100) : 0
        }
      },
      churnRisk: {
        inactiveUsers,
        highCancellationUsers,
        totalAtRisk: inactiveUsers + highCancellationUsers
      }
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
    const SessionRequest = require('../models/SessionRequest');
    const now = new Date();

    // Summary
    const totalSessions = await SessionRequest.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const completedSessions = await SessionRequest.countDocuments({ 
      createdAt: { $gte: start, $lte: end },
      status: 'completed'
    });
    const cancelledSessions = await SessionRequest.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'cancelled'
    });

    // Calculate average duration for completed sessions
    const durationStats = await SessionRequest.aggregate([
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
    const cancellationRate = totalSessions > 0
      ? Math.round((cancelledSessions / totalSessions) * 100)
      : 0;

    // 1. Session Activity Trend - completed vs cancelled
    const sessionsOverTime = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const sessionMap = sessionsOverTime.reduce((acc, item) => {
      acc[item._id] = { total: item.total, completed: item.completed, cancelled: item.cancelled };
      return acc;
    }, {});

    const sessionsData = dateBuckets.map(date => ({
      date,
      total: sessionMap[date]?.total || 0,
      completed: sessionMap[date]?.completed || 0,
      cancelled: sessionMap[date]?.cancelled || 0
    }));

    // 2. Role Participation Insight - aggregated totals
    const roleParticipation = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          asStudent: { $sum: 1 },
          asTutor: { $sum: 1 }
        }
      }
    ]);

    // 3. Session Lifecycle Funnel
    const [booked, approved, started, completed, cancelled] = await Promise.all([
      SessionRequest.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      SessionRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, status: { $in: ['approved', 'active', 'completed'] } }),
      SessionRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, startedAt: { $exists: true, $ne: null } }),
      SessionRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'completed' }),
      SessionRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'cancelled' })
    ]);

    const lifecycleFunnel = [
      { stage: 'Booked', count: booked },
      { stage: 'Approved', count: approved },
      { stage: 'Started', count: started },
      { stage: 'Completed', count: completed },
      { stage: 'Cancelled', count: cancelled }
    ];

    // 4. Session Reliability Metrics with trends
    const prevPeriodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - prevPeriodLength);
    const prevEnd = start;

    const [prevTotal, prevCompleted, prevCancelled] = await Promise.all([
      SessionRequest.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
      SessionRequest.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd }, status: 'completed' }),
      SessionRequest.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd }, status: 'cancelled' })
    ]);

    const prevCompletionRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;
    const prevCancellationRate = prevTotal > 0 ? Math.round((prevCancelled / prevTotal) * 100) : 0;

    const completionTrend = completionRate - prevCompletionRate;
    const cancellationTrend = cancellationRate - prevCancellationRate;

    // 5. Session Duration Quality
    const durationQuality = await SessionRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          status: 'completed',
          duration: { $exists: true }
        }
      },
      {
        $bucket: {
          groupBy: '$duration',
          boundaries: [0, 15, 30, 45, 60, 90, 120, 999999],
          default: 'other',
          output: {
            count: { $sum: 1 },
            avgDuration: { $avg: '$duration' }
          }
        }
      }
    ]);

    const durationLabels = ['0-15 min', '15-30 min', '30-45 min', '45-60 min', '60-90 min', '90-120 min', '120+ min'];
    const durationData = durationLabels.map((label, index) => {
      const bucket = durationQuality.find(d => d._id === [0, 15, 30, 45, 60, 90, 120, 999999][index]);
      return {
        range: label,
        count: bucket?.count || 0,
        avgDuration: bucket?.avgDuration || 0
      };
    });

    const shortSessions = await SessionRequest.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'completed',
      duration: { $lt: 15 }
    });

    // 6. Repeat Session Behavior
    const userSessionCounts = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { requester: '$requester', tutor: '$tutor' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.requester',
          uniqueTutors: { $addToSet: '$_id.tutor' },
          totalSessions: { $sum: '$count' },
          repeatWithSame: { $sum: { $cond: [{ $gt: ['$count', 1] }, 1, 0] } }
        }
      }
    ]);

    let oneTime = 0, repeatSame = 0, repeatDifferent = 0;
    userSessionCounts.forEach(user => {
      if (user.totalSessions === 1) oneTime++;
      else if (user.repeatWithSame > 0) repeatSame++;
      else if (user.uniqueTutors.length > 1) repeatDifferent++;
    });

    // 7. Time-Based Session Patterns
    const timePatterns = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $project: {
          hour: { $hour: { date: '$createdAt', timezone: 'UTC' } },
          dayOfWeek: { $dayOfWeek: { date: '$createdAt', timezone: 'UTC' } }
        }
      },
      {
        $group: {
          _id: { hour: '$hour', day: '$dayOfWeek' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 8. Tutor Performance Signals (Aggregated)
    const tutorMetrics = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$tutor',
          totalSessions: { $sum: 1 },
          completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledSessions: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          avgDuration: { $avg: { $cond: [{ $eq: ['$status', 'completed'] }, '$duration', null] } }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionRate: { 
            $avg: { 
              $multiply: [
                { $divide: ['$completedSessions', '$totalSessions'] }, 
                100
              ] 
            } 
          },
          avgSessionDuration: { $avg: '$avgDuration' },
          avgCancellationRate: {
            $avg: {
              $multiply: [
                { $divide: ['$cancelledSessions', '$totalSessions'] },
                100
              ]
            }
          }
        }
      }
    ]);

    const aggregatedTutorPerformance = {
      avgCompletionRate: tutorMetrics[0]?.avgCompletionRate ? Math.round(tutorMetrics[0].avgCompletionRate) : 0,
      avgSessionDuration: tutorMetrics[0]?.avgSessionDuration ? Math.round(tutorMetrics[0].avgSessionDuration) : 0,
      avgCancellationRate: tutorMetrics[0]?.avgCancellationRate ? Math.round(tutorMetrics[0].avgCancellationRate) : 0
    };

    // 9. Session Risk & Alerts
    const tutorsWithHighCancellation = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$tutor',
          total: { $sum: 1 },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      {
        $match: {
          total: { $gte: 3 },
          $expr: { $gte: [{ $divide: ['$cancelled', '$total'] }, 0.4] }
        }
      },
      { $count: 'count' }
    ]);

    const studentsWithHighNoShow = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$requester',
          total: { $sum: 1 },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      {
        $match: {
          total: { $gte: 3 },
          $expr: { $gte: [{ $divide: ['$cancelled', '$total'] }, 0.4] }
        }
      },
      { $count: 'count' }
    ]);

    const sessionRiskAlerts = {
      tutorsWithHighCancellation: tutorsWithHighCancellation[0]?.count || 0,
      studentsWithHighNoShow: studentsWithHighNoShow[0]?.count || 0,
      totalAtRisk: (tutorsWithHighCancellation[0]?.count || 0) + (studentsWithHighNoShow[0]?.count || 0)
    };

    res.json({
      summary: {
        total: totalSessions,
        completed: completedSessions,
        avgDuration,
        completionRate,
        cancellationRate
      },
      sessionsOverTime: sessionsData,
      roleParticipation: roleParticipation[0] || { asStudent: 0, asTutor: 0 },
      lifecycleFunnel,
      reliabilityMetrics: {
        completionRate,
        cancellationRate,
        completionTrend,
        cancellationTrend
      },
      durationQuality: {
        distribution: durationData,
        shortSessions,
        avgDuration
      },
      repeatBehavior: {
        oneTime,
        repeatSame,
        repeatDifferent
      },
      timePatterns,
      tutorPerformance: aggregatedTutorPerformance,
      sessionRiskAlerts
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
    const InterviewerApplication = require('../models/InterviewerApplication');
    const ApprovedInterviewer = require('../models/ApprovedInterviewer');
    const now = new Date();

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
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const avgRating = ratingStats[0]?.avgRating 
      ? Math.round(ratingStats[0].avgRating * 10) / 10
      : 0;

    // 1. Interview Activity Trend - scheduled, completed, expired, rejected, cancelled
    const interviewsOverTime = await InterviewRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const interviewMap = interviewsOverTime.reduce((acc, item) => {
      acc[item._id] = { 
        total: item.total, 
        scheduled: item.scheduled, 
        completed: item.completed, 
        expired: item.expired,
        rejected: item.rejected,
        cancelled: item.cancelled
      };
      return acc;
    }, {});

    const interviewsData = dateBuckets.map(date => ({
      date,
      total: interviewMap[date]?.total || 0,
      scheduled: interviewMap[date]?.scheduled || 0,
      completed: interviewMap[date]?.completed || 0,
      expired: interviewMap[date]?.expired || 0,
      rejected: interviewMap[date]?.rejected || 0,
      cancelled: interviewMap[date]?.cancelled || 0
    }));

    // 2. Interview Participation Breakdown
    const participation = {
      asRequester: totalInterviews,
      asInterviewer: await InterviewRequest.countDocuments({
        createdAt: { $gte: start, $lte: end },
        assignedInterviewer: { $exists: true, $ne: null }
      })
    };

    // 3. Interview Lifecycle Funnel
    const [requested, assigned, scheduled, conducted, completed, expired, rejected, cancelled] = await Promise.all([
      InterviewRequest.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      InterviewRequest.countDocuments({ 
        createdAt: { $gte: start, $lte: end }, 
        assignedInterviewer: { $exists: true, $ne: null } 
      }),
      InterviewRequest.countDocuments({ 
        createdAt: { $gte: start, $lte: end }, 
        status: 'scheduled' 
      }),
      InterviewRequest.countDocuments({ 
        createdAt: { $gte: start, $lte: end }, 
        scheduledAt: { $exists: true, $ne: null } 
      }),
      InterviewRequest.countDocuments({ 
        createdAt: { $gte: start, $lte: end }, 
        status: 'completed' 
      }),
      InterviewRequest.countDocuments({ 
        createdAt: { $gte: start, $lte: end }, 
        status: 'expired'
      }),
      InterviewRequest.countDocuments({ 
        createdAt: { $gte: start, $lte: end }, 
        status: 'rejected'
      }),
      InterviewRequest.countDocuments({ 
        createdAt: { $gte: start, $lte: end }, 
        status: 'cancelled'
      })
    ]);

    const lifecycleFunnel = [
      { stage: 'Requested', count: requested },
      { stage: 'Assigned', count: assigned },
      { stage: 'Scheduled', count: scheduled },
      { stage: 'Conducted', count: conducted },
      { stage: 'Completed', count: completed },
      { stage: 'Expired (Auto)', count: expired },
      { stage: 'Rejected', count: rejected },
      { stage: 'Cancelled', count: cancelled }
    ];

    // 4. Interview Quality & Ratings
    const ratingDistribution = await InterviewRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $bucket: {
          groupBy: '$rating',
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
      count: ratingDistribution.find(r => r._id === rating)?.count || 0
    }));

    // Rating trend over time
    const ratingTrend = await InterviewRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const ratingTrendMap = ratingTrend.reduce((acc, item) => {
      acc[item._id] = Math.round(item.avgRating * 10) / 10;
      return acc;
    }, {});

    const ratingTrendData = dateBuckets.map(date => ({
      date,
      avgRating: ratingTrendMap[date] || 0
    }));

    // 5. Interviewer Reliability Signals
    const interviewerMetrics = await InterviewRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          assignedInterviewer: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$assignedInterviewer',
          totalInterviews: { $sum: 1 },
          completedInterviews: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          expiredInterviews: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } },
          rejectedInterviews: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          cancelledInterviews: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      },
      {
        $group: {
          _id: null,
          avgCompletionRate: { 
            $avg: { 
              $multiply: [
                { $divide: ['$completedInterviews', '$totalInterviews'] }, 
                100
              ] 
            } 
          },
          avgExpiryRate: {
            $avg: {
              $multiply: [
                { $divide: ['$expiredInterviews', '$totalInterviews'] },
                100
              ]
            }
          },
          avgRejectionRate: {
            $avg: {
              $multiply: [
                { $divide: ['$rejectedInterviews', '$totalInterviews'] },
                100
              ]
            }
          },
          avgCancellationRate: {
            $avg: {
              $multiply: [
                { $divide: ['$cancelledInterviews', '$totalInterviews'] },
                100
              ]
            }
          }
        }
      }
    ]);

    const reliabilitySignals = {
      avgCompletionRate: interviewerMetrics[0]?.avgCompletionRate ? Math.round(interviewerMetrics[0].avgCompletionRate) : 0,
      avgExpiryRate: interviewerMetrics[0]?.avgExpiryRate ? Math.round(interviewerMetrics[0].avgExpiryRate) : 0,
      avgRejectionRate: interviewerMetrics[0]?.avgRejectionRate ? Math.round(interviewerMetrics[0].avgRejectionRate) : 0,
      avgCancellationRate: interviewerMetrics[0]?.avgCancellationRate ? Math.round(interviewerMetrics[0].avgCancellationRate) : 0
    };

    // 6. Interview Duration & Depth (using scheduledAt and completedAt if available)
    // Since there's no explicit duration field, we'll estimate based on scheduled slots
    const durationAnalysis = await InterviewRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: 'completed',
          interviewerSuggestedSlots: { $exists: true, $ne: [] }
        }
      },
      {
        $addFields: {
          estimatedDuration: {
            $divide: [
              { 
                $subtract: [
                  { $arrayElemAt: ['$interviewerSuggestedSlots.end', 0] },
                  { $arrayElemAt: ['$interviewerSuggestedSlots.start', 0] }
                ]
              },
              60000
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$estimatedDuration',
          boundaries: [0, 15, 30, 45, 60, 90, 120, 999999],
          default: 'unknown',
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    const durationLabels = ['0-15 min', '15-30 min', '30-45 min', '45-60 min', '60-90 min', '90-120 min', '120+ min'];
    const durationData = durationLabels.map((label, index) => {
      const bucket = durationAnalysis.find(d => d._id === [0, 15, 30, 45, 60, 90, 120, 999999][index]);
      return {
        range: label,
        count: bucket?.count || 0
      };
    });

    // 7. Interviewer Approval Pipeline Health
    const [pendingApplications, approvedApplications, activeInterviewers, experiencedInterviewers] = await Promise.all([
      InterviewerApplication.countDocuments({ status: 'pending' }),
      InterviewerApplication.countDocuments({ status: 'approved' }),
      ApprovedInterviewer.countDocuments({ isActive: true }),
      InterviewRequest.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            assignedInterviewer: { $exists: true, $ne: null },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: '$assignedInterviewer',
            count: { $sum: 1 }
          }
        },
        {
          $match: { count: { $gte: 5 } }
        }
      ]).then(result => result.length)
    ]);

    const approvalPipeline = [
      { stage: 'Applied', count: pendingApplications },
      { stage: 'Under Review', count: pendingApplications },
      { stage: 'Approved', count: approvedApplications },
      { stage: 'Active', count: activeInterviewers },
      { stage: 'Experienced (5+)', count: experiencedInterviewers }
    ];

    // 8. Repeat Interview Behavior
    const requesterBehavior = await InterviewRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$requester',
          count: { $sum: 1 }
        }
      }
    ]);

    let oneTimeRequesters = 0, repeatRequesters = 0;
    requesterBehavior.forEach(req => {
      if (req.count === 1) oneTimeRequesters++;
      else repeatRequesters++;
    });

    const interviewerBehavior = await InterviewRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          assignedInterviewer: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$assignedInterviewer',
          count: { $sum: 1 }
        }
      }
    ]);

    let oneTimeInterviewers = 0, repeatInterviewers = 0;
    interviewerBehavior.forEach(int => {
      if (int.count === 1) oneTimeInterviewers++;
      else repeatInterviewers++;
    });

    // 9. Time-Based Interview Patterns
    const timePatterns = await InterviewRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $project: {
          hour: { $hour: { date: '$createdAt', timezone: 'UTC' } },
          dayOfWeek: { $dayOfWeek: { date: '$createdAt', timezone: 'UTC' } }
        }
      },
      {
        $group: {
          _id: { hour: '$hour', day: '$dayOfWeek' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 10. Interview Risk & Alerts
    const interviewersWithHighExpiry = await InterviewRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          assignedInterviewer: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$assignedInterviewer',
          total: { $sum: 1 },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
        }
      },
      {
        $match: {
          total: { $gte: 3 },
          $expr: { $gte: [{ $divide: ['$expired', '$total'] }, 0.3] }
        }
      },
      { $count: 'count' }
    ]);

    const interviewersWithHighRejection = await InterviewRequest.aggregate([
      { 
        $match: { 
          createdAt: { $gte: start, $lte: end },
          assignedInterviewer: { $exists: true, $ne: null }
        } 
      },
      {
        $group: {
          _id: '$assignedInterviewer',
          total: { $sum: 1 },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      },
      {
        $match: {
          total: { $gte: 3 },
          $expr: { $gte: [{ $divide: ['$rejected', '$total'] }, 0.3] }
        }
      },
      { $count: 'count' }
    ]);

    const requestersWithHighExpiry = await InterviewRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$requester',
          total: { $sum: 1 },
          expired: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
        }
      },
      {
        $match: {
          total: { $gte: 3 },
          $expr: { $gte: [{ $divide: ['$expired', '$total'] }, 0.3] }
        }
      },
      { $count: 'count' }
    ]);

    const requestersWithHighRejection = await InterviewRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$requester',
          total: { $sum: 1 },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      },
      {
        $match: {
          total: { $gte: 3 },
          $expr: { $gte: [{ $divide: ['$rejected', '$total'] }, 0.3] }
        }
      },
      { $count: 'count' }
    ]);

    const interviewRiskAlerts = {
      interviewersWithHighExpiry: interviewersWithHighExpiry[0]?.count || 0,
      interviewersWithHighRejection: interviewersWithHighRejection[0]?.count || 0,
      requestersWithHighExpiry: requestersWithHighExpiry[0]?.count || 0,
      requestersWithHighRejection: requestersWithHighRejection[0]?.count || 0,
      totalAtRisk: (interviewersWithHighExpiry[0]?.count || 0) + (interviewersWithHighRejection[0]?.count || 0) + (requestersWithHighExpiry[0]?.count || 0) + (requestersWithHighRejection[0]?.count || 0)
    };

    res.json({
      summary: {
        total: totalInterviews,
        completed: completedInterviews,
        scheduled: scheduledInterviews,
        avgRating
      },
      interviewsOverTime: interviewsData,
      participation,
      lifecycleFunnel,
      ratingDistribution: ratingsData,
      ratingTrend: ratingTrendData,
      reliabilitySignals,
      durationAnalysis: durationData,
      approvalPipeline,
      repeatBehavior: {
        requesters: {
          oneTime: oneTimeRequesters,
          repeat: repeatRequesters
        },
        interviewers: {
          oneTime: oneTimeInterviewers,
          repeat: repeatInterviewers
        }
      },
      timePatterns,
      interviewRiskAlerts
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

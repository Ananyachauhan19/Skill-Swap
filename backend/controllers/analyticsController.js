const User = require('../models/User');
const Session = require('../models/Session');
const InterviewRequest = require('../models/InterviewRequest');
const Report = require('../models/Report');
const Contribution = require('../models/Contribution');
const AnonymousVisitor = require('../models/AnonymousVisitor');
const Visitor = require('../models/Visitor');

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

    // Role distribution (treat 'both' as part of tutor/teacher)
    const roleDistributionRaw = await User.aggregate([
      { $match: { createdAt: { $lte: end } } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const roleCounts = roleDistributionRaw.reduce((acc, item) => {
      const role = item._id || 'unknown';
      acc[role] = (acc[role] || 0) + (item.count || 0);
      return acc;
    }, {});

    const roleDistribution = [];
    const combinedTutorCount = (roleCounts.teacher || 0) + (roleCounts.both || 0);

    Object.entries(roleCounts).forEach(([role, count]) => {
      if (role === 'both') return; // hide explicit 'both' bucket
      if (role === 'teacher') {
        roleDistribution.push({ _id: 'teacher', count: combinedTutorCount });
      } else {
        roleDistribution.push({ _id: role, count });
      }
    });

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

    // Group roles so that tutor metrics include users with role 'both'.
    const roleGroups = [
      { role: 'learner', roles: ['learner'] },
      { role: 'teacher', roles: ['teacher', 'both'] },
    ];

    const roleEngagement = await Promise.all(
      roleGroups.map(async (group) => {
        const usersInRole = await User.find({ role: { $in: group.roles } }).select('_id');
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
          role: group.role,
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
    const combinedStudentToTutor = studentToTutor + studentToBoth;
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
      roleGroups.map(async (group) => {
        const usersInRole = await User.find({ role: { $in: group.roles } }).select('_id');
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
          role: group.role,
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
        // Treat tutor as tutor+both in analytics views
        studentToTutor: combinedStudentToTutor,
        studentToBoth: 0,
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
    // Treat tutor rejections as the primary negative outcome
    const cancelledSessions = await SessionRequest.countDocuments({
      createdAt: { $gte: start, $lte: end },
      status: 'rejected'
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

    // 1. Session Activity Trend - completed vs rejected
    const sessionsOverTime = await SessionRequest.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const sessionMap = sessionsOverTime.reduce((acc, item) => {
      acc[item._id] = { total: item.total, completed: item.completed, rejected: item.rejected };
      return acc;
    }, {});

    const sessionsData = dateBuckets.map(date => ({
      date,
      total: sessionMap[date]?.total || 0,
      completed: sessionMap[date]?.completed || 0,
      rejected: sessionMap[date]?.rejected || 0
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
      SessionRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'rejected' })
    ]);

    const lifecycleFunnel = [
      { stage: 'Booked', count: booked },
      { stage: 'Approved', count: approved },
      { stage: 'Started', count: started },
      { stage: 'Completed', count: completed },
      { stage: 'Rejected', count: cancelled }
    ];

    // 4. Session Reliability Metrics with trends
    const prevPeriodLength = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - prevPeriodLength);
    const prevEnd = start;

    const [prevTotal, prevCompleted, prevCancelled] = await Promise.all([
      SessionRequest.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd } }),
      SessionRequest.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd }, status: 'completed' }),
      SessionRequest.countDocuments({ createdAt: { $gte: prevStart, $lt: prevEnd }, status: 'rejected' })
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
          cancelledSessions: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
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
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
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

exports.getSkills = async (req, res) => {
  try {
    const { start, end } = getDateRange(req);
    const SessionRequest = require('../models/SessionRequest');
    const TutorApplication = require('../models/TutorApplication');
    const ApprovedInterviewer = require('../models/ApprovedInterviewer');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ===== SECTION 1: TUTOR SKILLS ANALYTICS =====
    
    // 1. Get all APPROVED tutor applications with skills
    const approvedTutorApps = await TutorApplication.find({ 
      status: 'approved' 
    }).populate('user', 'firstName lastName skillsToTeach').select('skills user');
    
    // Build tutor skill supply from APPROVED tutor applications
    const tutorSkillSupply = {};
    const tutorIdsBySkill = {}; // Track unique tutor IDs per skill
    
    approvedTutorApps.forEach(app => {
      if (!app.user) return; // Skip if user doesn't exist
      
      const tutorId = app.user._id.toString();
      const tutorName = `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim();
      
      // Extract skills from TutorApplication.skills array (subject and topic fields)
      if (Array.isArray(app.skills)) {
        app.skills.forEach(skillObj => {
          // Use both subject and topic as skills
          const skillFields = [skillObj.subject, skillObj.topic].filter(Boolean);
          
          skillFields.forEach(skill => {
            if (skill && typeof skill === 'string') {
              const normalized = skill.trim().toLowerCase();
              if (normalized) {
                if (!tutorSkillSupply[normalized]) {
                  tutorSkillSupply[normalized] = { 
                    skill: skill.trim(), 
                    tutorCount: 0, 
                    tutorIds: new Set(),
                    tutors: []
                  };
                }
                
                // Only count each tutor once per skill
                if (!tutorSkillSupply[normalized].tutorIds.has(tutorId)) {
                  tutorSkillSupply[normalized].tutorIds.add(tutorId);
                  tutorSkillSupply[normalized].tutorCount++;
                  tutorSkillSupply[normalized].tutors.push(tutorName);
                }
              }
            }
          });
        });
      }
      
      // ALSO check user.skillsToTeach (backup/additional skills)
      if (app.user.skillsToTeach && Array.isArray(app.user.skillsToTeach)) {
        app.user.skillsToTeach.forEach(skill => {
          if (skill && typeof skill === 'string') {
            const normalized = skill.trim().toLowerCase();
            if (normalized) {
              if (!tutorSkillSupply[normalized]) {
                tutorSkillSupply[normalized] = { 
                  skill: skill.trim(), 
                  tutorCount: 0, 
                  tutorIds: new Set(),
                  tutors: []
                };
              }
              
              if (!tutorSkillSupply[normalized].tutorIds.has(tutorId)) {
                tutorSkillSupply[normalized].tutorIds.add(tutorId);
                tutorSkillSupply[normalized].tutorCount++;
                tutorSkillSupply[normalized].tutors.push(tutorName);
              }
            }
          }
        });
      }
    });

    // 2. Get one-on-one session requests (tutor demand)
    const tutorSessions = await SessionRequest.find({ 
      sessionType: 'one-on-one',
      createdAt: { $gte: start, $lte: end }
    }).select('subject status createdAt');

    const tutorSkillDemand = {};
    tutorSessions.forEach(session => {
      if (session.subject && typeof session.subject === 'string') {
        const normalized = session.subject.trim().toLowerCase();
        if (normalized) {
          if (!tutorSkillDemand[normalized]) {
            tutorSkillDemand[normalized] = {
              skill: session.subject.trim(),
              requestCount: 0,
              completed: 0,
              cancelled: 0,
              pending: 0,
              rejected: 0
            };
          }
          tutorSkillDemand[normalized].requestCount++;
          
          if (session.status === 'completed') tutorSkillDemand[normalized].completed++;
          else if (session.status === 'cancelled') tutorSkillDemand[normalized].cancelled++;
          else if (session.status === 'pending') tutorSkillDemand[normalized].pending++;
          else if (session.status === 'rejected') tutorSkillDemand[normalized].rejected++;
        }
      }
    });

    // 3. Combine tutor supply and demand
    const allTutorSkills = new Set([
      ...Object.keys(tutorSkillSupply),
      ...Object.keys(tutorSkillDemand)
    ]);

    const tutorSupply = [];
    const tutorDemand = [];
    const tutorGapUndersupplied = [];
    const tutorGapOversupplied = [];
    let tutorGapBalanced = 0;
    const tutorQuality = [];
    const tutorActivityStatus = [];

    allTutorSkills.forEach(normalizedSkill => {
      const supply = tutorSkillSupply[normalizedSkill];
      const demand = tutorSkillDemand[normalizedSkill];
      
      const tutorCount = supply?.tutorCount || 0;
      const requestCount = demand?.requestCount || 0;
      const displaySkill = supply?.skill || demand?.skill || normalizedSkill;

      // Supply data
      tutorSupply.push({
        skill: displaySkill,
        tutorCount,
        demand: requestCount,
        tutorNames: supply?.tutors || [] // Debug info
      });

      // Demand data
      if (requestCount > 0) {
        tutorDemand.push({
          skill: displaySkill,
          requestCount,
          tutorCount
        });
      }

      // Gap analysis
      const gapRatio = tutorCount > 0 ? requestCount / tutorCount : (requestCount > 0 ? 999 : 0);
      let gapFlag = 'balanced';
      
      if (tutorCount === 0 && requestCount > 0) {
        gapFlag = 'no-supply';
        tutorGapUndersupplied.push({
          skill: displaySkill,
          supply: tutorCount,
          demand: requestCount,
          gapRatio,
          flag: gapFlag
        });
      } else if (gapRatio > 5) {
        gapFlag = 'undersupplied';
        tutorGapUndersupplied.push({
          skill: displaySkill,
          supply: tutorCount,
          demand: requestCount,
          gapRatio,
          flag: gapFlag
        });
      } else if (gapRatio < 0.5 && tutorCount > 0) {
        gapFlag = 'oversupplied';
        tutorGapOversupplied.push({
          skill: displaySkill,
          supply: tutorCount,
          demand: requestCount,
          gapRatio,
          flag: gapFlag
        });
      } else {
        tutorGapBalanced++;
      }

      // Quality metrics
      if (demand) {
        const total = demand.requestCount;
        tutorQuality.push({
          skill: displaySkill,
          completed: demand.completed,
          cancelled: demand.cancelled,
          pending: demand.pending,
          rejected: demand.rejected,
          completionRate: total > 0 ? Math.round((demand.completed / total) * 100) : 0,
          cancellationRate: total > 0 ? Math.round((demand.cancelled / total) * 100) : 0
        });
      }

      // Activity status
      const lastSession = tutorSessions
        .filter(s => s.subject && s.subject.trim().toLowerCase() === normalizedSkill)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      
      const lastUsed = lastSession ? lastSession.createdAt.toISOString().split('T')[0] : 'Never';
      const isActive = lastSession && lastSession.createdAt >= thirtyDaysAgo;

      tutorActivityStatus.push({
        skill: displaySkill,
        tutorCount,
        lastUsed,
        status: isActive ? 'active' : 'dormant'
      });
    });

    // Sort arrays
    tutorSupply.sort((a, b) => b.tutorCount - a.tutorCount);
    tutorDemand.sort((a, b) => b.requestCount - a.requestCount);
    tutorGapUndersupplied.sort((a, b) => b.gapRatio - a.gapRatio);
    tutorGapOversupplied.sort((a, b) => a.gapRatio - b.gapRatio);
    tutorQuality.sort((a, b) => b.completed - a.completed);
    tutorActivityStatus.sort((a, b) => b.tutorCount - a.tutorCount);

    // ===== SECTION 2: INTERVIEW SKILLS ANALYTICS =====
    
    // 1. Get all approved interviewers
    const approvedInterviewers = await ApprovedInterviewer.find()
      .populate('user', 'skillsToTeach firstName lastName')
      .select('profile user');
    
    // Build interviewer skill supply from APPROVED interviewers
    const interviewerSkillSupply = {};
    
    approvedInterviewers.forEach(interviewer => {
      if (!interviewer.user) return;
      
      const interviewerId = interviewer._id.toString();
      const interviewerName = interviewer.profile?.name || 
        `${interviewer.user.firstName || ''} ${interviewer.user.lastName || ''}`.trim();
      
      // From profile.position (primary skill)
      if (interviewer.profile && interviewer.profile.position && typeof interviewer.profile.position === 'string') {
        const normalized = interviewer.profile.position.trim().toLowerCase();
        if (normalized) {
          if (!interviewerSkillSupply[normalized]) {
            interviewerSkillSupply[normalized] = {
              skill: interviewer.profile.position.trim(),
              interviewerCount: 0,
              interviewerIds: new Set(),
              interviewers: []
            };
          }
          
          if (!interviewerSkillSupply[normalized].interviewerIds.has(interviewerId)) {
            interviewerSkillSupply[normalized].interviewerIds.add(interviewerId);
            interviewerSkillSupply[normalized].interviewerCount++;
            interviewerSkillSupply[normalized].interviewers.push(interviewerName);
          }
        }
      }
      
      // From user.skillsToTeach (additional skills)
      if (interviewer.user.skillsToTeach && Array.isArray(interviewer.user.skillsToTeach)) {
        interviewer.user.skillsToTeach.forEach(skill => {
          if (skill && typeof skill === 'string') {
            const normalized = skill.trim().toLowerCase();
            if (normalized) {
              if (!interviewerSkillSupply[normalized]) {
                interviewerSkillSupply[normalized] = {
                  skill: skill.trim(),
                  interviewerCount: 0,
                  interviewerIds: new Set(),
                  interviewers: []
                };
              }
              
              if (!interviewerSkillSupply[normalized].interviewerIds.has(interviewerId)) {
                interviewerSkillSupply[normalized].interviewerIds.add(interviewerId);
                interviewerSkillSupply[normalized].interviewerCount++;
                interviewerSkillSupply[normalized].interviewers.push(interviewerName);
              }
            }
          }
        });
      }
    });

    // 2. Get interview requests (interview demand)
    const interviewRequests = await InterviewRequest.find({
      createdAt: { $gte: start, $lte: end }
    }).select('position status createdAt rating');

    const interviewSkillDemand = {};
    interviewRequests.forEach(interview => {
      if (interview.position && typeof interview.position === 'string') {
        const normalized = interview.position.trim().toLowerCase();
        if (normalized) {
          if (!interviewSkillDemand[normalized]) {
            interviewSkillDemand[normalized] = {
              skill: interview.position.trim(),
              requestCount: 0,
              completed: 0,
              expired: 0,
              pending: 0,
              ratings: []
            };
          }
          interviewSkillDemand[normalized].requestCount++;
          
          if (interview.status === 'completed') {
            interviewSkillDemand[normalized].completed++;
            if (interview.rating) interviewSkillDemand[normalized].ratings.push(interview.rating);
          } else if (interview.status === 'expired') {
            interviewSkillDemand[normalized].expired++;
          } else if (interview.status === 'pending') {
            interviewSkillDemand[normalized].pending++;
          }
        }
      }
    });

    // 3. Combine interview supply and demand
    const allInterviewSkills = new Set([
      ...Object.keys(interviewerSkillSupply),
      ...Object.keys(interviewSkillDemand)
    ]);

    const interviewSupply = [];
    const interviewDemand = [];
    const interviewGapUndersupplied = [];
    let interviewGapBalanced = 0;
    const interviewQuality = [];

    allInterviewSkills.forEach(normalizedSkill => {
      const supply = interviewerSkillSupply[normalizedSkill];
      const demand = interviewSkillDemand[normalizedSkill];
      
      const interviewerCount = supply?.interviewerCount || 0;
      const requestCount = demand?.requestCount || 0;
      const displaySkill = supply?.skill || demand?.skill || normalizedSkill;

      // Supply data
      interviewSupply.push({
        skill: displaySkill,
        interviewerCount,
        demand: requestCount,
        interviewerNames: supply?.interviewers || [] // Debug info
      });

      // Demand data
      if (requestCount > 0) {
        interviewDemand.push({
          skill: displaySkill,
          requestCount,
          interviewerCount
        });
      }

      // Gap analysis (interviews use different threshold)
      const gapRatio = interviewerCount > 0 ? requestCount / interviewerCount : (requestCount > 0 ? 999 : 0);
      let gapFlag = 'balanced';
      
      if (interviewerCount === 0 && requestCount > 0) {
        gapFlag = 'no-supply';
        interviewGapUndersupplied.push({
          skill: displaySkill,
          supply: interviewerCount,
          demand: requestCount,
          gapRatio,
          flag: gapFlag
        });
      } else if (gapRatio > 3) {
        gapFlag = 'undersupplied';
        interviewGapUndersupplied.push({
          skill: displaySkill,
          supply: interviewerCount,
          demand: requestCount,
          gapRatio,
          flag: gapFlag
        });
      } else {
        interviewGapBalanced++;
      }

      // Quality metrics with ratings
      if (demand) {
        const total = demand.requestCount;
        const avgRating = demand.ratings.length > 0
          ? (demand.ratings.reduce((sum, r) => sum + r, 0) / demand.ratings.length).toFixed(1)
          : 0;
        
        interviewQuality.push({
          skill: displaySkill,
          completed: demand.completed,
          expired: demand.expired,
          pending: demand.pending,
          completionRate: total > 0 ? Math.round((demand.completed / total) * 100) : 0,
          avgRating: parseFloat(avgRating)
        });
      }
    });

    // Sort arrays
    interviewSupply.sort((a, b) => b.interviewerCount - a.interviewerCount);
    interviewDemand.sort((a, b) => b.requestCount - a.requestCount);
    interviewGapUndersupplied.sort((a, b) => b.gapRatio - a.gapRatio);
    interviewQuality.sort((a, b) => b.completed - a.completed);

    // ===== SECTION 3: CROSS-SKILL INTELLIGENCE =====
    
    const strongInTutoringOnly = [];
    const strongInInterviewsOnly = [];

    allTutorSkills.forEach(skill => {
      const tutorCount = tutorSkillSupply[skill]?.tutorCount || 0;
      const tutorDemandCount = tutorSkillDemand[skill]?.requestCount || 0;
      const interviewerCount = interviewerSkillSupply[skill]?.interviewerCount || 0;
      const interviewDemandCount = interviewSkillDemand[skill]?.requestCount || 0;

      if (tutorCount > 0 && tutorDemandCount > 0 && interviewerCount === 0) {
        strongInTutoringOnly.push({
          skill: tutorSkillSupply[skill].skill,
          tutorSupply: tutorCount,
          tutorDemand: tutorDemandCount,
          interviewerSupply: 0,
          interviewDemand: 0
        });
      }
    });

    allInterviewSkills.forEach(skill => {
      const tutorCount = tutorSkillSupply[skill]?.tutorCount || 0;
      const tutorDemandCount = tutorSkillDemand[skill]?.requestCount || 0;
      const interviewerCount = interviewerSkillSupply[skill]?.interviewerCount || 0;
      const interviewDemandCount = interviewSkillDemand[skill]?.requestCount || 0;

      if (interviewerCount > 0 && interviewDemandCount > 0 && tutorCount === 0) {
        strongInInterviewsOnly.push({
          skill: interviewerSkillSupply[skill].skill,
          tutorSupply: 0,
          tutorDemand: 0,
          interviewerSupply: interviewerCount,
          interviewDemand: interviewDemandCount
        });
      }
    });

    // ===== SECTION 4: AUTO-GENERATED INSIGHTS =====
    
    const insights = [];

    // Tutor undersupply insights
    tutorGapUndersupplied.slice(0, 3).forEach(skill => {
      insights.push({
        type: 'warning',
        category: 'tutor',
        message: `High tutoring demand for "${skill.skill}" with ${skill.demand} requests but only ${skill.supply} approved tutors`,
        action: 'Recruit and approve more tutors for this skill'
      });
    });

    // Tutor quality insights
    tutorQuality.filter(s => s.cancellationRate > 30 && s.completed + s.cancelled > 5)
      .slice(0, 2)
      .forEach(skill => {
        insights.push({
          type: 'warning',
          category: 'tutor',
          message: `High cancellation rate (${skill.cancellationRate}%) for tutoring skill "${skill.skill}"`,
          action: 'Investigate tutor-learner matching quality'
        });
      });

    // Interview undersupply insights
    interviewGapUndersupplied.slice(0, 3).forEach(skill => {
      insights.push({
        type: 'warning',
        category: 'interview',
        message: `High interview demand for "${skill.skill}" with ${skill.demand} requests but only ${skill.supply} approved interviewers`,
        action: 'Recruit and approve more interviewers for this role'
      });
    });

    // Interview quality insights
    interviewQuality.filter(s => s.completionRate < 50 && s.completed + s.expired > 5)
      .slice(0, 2)
      .forEach(skill => {
        insights.push({
          type: 'warning',
          category: 'interview',
          message: `Low completion rate (${skill.completionRate}%) for interview skill "${skill.skill}"`,
          action: 'Review interview scheduling and interviewer availability'
        });
      });

    // Cross-skill opportunities
    if (strongInTutoringOnly.length > 0) {
      insights.push({
        type: 'info',
        category: 'tutor',
        message: `${strongInTutoringOnly.length} skills have strong tutoring presence but no interview coverage`,
        action: 'Consider recruiting interviewers from existing tutors'
      });
    }

    if (strongInInterviewsOnly.length > 0) {
      insights.push({
        type: 'info',
        category: 'interview',
        message: `${strongInInterviewsOnly.length} skills have strong interview presence but no tutoring coverage`,
        action: 'Consider recruiting tutors from existing interviewers'
      });
    }

    // Activity status insights
    const dormantCount = tutorActivityStatus.filter(s => s.status === 'dormant').length;
    if (dormantCount > 0) {
      insights.push({
        type: 'info',
        category: 'tutor',
        message: `${dormantCount} tutoring skills have been dormant for 30+ days`,
        action: 'Review skill relevance and update tutor profiles'
      });
    }

    res.json({
      summary: {
        totalTutorSkills: allTutorSkills.size,
        totalInterviewSkills: allInterviewSkills.size,
        activeTutorSkills: tutorActivityStatus.filter(s => s.status === 'active').length,
        totalTutors: approvedTutorApps.length,
        totalInterviewers: approvedInterviewers.length
      },
      tutorAnalytics: {
        supply: tutorSupply.slice(0, 20),
        demand: tutorDemand.slice(0, 15),
        gap: {
          undersupplied: tutorGapUndersupplied.slice(0, 10),
          oversupplied: tutorGapOversupplied.slice(0, 10),
          balanced: tutorGapBalanced
        },
        quality: tutorQuality.slice(0, 15),
        activityStatus: tutorActivityStatus.slice(0, 20)
      },
      interviewAnalytics: {
        supply: interviewSupply.slice(0, 20),
        demand: interviewDemand.slice(0, 15),
        gap: {
          undersupplied: interviewGapUndersupplied.slice(0, 10),
          balanced: interviewGapBalanced
        },
        quality: interviewQuality.slice(0, 15)
      },
      crossSkillIntelligence: {
        overlap: {
          strongInTutoringOnly: strongInTutoringOnly.slice(0, 10),
          strongInInterviewsOnly: strongInInterviewsOnly.slice(0, 10)
        }
      },
      insights
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
    const SessionRequest = require('../models/SessionRequest');
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1) Load all users with coin + activity info
    const allUsers = await User.find().select(
      'firstName lastName username silverCoins goldCoins lastActivityAt lastLogin createdAt'
    );

    const totalUsers = allUsers.length;
    const userCoinStats = allUsers.map(u => {
      const silver = u.silverCoins || 0;
      const gold = u.goldCoins || 0;
      const total = silver + gold;
      return { user: u, silver, gold, total };
    });

    const totalSilverCoins = userCoinStats.reduce((sum, u) => sum + u.silver, 0);
    const totalGoldCoins = userCoinStats.reduce((sum, u) => sum + u.gold, 0);
    const totalCoins = totalSilverCoins + totalGoldCoins;

    // 2) Economy health
    const totalEarners = userCoinStats.filter(u => u.total > 0).length;
    const nonEarners = totalUsers - totalEarners;
    const onlySilver = userCoinStats.filter(u => u.silver > 0 && u.gold === 0).length;
    const goldEarners = userCoinStats.filter(u => u.gold > 0).length;

    const economyHealth = {
      totalEarners,
      nonEarners,
      percentageEarningCoins: totalUsers > 0 ? Math.round((totalEarners / totalUsers) * 100) : 0,
      percentageOnlySilver: totalUsers > 0 ? Math.round((onlySilver / totalUsers) * 100) : 0,
      percentageEarningGold: totalUsers > 0 ? Math.round((goldEarners / totalUsers) * 100) : 0,
    };

    // 3) Silver vs Gold balance
    const silverGoldBalance = {
      totalSilver: totalSilverCoins,
      totalGold: totalGoldCoins,
      ratio: totalGoldCoins > 0 ? parseFloat((totalSilverCoins / totalGoldCoins).toFixed(2)) : 0,
      avgSilverPerUser: totalUsers > 0 ? Math.round(totalSilverCoins / totalUsers) : 0,
      avgGoldPerUser: totalUsers > 0 ? Math.round(totalGoldCoins / totalUsers) : 0,
    };

    // 4) Coin earning trend (per day, silver vs gold)
    const contributionsByDate = await Contribution.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$dateKey',
          silver: { $sum: '$breakdown.coinsEarnedSilver' },
          gold: { $sum: '$breakdown.coinsEarnedGold' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const contributionsMap = contributionsByDate.reduce((acc, item) => {
      acc[item._id] = item;
      return acc;
    }, {});

    const earningTrend = dateBuckets.map(date => ({
      date,
      silver: contributionsMap[date]?.silver || 0,
      gold: contributionsMap[date]?.gold || 0,
    }));

    // 5) Earning sources
    const earningSourcesAgg = await Contribution.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          sessionsAsLearner: { $sum: '$breakdown.sessionsAsLearner' },
          sessionsAsTutor: { $sum: '$breakdown.sessionsAsTutor' },
          liveSessions: { $sum: '$breakdown.liveSessions' },
          oneOnOneSessions: { $sum: '$breakdown.oneOnOneSessions' },
          interviewsCompleted: { $sum: '$breakdown.interviewsCompleted' },
          contributionsCount: { $sum: '$count' },
        },
      },
    ]);

    const es = earningSourcesAgg[0] || {};
    const earningSources = {
      sessions:
        (es.sessionsAsLearner || 0) +
        (es.sessionsAsTutor || 0) +
        (es.liveSessions || 0) +
        (es.oneOnOneSessions || 0),
      interviews: es.interviewsCompleted || 0,
      teaching: es.sessionsAsTutor || 0,
      contributions: es.contributionsCount || 0,
    };

    // 6) Concentration (coin distribution fairness)
    const sortedByCoins = [...userCoinStats].sort((a, b) => b.total - a.total);
    const top1Count = totalUsers > 0 ? Math.max(1, Math.floor(totalUsers * 0.01)) : 0;
    const top5Count = totalUsers > 0 ? Math.max(top1Count, Math.floor(totalUsers * 0.05)) : 0;
    const top10Count = totalUsers > 0 ? Math.max(top5Count, Math.floor(totalUsers * 0.1)) : 0;

    const sumCoins = (arr, count) => arr.slice(0, count).reduce((sum, u) => sum + u.total, 0);

    const top1Coins = sumCoins(sortedByCoins, top1Count);
    const top5Coins = sumCoins(sortedByCoins, top5Count);
    const top10Coins = sumCoins(sortedByCoins, top10Count);

    const concentration = totalCoins > 0
      ? {
          top1PercentShare: Math.round((top1Coins / totalCoins) * 100),
          top5PercentShare: Math.round((top5Coins / totalCoins) * 100),
          top10PercentShare: Math.round((top10Coins / totalCoins) * 100),
          remainingUsersShare: Math.max(0, 100 - Math.round((top10Coins / totalCoins) * 100)),
        }
      : {
          top1PercentShare: 0,
          top5PercentShare: 0,
          top10PercentShare: 0,
          remainingUsersShare: 100,
        };

    // 7) Engagement vs rewards correlation
    const [sessionsCompleted, interviewsCompleted] = await Promise.all([
      SessionRequest.countDocuments({
        createdAt: { $gte: start, $lte: end },
        status: 'completed',
      }),
      InterviewRequest.countDocuments({
        createdAt: { $gte: start, $lte: end },
        status: 'completed',
      }),
    ]);

    const totalCoinsEarned = contributionsByDate.reduce(
      (sum, d) => sum + (d.silver || 0) + (d.gold || 0),
      0
    );

    const engagementCorrelation = {
      sessionsCompleted,
      interviewsCompleted,
      coinsEarned: totalCoinsEarned,
      coinsPerSession:
        sessionsCompleted > 0 ? Math.round(totalCoinsEarned / sessionsCompleted) : 0,
    };

    // 8) Abuse / anomaly detection (very simple heuristic)
    const perUserCoinAgg = await Contribution.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: '$userId',
          coinsEarned: { $sum: '$breakdown.coinsEarned' },
          sessionsCompleted: { $sum: '$breakdown.sessionsAsTutor' },
        },
      },
    ]);

    const totalCoinsFromAgg = perUserCoinAgg.reduce(
      (sum, u) => sum + (u.coinsEarned || 0),
      0
    );
    const daysInRange = Math.max(1, dateBuckets.length);
    const globalAvgDailyCoins = daysInRange > 0 ? totalCoinsFromAgg / daysInRange : 0;

    const userMap = allUsers.reduce((acc, u) => {
      acc[u._id.toString()] = u;
      return acc;
    }, {});

    const suspiciousUsersRaw = perUserCoinAgg.filter(u => {
      const avgDaily = (u.coinsEarned || 0) / daysInRange;
      return (
        u.coinsEarned > 0 &&
        globalAvgDailyCoins > 0 &&
        avgDaily > globalAvgDailyCoins * 5 &&
        u.coinsEarned > 100
      );
    });

    const suspiciousUsers = suspiciousUsersRaw.map(u => {
      const user = userMap[u._id.toString()];
      const name = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
        : 'Unknown user';

      const avgDailyCoins = Math.round((u.coinsEarned || 0) / daysInRange);

      return {
        userId: u._id,
        name,
        avgDailyCoins,
        sessionsCompleted: u.sessionsCompleted || 0,
        flag: 'Unusually high daily coin earnings versus platform average',
      };
    });

    const abuseDetection = {
      totalFlagged: suspiciousUsers.length,
      suspiciousUsers,
    };

    // 9) Inactive coin holders
    const inactiveCoinHolders = userCoinStats
      .filter(u => {
        if (u.total <= 0) return false;
        const lastActive = u.user.lastActivityAt || u.user.lastLogin || u.user.createdAt;
        return lastActive && lastActive < thirtyDaysAgo;
      })
      .slice(0, 50)
      .map(u => ({
        userId: u.user._id,
        name:
          `${u.user.firstName || ''} ${u.user.lastName || ''}`.trim() ||
          u.user.username,
        coins: u.total,
        lastActive: (u.user.lastActivityAt || u.user.lastLogin || u.user.createdAt)
          ?.toISOString()
          .slice(0, 10),
      }));

    // 10) Retention impact of coins
    const activeCutoff = thirtyDaysAgo;

    const usersWithCoinsTotal = userCoinStats.filter(u => u.total > 0).length;
    const usersWithCoinsActive = userCoinStats.filter(
      u =>
        u.total > 0 &&
        u.user.lastActivityAt &&
        u.user.lastActivityAt >= activeCutoff
    ).length;

    const usersWithoutCoinsTotal = userCoinStats.filter(u => u.total === 0).length;
    const usersWithoutCoinsActive = userCoinStats.filter(
      u =>
        u.total === 0 &&
        u.user.lastActivityAt &&
        u.user.lastActivityAt >= activeCutoff
    ).length;

    const retentionImpact = {
      retentionRateWithCoins:
        usersWithCoinsTotal > 0
          ? Math.round((usersWithCoinsActive / usersWithCoinsTotal) * 100)
          : 0,
      retentionRateWithoutCoins:
        usersWithoutCoinsTotal > 0
          ? Math.round((usersWithoutCoinsActive / usersWithoutCoinsTotal) * 100)
          : 0,
      usersWithCoinsActive,
      usersWithCoinsTotal,
      usersWithoutCoinsActive,
      usersWithoutCoinsTotal,
    };

    res.json({
      economyHealth,
      silverGoldBalance,
      earningTrend,
      earningSources,
      topEarners: userCoinStats
        .filter(u => u.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 20)
        .map((u, idx) => {
          const lastActive = u.user.lastActivityAt || u.user.lastLogin || u.user.createdAt;
          const name =
            `${u.user.firstName || ''} ${u.user.lastName || ''}`.trim() ||
            u.user.username;

          const daysInRangeForRate = Math.max(1, dateBuckets.length);
          const avgCoinsPerDay = Math.round(u.total / daysInRangeForRate);

          return {
            _id: u.user._id,
            name,
            total: u.total,
            earnRate: avgCoinsPerDay,
            primarySource: u.gold > u.silver ? 'Gold-heavy' : 'Silver-heavy',
            lastActive: lastActive ? lastActive.toISOString().slice(0, 10) : 'N/A',
            highRateFlag: avgCoinsPerDay > (totalCoins / Math.max(1, totalUsers)) * 2,
          };
        }),
      concentration,
      engagementCorrelation,
      abuseDetection,
      inactiveCoinHolders,
      retentionImpact,
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

    res.json({
      summary: {
        totalReports,
        resolvedReports,
        unresolvedReports,
        resolutionRate
      }
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
    // Overview should focus on visitors who accepted cookies
    // and are tracked via the Visitor model.
    const baseFilter = {
      createdAt: { $gte: start, $lte: end },
      consentGiven: true,
    };

    const [
      totalVisitors,
      uniqueVisitors,
      returningVisitors,
    ] = await Promise.all([
      Visitor.countDocuments(baseFilter),
      Visitor.countDocuments({ ...baseFilter, visitCount: 1 }),
      Visitor.countDocuments({ ...baseFilter, visitCount: { $gt: 1 } }),
    ]);

    // Treat returning visitors as "active" and first-time as bounce
    const activeVisitors = returningVisitors;
    const inactiveVisitors = Math.max(totalVisitors - activeVisitors, 0);

    res.json({
      summary: {
        totalVisitors,
        uniqueVisitors,
        returningVisitors,
        activeVisitors,
        inactiveVisitors,
      },
    });
  } catch (error) {
    console.error('Analytics visitors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

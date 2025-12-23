const User = require('../models/User');
const Session = require('../models/Session');
const InterviewRequest = require('../models/InterviewRequest');
const InterviewerApplication = require('../models/InterviewerApplication');
const TutorApplication = require('../models/TutorApplication');
const Package = require('../models/Package');
const HelpMessage = require('../models/HelpMessage');

// Helper: build date buckets for last N days
function buildDateRange(days = 14, endDate) {
  const today = endDate ? new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())) : new Date();
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    buckets.push(d);
  }
  return buckets;
}

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalSessions,
      pendingSessions,
      activeSessions,
      totalInterviewRequests,
      pendingInterviewRequests,
      assignedInterviewRequests,
      totalExperts,
      approvedExperts,
      pendingExperts,
      totalTutorApplications,
      pendingTutorApplications,
      totalPackages,
      pendingHelpRequests,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ socketId: { $exists: true, $ne: null } }),
      // Heuristic: user has an OTP not expired => pending verification
      User.countDocuments({ otp: { $exists: true, $ne: null }, otpExpires: { $gt: now } }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'pending' }),
      Session.countDocuments({ status: 'active' }),
      InterviewRequest.countDocuments(),
      InterviewRequest.countDocuments({ status: 'pending' }),
      InterviewRequest.countDocuments({ status: 'assigned' }),
      InterviewerApplication.countDocuments(),
      InterviewerApplication.countDocuments({ status: 'approved' }),
      InterviewerApplication.countDocuments({ status: 'pending' }),
      TutorApplication.countDocuments(),
      TutorApplication.countDocuments({ status: 'pending' }),
      Package.countDocuments({ isActive: true }),
      HelpMessage.countDocuments({ status: 'pending' }),
    ]);

    // Expert users by role (teaching capability) - distinct from applications
    const expertUsers = await User.countDocuments({ role: { $in: ['teacher', 'both'] } });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        expertUsers, // users with teaching role
        totalExperts, // total interviewer applications
        approvedExperts,
        pendingExperts, // pending interviewer applications
        totalTutorApplications,
        pendingTutorApplications,
        totalSessions,
        activeSessions,
        pendingSessions,
        totalInterviewRequests,
        pendingInterviewRequests,
        assignedInterviewRequests,
        totalPackages,
        pendingHelpRequests,
      },
    });
  } catch (e) {
    console.error('[AdminStats] getStats error', e);
    res.status(500).json({ message: 'Failed to load stats' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // Query parameters: range=day|week|month|year or custom startDate/endDate (YYYY-MM-DD)
    const { range, startDate, endDate } = req.query;
    let days;
    switch ((range || '').toLowerCase()) {
      case 'day': days = 1; break;
      case 'week': days = 7; break;
      case 'month': days = 30; break;
      case 'year': days = 365; break;
      default: days = 14; // fallback
    }

    let customStart = null;
    let customEnd = null;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (!isNaN(s) && !isNaN(e) && s <= e) {
        customStart = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
        customEnd = new Date(Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate()));
        days = Math.max(1, Math.ceil((customEnd - customStart) / (1000 * 60 * 60 * 24)) + 1);
      }
    }

    const buckets = buildDateRange(days, customEnd);
    const start = customStart || buckets[0];
    const end = new Date((customEnd || buckets[buckets.length - 1]));
    end.setUTCDate(end.getUTCDate() + 1); // inclusive end boundary

    // Users per day (createdAt not present in schema; fallback to _id timestamp)
    // Derive date from ObjectId timestamp.
    const users = await User.find({ _id: { $exists: true } }, { _id: 1, role: 1 });
    const userDaily = buckets.map(d => ({ date: d.toISOString().slice(0, 10), count: 0 }));
    users.forEach(u => {
      const ts = u._id.getTimestamp();
      const key = ts.toISOString().slice(0, 10);
      const bucket = userDaily.find(b => b.date === key);
      if (bucket) bucket.count += 1;
    });

    // Sessions per day
    const sessions = await Session.find({}, { _id: 1, status: 1 });
    const sessionDaily = buckets.map(d => ({ date: d.toISOString().slice(0, 10), count: 0 }));
    sessions.forEach(s => {
      const ts = s._id.getTimestamp();
      const key = ts.toISOString().slice(0, 10);
      const bucket = sessionDaily.find(b => b.date === key);
      if (bucket) bucket.count += 1;
    });

    // Interview requests per day by status
    const interviews = await InterviewRequest.find({}, { _id: 1, status: 1 });
    const interviewDaily = buckets.map(d => ({ date: d.toISOString().slice(0, 10), pending: 0, assigned: 0 }));
    interviews.forEach(r => {
      const ts = r._id.getTimestamp();
      const key = ts.toISOString().slice(0, 10);
      const bucket = interviewDaily.find(b => b.date === key);
      if (bucket) {
        if (r.status === 'pending') bucket.pending += 1;
        if (r.status === 'assigned') bucket.assigned += 1;
      }
    });

    // Role distribution
    const roleAgg = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const roleDistribution = ['learner', 'teacher', 'both'].map(r => {
      const found = roleAgg.find(x => x._id === r);
      return { role: r, count: found ? found.count : 0 };
    });

    res.json({
      meta: {
        range: range || 'custom' || '14d',
        start: start.toISOString().slice(0, 10),
        end: (new Date(end.getTime() - 24*3600*1000)).toISOString().slice(0, 10),
        days: buckets.length,
      },
      userDaily,
      sessionDaily,
      interviewDaily,
      roleDistribution,
    });
  } catch (e) {
    console.error('[AdminStats] getAnalytics error', e);
    res.status(500).json({ message: 'Failed to load analytics' });
  }
};

const mongoose = require('mongoose');
const EmployeeActivity = require('../models/EmployeeActivity');
const TutorApplication = require('../models/TutorApplication');
const InterviewerApplication = require('../models/InterviewerApplication');
const Employee = require('../models/Employee');

// Time range helper: supports all-time or trailing windows including today
function getDateRange(range) {
  if (!range || range === 'all') return {};
  const now = new Date();
  let start;

  switch (range) {
    case 'today':
    case '1d':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '365d':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return {};
  }

  return { start, end: now };
}

async function buildTotals(match) {
  const docs = await EmployeeActivity.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        receivedSet: { $addToSet: '$applicationId' },
        approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        totalReceived: { $size: '$receivedSet' },
        approved: 1,
        rejected: 1,
      },
    },
  ]);

  const base = docs[0] || { totalReceived: 0, approved: 0, rejected: 0 };
  return {
    received: base.totalReceived,
    approved: base.approved,
    rejected: base.rejected,
    pending: Math.max(base.totalReceived - base.approved - base.rejected, 0),
  };
}

async function buildByRoleType(match) {
  const rows = await EmployeeActivity.aggregate([
    { $match: match },
    {
      $group: {
        _id: { type: '$applicationType', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const base = {
    tutor: { approved: 0, rejected: 0 },
    interview: { approved: 0, rejected: 0 },
  };

  for (const r of rows) {
    const type = r._id.type;
    const status = r._id.status;
    if (!base[type]) continue;
    base[type][status] = r.count;
  }

  const tutorTotal = base.tutor.approved + base.tutor.rejected;
  const interviewTotal = base.interview.approved + base.interview.rejected;

  return {
    tutor: { ...base.tutor, received: tutorTotal },
    interview: { ...base.interview, received: interviewTotal },
    both: {
      received: tutorTotal + interviewTotal,
      approved: base.tutor.approved + base.interview.approved,
      rejected: base.tutor.rejected + base.interview.rejected,
    },
  };
}

async function buildTimeSeries(match, format) {
  const rows = await EmployeeActivity.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          period: { $dateToString: { format, date: '$createdAt' } },
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.period',
        items: {
          $push: { status: '$_id.status', count: '$count' },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return rows.map((row) => {
    const counts = { approved: 0, rejected: 0 };
    for (const item of row.items) {
      counts[item.status] = item.count;
    }
    const received = counts.approved + counts.rejected;
    return { period: row._id, received, ...counts };
  });
}

// Build stats for a specific application type with time range and access control
async function buildStatsByApplicationType(employee, rangeFilter, applicationType = null) {
  const canTutor = employee.accessPermissions === 'tutor' || employee.accessPermissions === 'both';
  const canInterviewer = employee.accessPermissions === 'interviewer' || employee.accessPermissions === 'both';

  // Determine which types to include
  const shouldIncludeTutor = canTutor && (applicationType === null || applicationType === 'tutor');
  const shouldIncludeInterview = canInterviewer && (applicationType === null || applicationType === 'interview');

  let tutorStats = { total: 0, approved: 0, rejected: 0, pending: 0 };
  let interviewStats = { total: 0, approved: 0, rejected: 0, pending: 0 };

  // Build tutor stats
  if (shouldIncludeTutor) {
    const tutorQuery = { approvedByEmployee: employee._id, status: 'approved' };
    const tutorQueryRejected = { rejectedByEmployee: employee._id, status: 'rejected' };
    const tutorQueryPending = { status: 'pending' };

    if (rangeFilter.start || rangeFilter.end) {
      const timeFilter = {};
      if (rangeFilter.start) timeFilter.$gte = rangeFilter.start;
      if (rangeFilter.end) timeFilter.$lte = rangeFilter.end;

      tutorQuery.approvedActionTimestamp = timeFilter;
      tutorQueryRejected.rejectedActionTimestamp = timeFilter;
      tutorQueryPending.submittedAt = timeFilter;
    }

    const [approved, rejected, pending] = await Promise.all([
      TutorApplication.countDocuments(tutorQuery),
      TutorApplication.countDocuments(tutorQueryRejected),
      TutorApplication.countDocuments(tutorQueryPending),
    ]);

    tutorStats = {
      total: approved + rejected,
      approved,
      rejected,
      pending,
    };
  }

  // Build interview stats
  if (shouldIncludeInterview) {
    const interviewQuery = { approvedByEmployee: employee._id, status: 'approved' };
    const interviewQueryRejected = { rejectedByEmployee: employee._id, status: 'rejected' };
    const interviewQueryPending = { status: 'pending' };

    if (rangeFilter.start || rangeFilter.end) {
      const timeFilter = {};
      if (rangeFilter.start) timeFilter.$gte = rangeFilter.start;
      if (rangeFilter.end) timeFilter.$lte = rangeFilter.end;

      interviewQuery.approvedActionTimestamp = timeFilter;
      interviewQueryRejected.rejectedActionTimestamp = timeFilter;
      interviewQueryPending.createdAt = timeFilter;
    }

    const [approved, rejected, pending] = await Promise.all([
      InterviewerApplication.countDocuments(interviewQuery),
      InterviewerApplication.countDocuments(interviewQueryRejected),
      InterviewerApplication.countDocuments(interviewQueryPending),
    ]);

    interviewStats = {
      total: approved + rejected,
      approved,
      rejected,
      pending,
    };
  }

  return {
    tutorStats,
    interviewStats,
    combinedStats: {
      total: tutorStats.total + interviewStats.total,
      approved: tutorStats.approved + interviewStats.approved,
      rejected: tutorStats.rejected + interviewStats.rejected,
      pending: tutorStats.pending + interviewStats.pending,
    },
  };
}


async function buildDetailedListsForEmployee(employee, rangeFilter, applicationType = null) {
  const baseQueryTutor = {};
  const baseQueryInterview = {};

  // Apply time filter based on action timestamps
  if (rangeFilter.start || rangeFilter.end) {
    baseQueryTutor.$or = [];
    baseQueryInterview.$or = [];
    
    const timeFilter = {};
    if (rangeFilter.start) timeFilter.$gte = rangeFilter.start;
    if (rangeFilter.end) timeFilter.$lte = rangeFilter.end;

    // Check both action timestamps
    baseQueryTutor.$or.push(
      { approvedActionTimestamp: timeFilter },
      { rejectedActionTimestamp: timeFilter },
      { submittedAt: timeFilter } // Fallback for pending
    );
    baseQueryInterview.$or.push(
      { approvedActionTimestamp: timeFilter },
      { rejectedActionTimestamp: timeFilter },
      { createdAt: timeFilter } // Fallback for pending
    );
  }

  const canTutor = employee.accessPermissions === 'tutor' || employee.accessPermissions === 'both';
  const canInterviewer = employee.accessPermissions === 'interviewer' || employee.accessPermissions === 'both';

  // Apply applicationType filter
  const shouldIncludeTutor = canTutor && (applicationType === null || applicationType === 'tutor');
  const shouldIncludeInterview = canInterviewer && (applicationType === null || applicationType === 'interview');

  const promises = [];

  if (shouldIncludeTutor) {
    promises.push(
      TutorApplication.find({ ...baseQueryTutor, approvedByEmployee: employee._id, status: 'approved' })
        .populate('user', 'username firstName lastName email')
        .lean(),
      TutorApplication.find({ ...baseQueryTutor, rejectedByEmployee: employee._id, status: 'rejected' })
        .populate('user', 'username firstName lastName email')
        .lean(),
      TutorApplication.find({ ...baseQueryTutor, status: 'pending' })
        .populate('user', 'username firstName lastName email')
        .lean(),
    );
  } else {
    promises.push(Promise.resolve([]), Promise.resolve([]), Promise.resolve([]));
  }

  if (shouldIncludeInterview) {
    promises.push(
      InterviewerApplication.find({ ...baseQueryInterview, approvedByEmployee: employee._id, status: 'approved' })
        .populate('user', 'username firstName lastName email')
        .lean(),
      InterviewerApplication.find({ ...baseQueryInterview, rejectedByEmployee: employee._id, status: 'rejected' })
        .populate('user', 'username firstName lastName email')
        .lean(),
      InterviewerApplication.find({ ...baseQueryInterview, status: 'pending' })
        .populate('user', 'username firstName lastName email')
        .lean(),
    );
  } else {
    promises.push(Promise.resolve([]), Promise.resolve([]), Promise.resolve([]));
  }

  const [
    tutorApproved,
    tutorRejected,
    tutorPending,
    interviewApproved,
    interviewRejected,
    interviewPending,
  ] = await Promise.all(promises);

  const mapTutor = (app, status) => ({
    id: app._id,
    type: 'tutor',
    status,
    applicantName: app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() || app.user.username || app.user.email : 'Unknown',
    class: Array.isArray(app.skills) && app.skills[0] ? app.skills[0].class : undefined,
    subjects: Array.isArray(app.skills) ? app.skills.map(s => s.subject).filter(Boolean).join(', ') : undefined,
    user: app.user || null,
    submittedAt: app.submittedAt || app.createdAt,
    reviewedAt: status === 'approved' ? app.approvedActionTimestamp : status === 'rejected' ? app.rejectedActionTimestamp : null,
  });

  const mapInterview = (app, status) => ({
    id: app._id,
    type: 'interview',
    status,
    applicantName: app.user ? `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() || app.user.username || app.user.email : app.name || 'Unknown',
    company: app.company,
    position: app.position,
    user: app.user || null,
    submittedAt: app.createdAt,
    reviewedAt: status === 'approved' ? app.approvedActionTimestamp : status === 'rejected' ? app.rejectedActionTimestamp : null,
  });

  return {
    approved: [
      ...tutorApproved.map((a) => mapTutor(a, 'approved')),
      ...interviewApproved.map((a) => mapInterview(a, 'approved')),
    ],
    rejected: [
      ...tutorRejected.map((a) => mapTutor(a, 'rejected')),
      ...interviewRejected.map((a) => mapInterview(a, 'rejected')),
    ],
    pending: [
      ...tutorPending.map((a) => mapTutor(a, 'pending')),
      ...interviewPending.map((a) => mapInterview(a, 'pending')),
    ],
  };
}

// GET /employee/me/activity
exports.getMyActivity = async (req, res) => {
  try {
    const employee = req.employee;
    if (!employee) return res.status(401).json({ message: 'Employee auth required' });

    const range = req.query.range || '30d';
    const applicationType = req.query.applicationType || null; // 'tutor', 'interview', or null for both
    const { start, end } = getDateRange(range);

    // ALWAYS build complete stats (without filter) for KPI cards
    const stats = await buildStatsByApplicationType(employee, { start, end }, null);
    
    // Build detailed lists WITH application type filter (for table)
    const lists = await buildDetailedListsForEmployee(employee, { start, end }, applicationType);

    // Determine access permissions
    const canTutor = employee.accessPermissions === 'tutor' || employee.accessPermissions === 'both';
    const canInterviewer = employee.accessPermissions === 'interviewer' || employee.accessPermissions === 'both';
    const hasBothAccess = employee.accessPermissions === 'both';

    return res.json({
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        email: employee.email,
        accessPermissions: employee.accessPermissions,
      },
      access: {
        canTutor,
        canInterviewer,
        hasBothAccess,
      },
      stats,
      lists,
    });
  } catch (err) {
    console.error('getMyActivity error:', err);
    return res.status(500).json({ message: 'Failed to load activity' });
  }
};

// GET /admin/employees/:id/activity
exports.getEmployeeActivityForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid employee id' });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const range = req.query.range || '30d';
    const applicationType = req.query.applicationType || null; // 'tutor', 'interview', or null for both
    const { start, end } = getDateRange(range);

    // ALWAYS build complete stats (without filter) for KPI cards
    const stats = await buildStatsByApplicationType(employee, { start, end }, null);
    
    // Build detailed lists WITH application type filter (for table)
    const lists = await buildDetailedListsForEmployee(employee, { start, end }, applicationType);

    // Determine access permissions
    const canTutor = employee.accessPermissions === 'tutor' || employee.accessPermissions === 'both';
    const canInterviewer = employee.accessPermissions === 'interviewer' || employee.accessPermissions === 'both';
    const hasBothAccess = employee.accessPermissions === 'both';

    return res.json({
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        email: employee.email,
        accessPermissions: employee.accessPermissions,
      },
      access: {
        canTutor,
        canInterviewer,
        hasBothAccess,
      },
      stats,
      lists,
    });
  } catch (err) {
    console.error('getEmployeeActivityForAdmin error:', err);
    return res.status(500).json({ message: 'Failed to load employee activity' });
  }
};

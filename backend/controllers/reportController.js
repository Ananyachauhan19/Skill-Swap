const Report = require('../models/Report');
const { sendMail } = require('../utils/sendMail');
const { getEmailTemplate } = require('../utils/dynamicEmailTemplate');

const REPORT_EMAIL = process.env.REPORT_EMAIL || 'skillswaphubb@gmail.com';

const getRangeForPeriod = (period, date) => {
  if (!period || !date) return null;

  const selectedDate = new Date(date);
  if (Number.isNaN(selectedDate.getTime())) return null;
  selectedDate.setHours(0, 0, 0, 0);

  let startDate;
  let endDate;

  switch (period) {
    case 'daily':
      startDate = new Date(selectedDate);
      endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly': {
      // Week = Monday..Sunday
      const dayOfWeek = selectedDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(selectedDate);
      startDate.setDate(selectedDate.getDate() + daysToMonday);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'monthly':
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      return null;
  }

  return { startDate, endDate };
};

exports.createReport = async (req, res) => {
  try {
    const {
      type,
      email,
      issues = [],
      otherDetails = '',
      video,
      reportedUser,
      request,
    } = req.body || {};

    // Prefer authenticated user's email; fall back to body email if provided
    const reporterEmail = (req.user && req.user.email) || email;

    if (!reporterEmail) {
      return res.status(400).json({ message: 'Email is required' });
    }

    if (!type || !['video', 'account', 'request'].includes(type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    const doc = new Report({
      type,
      reporter: req.user?._id || undefined,
      reporterEmail,
      issues: Array.isArray(issues) ? issues : [],
      otherDetails,
      videoId: type === 'video' ? (video?._id || video?.id || '') : undefined,
      videoTitle: type === 'video' ? (video?.title || '') : undefined,
      videoOwnerId: type === 'video' ? (video?.userId || '') : undefined,
      reportedUserId:
        type === 'account' || type === 'request'
          ? reportedUser?._id || reportedUser?.id || reportedUser?.userId || ''
          : undefined,
      reportedUsername:
        type === 'account' || type === 'request' ? (reportedUser?.username || '') : undefined,
      requestId: type === 'request' ? (request?._id || '') : undefined,
      requestType: type === 'request' ? (request?.type || '') : undefined,
      requestStatus: type === 'request' ? (request?.status || '') : undefined,
      requestCompany: type === 'request' ? (request?.company || '') : undefined,
      requestPosition: type === 'request' ? (request?.position || '') : undefined,
      requestSubject: type === 'request' ? (request?.subject || '') : undefined,
      requestTopic: type === 'request' ? (request?.topic || '') : undefined,
      rawContext: { video, reportedUser, request },
    });

    await doc.save();

    // Send notification email to admin
    try {
      const reportTypeDisplay = type === 'video' ? 'Video' : type === 'request' ? 'Request' : 'Account';
      
      let reportDetails = '';
      if (type === 'video') {
        reportDetails = `<p><b>Video ID:</b> ${doc.videoId || '—'}</p>
          <p><b>Title:</b> ${doc.videoTitle || '—'}</p>
          <p><b>Owner ID:</b> ${doc.videoOwnerId || '—'}</p>`;
      } else if (type === 'request') {
        reportDetails = `<p><b>Request ID:</b> ${doc.requestId || '—'}</p>
          <p><b>Request Type:</b> ${doc.requestType || '—'}</p>
          <p><b>Status:</b> ${doc.requestStatus || '—'}</p>
          ${doc.requestCompany ? `<p><b>Company:</b> ${doc.requestCompany}</p>` : ''}
          ${doc.requestPosition ? `<p><b>Position:</b> ${doc.requestPosition}</p>` : ''}
          ${doc.requestSubject ? `<p><b>Subject:</b> ${doc.requestSubject}</p>` : ''}
          ${doc.requestTopic ? `<p><b>Topic:</b> ${doc.requestTopic}</p>` : ''}
          <p><b>Reported User:</b> ${doc.reportedUsername || '—'} (${doc.reportedUserId || '—'})</p>`;
      } else {
        reportDetails = `<p><b>User ID:</b> ${doc.reportedUserId || '—'}</p>
          <p><b>Username:</b> ${doc.reportedUsername || '—'}</p>`;
      }

      const emailHtml = await getEmailTemplate('reportNotification', {
        reportType: reportTypeDisplay,
        reporterEmail,
        issues: (Array.isArray(issues) && issues.length) ? issues.join(', ') : 'Not specified',
        otherDetails: otherDetails || '—',
        reportDetails
      });

      await sendMail({ 
        to: REPORT_EMAIL, 
        subject: `New ${reportTypeDisplay} Report - SkillSwap Hub`,
        html: emailHtml
      });
    } catch (e) {
      console.error('[Report] Failed to send report email:', e.message);
    }

    return res.status(201).json({ message: 'Report submitted', report: doc });
  } catch (e) {
    console.error('[Report] Create error:', e);
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

exports.listReports = async (req, res) => {
  try {
    const { type, status, period, date, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type && ['video', 'account', 'request'].includes(type)) {
      filter.type = type;
    }
    if (status === 'open') {
      filter.resolved = false;
    } else if (status === 'resolved') {
      filter.resolved = true;
    }

    if (period && period !== 'overall' && date) {
      const range = getRangeForPeriod(period, date);
      if (!range) {
        return res.status(400).json({ message: 'Invalid period/date' });
      }
      filter.createdAt = { $gte: range.startDate, $lte: range.endDate };
    }

    const safeLimit = Math.min(Number(limit) || 50, 100);
    const safePage = Math.max(Number(page) || 1, 1);

    const [reports, count] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .skip((safePage - 1) * safeLimit)
        .lean(),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      reports,
      totalPages: Math.ceil(count / safeLimit),
      currentPage: safePage,
      total: count,
    });
  } catch (e) {
    console.error('[Report] List error:', e);
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

exports.markResolved = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (!report.resolved) {
      report.resolved = true;
      report.resolvedAt = new Date();
      if (req.user?._id) {
        report.resolvedBy = req.user._id;
      }
      await report.save();
    }

    return res.status(200).json({ message: 'Report resolved', report });
  } catch (e) {
    console.error('[Report] Resolve error:', e);
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

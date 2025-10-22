const InterviewRequest = require('../models/InterviewRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const InterviewerApplication = require('../models/InterviewerApplication');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// simple multer setup for resume uploads (stores in /uploads/resumes)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'resumes'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Create a new interview request (by requester)
exports.submitRequest = async (req, res) => {
  try {
    const { company, position, message } = req.body;
    const requester = req.user._id;

    const { assignedInterviewer } = req.body;
    const reqDoc = new InterviewRequest({
      requester,
      company,
      position,
      message: message || '',
      // Status stays 'pending' even when user selects an interviewer - interviewer must schedule to confirm
      status: 'pending',
      assignedInterviewer: assignedInterviewer || null,
      // scheduledAt must only be set by the assigned interviewer via the schedule API
      scheduledAt: null,
    });

    await reqDoc.save();
    await reqDoc.populate('requester', 'firstName lastName username profilePic');

    // Notify admins
    const io = req.app.get('io');
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    let admin = null;
    if (adminEmail) admin = await User.findOne({ email: adminEmail });

    if (admin) {
      const notification = await Notification.create({
        userId: admin._id,
        type: 'interview-requested',
        message: `${req.user.firstName} ${req.user.lastName} requested an interview at ${company} for ${position}`,
        requestId: reqDoc._id,
        requesterId: requester,
        requesterName: `${req.user.firstName} ${req.user.lastName}`,
        company,
        position,
        timestamp: Date.now(),
      });

      if (io && admin._id) io.to(admin._id.toString()).emit('notification', notification);
    }

    res.status(201).json({ message: 'Interview request submitted', request: reqDoc });
  } catch (err) {
    console.error('submitRequest error', err);
    res.status(500).json({ message: 'Failed to submit interview request' });
  }
};

// Apply to become an interviewer (multipart for resume)
exports.applyInterviewer = [upload.single('resume'), async (req, res) => {
  try {
    // Debug logging for diagnosing 500 errors during apply
    try {
      console.info('[DEBUG] applyInterviewer called by user:', req.user && req.user._id ? req.user._id.toString() : req.user);
      console.info('[DEBUG] applyInterviewer body keys:', Object.keys(req.body || {}));
      console.info('[DEBUG] applyInterviewer file:', req.file ? { filename: req.file.filename, path: req.file.path } : null);
    } catch (logErr) {
      console.error('[DEBUG] failed to log applyInterviewer context', logErr);
    }
    const { name, company, position, experience, totalPastInterviews, qualification } = req.body;
    const userId = req.user._id;
    const resumeUrl = req.file ? `/uploads/resumes/${req.file.filename}` : '';

    let appDoc = await InterviewerApplication.findOne({ user: userId });
    const isNew = !appDoc;
    if (!appDoc) {
      appDoc = new InterviewerApplication({ user: userId });
    }

    // Update fields
    appDoc.name = name || appDoc.name;
    appDoc.company = company || appDoc.company;
    appDoc.position = position || appDoc.position;
    appDoc.experience = experience || appDoc.experience;
    appDoc.totalPastInterviews = Number(totalPastInterviews) || appDoc.totalPastInterviews || 0;
    appDoc.qualification = qualification || appDoc.qualification;
    // If a new resume was uploaded, replace the URL
    if (resumeUrl) appDoc.resumeUrl = resumeUrl;
    // Reset status to pending when (re)submitting
    appDoc.status = 'pending';

    await appDoc.save();

    // Notify admin (both for new and updated submissions)
    const io = req.app.get('io');
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    let admin = null;
    if (adminEmail) admin = await User.findOne({ email: adminEmail });
    if (admin) {
      const notification = await Notification.create({
        userId: admin._id,
        type: 'interviewer-application',
        message: `${req.user.firstName} ${req.user.lastName} ${isNew ? 'applied' : 'updated their application'} to be an interviewer`,
        applicationId: appDoc._id,
        timestamp: Date.now(),
      });
      if (io) io.to(admin._id.toString()).emit('notification', notification);
    }

    res.status(isNew ? 201 : 200).json({ message: isNew ? 'Application submitted' : 'Application updated', application: appDoc });
  } catch (err) {
    console.error('applyInterviewer error', err);
    res.status(500).json({ message: 'Failed to submit application' });
  }
}];

// Admin: list all interviewer applications
exports.listApplications = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const apps = await InterviewerApplication.find().populate('user', 'username firstName lastName email').sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error('listApplications error', err);
    res.status(500).json({ message: 'Failed to list applications' });
  }
};

// Admin approves an application
exports.approveApplication = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    console.info('[DEBUG] approveApplication called by admin:', req.user && req.user._id ? req.user._id.toString() : req.user, 'appId:', id);
    const app = await InterviewerApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = 'approved';
    await app.save();

    // Mark user as interviewer by adding their expertise into profile (simple approach)
    const user = await User.findById(app.user._id);
    if (user) {
      user.role = 'both';
      // append to experience and skillsToTeach
      user.experience = user.experience || [];
      user.experience.push({ company: app.company || '', position: 'Interviewer', duration: app.experience || '', description: app.qualification || '' });
      user.skillsToTeach = user.skillsToTeach || [];
      user.skillsToTeach.push({ subject: app.company || '', topic: app.qualification || '' });
      await user.save();
    }

    // Notify applicant
    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        userId: app.user._id,
        type: 'interviewer-approved',
        message: `Your application to be an interviewer was approved`,
        applicationId: app._id,
        timestamp: Date.now(),
      });
      if (io) io.to(app.user._id.toString()).emit('notification', notification);
    } catch (notifErr) {
      console.error('[DEBUG] notification create failed in approveApplication', notifErr);
      // continue — don't block approval on notification
    }

    res.json({ message: 'Application approved', application: app });
  } catch (err) {
    console.error('approveApplication error', err);
    res.status(500).json({ message: 'Failed to approve application' });
  }
};

// Admin rejects an application
exports.rejectApplication = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    console.info('[DEBUG] rejectApplication called by admin:', req.user && req.user._id ? req.user._id.toString() : req.user, 'appId:', id);
    const app = await InterviewerApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = 'rejected';
    await app.save();

    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        userId: app.user._id,
        type: 'interviewer-rejected',
        message: `Your application to be an interviewer was rejected`,
        applicationId: app._id,
        timestamp: Date.now(),
      });
      if (io) io.to(app.user._id.toString()).emit('notification', notification);
    } catch (notifErr) {
      console.error('[DEBUG] notification create failed in rejectApplication', notifErr);
      // continue — don't block rejection on notification
    }

    res.json({ message: 'Application rejected', application: app });
  } catch (err) {
    console.error('rejectApplication error', err);
    res.status(500).json({ message: 'Failed to reject application' });
  }
};

// Public: get approved interviewers, optionally filter by company or position
exports.getApprovedInterviewers = async (req, res) => {
  try {
    const { company, position } = req.query;
    // Find users who have a matching InterviewerApplication approved OR role set to 'both' and skillsToTeach match
    const appsQuery = { status: 'approved' };
    if (company) appsQuery.company = new RegExp(company, 'i');
    if (position) appsQuery.position = new RegExp(position, 'i');
    const apps = await InterviewerApplication.find(appsQuery).populate('user', 'username firstName lastName profilePic');
    res.json(apps.map(a => ({ application: a, user: a.user })));
  } catch (err) {
    console.error('getApprovedInterviewers error', err);
    res.status(500).json({ message: 'Failed to fetch interviewers' });
  }
};

// Public: return a list of past interviews (simple placeholder to satisfy frontend)
exports.getPastInterviews = async (req, res) => {
  try {
    // For now return empty array — can be populated from past sessions later
    res.json([]);
  } catch (err) {
    console.error('getPastInterviews error', err);
    res.status(500).json({ message: 'Failed to fetch past interviews' });
  }
};

// Public: return FAQ list for interviews
exports.getFaqs = async (req, res) => {
  try {
    const faqs = [
      { q: 'What is a mock interview?', a: 'A simulated interview with feedback.' },
      { q: 'How long is a session?', a: 'Typically 30-60 minutes.' }
    ];
    res.json({ faqs });
  } catch (err) {
    console.error('getFaqs error', err);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
};

// Get current logged-in user's interviewer application (if any)
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const app = await InterviewerApplication.findOne({ user: userId });
    res.json(app || null);
  } catch (err) {
    console.error('getMyApplication error', err);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
};

// Get requests for the logged-in user (returns { received, sent } for normal users, all for admin)
exports.getUserRequests = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const isAdmin = req.user && req.user.email && req.user.email.toLowerCase() === adminEmail;

    if (isAdmin) {
      const all = await InterviewRequest.find().populate('requester', 'username firstName lastName').populate('assignedInterviewer', 'username firstName lastName').sort({ createdAt: -1 });
      return res.json(all);
    }

    // Find requests where the user is requester or the assigned interviewer
    const docs = await InterviewRequest.find({
      $or: [{ requester: req.user._id }, { assignedInterviewer: req.user._id }]
    }).populate('requester', 'username firstName lastName').populate('assignedInterviewer', 'username firstName lastName').sort({ createdAt: -1 });

    const sent = docs.filter(d => d.requester && d.requester._id.toString() === req.user._id.toString());
    const received = docs.filter(d => d.assignedInterviewer && d.assignedInterviewer._id.toString() === req.user._id.toString());

    res.json({ received, sent });
  } catch (err) {
    console.error('getUserRequests error', err);
    res.status(500).json({ message: 'Failed to fetch interview requests' });
  }
};

// Admin: get all requests (for admin UI)
exports.getAllRequests = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const all = await InterviewRequest.find().populate('requester', 'username firstName lastName').populate('assignedInterviewer', 'username firstName lastName').sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.error('getAllRequests error', err);
    res.status(500).json({ message: 'Failed to fetch all interview requests' });
  }
};

// Admin assigns an interviewer by username
exports.assignInterviewer = async (req, res) => {
  try {
    const { requestId, interviewerUsername } = req.body;
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    const interviewer = await User.findOne({ username: interviewerUsername });
    if (!interviewer) return res.status(404).json({ message: 'Interviewer username not found' });

    reqDoc.assignedInterviewer = interviewer._id;
    // Keep status as 'pending' - interviewer must schedule to confirm
    reqDoc.status = 'pending';
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName');

    // Notify interviewer
    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: interviewer._id,
      type: 'interview-assigned',
      message: `You have been assigned an interview request at ${reqDoc.company} for ${reqDoc.position}`,
      requestId: reqDoc._id,
      requesterId: reqDoc.requester,
      requesterName: `${reqDoc.requester.firstName || ''} ${reqDoc.requester.lastName || ''}`,
      company: reqDoc.company,
      position: reqDoc.position,
      timestamp: Date.now(),
    });

    if (io) io.to(interviewer._id.toString()).emit('notification', notification);

    res.json({ message: 'Interviewer assigned', request: reqDoc });
  } catch (err) {
    console.error('assignInterviewer error', err);
    res.status(500).json({ message: 'Failed to assign interviewer' });
  }
};

// Interviewer schedules date/time for assigned request
exports.scheduleInterview = async (req, res) => {
  try {
    const { requestId, scheduledAt } = req.body; // scheduledAt should be ISO date string
    console.info(`[DEBUG] scheduleInterview called by user ${req.user && req.user._id ? req.user._id.toString() : 'unknown'} for request ${requestId} with scheduledAt=${scheduledAt}`);
    // ensure logs directory exists and append a persistent record
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      const line = `${new Date().toISOString()} | user=${req.user && req.user._id ? req.user._id.toString() : 'unknown'} | request=${requestId} | scheduledAt=${scheduledAt}${os.EOL}`;
      fs.appendFileSync(path.join(logsDir, 'schedule.log'), line);
    } catch (logErr) {
      console.error('[DEBUG] failed to write schedule.log', logErr);
    }
    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    // Only assigned interviewer can schedule
    if (!reqDoc.assignedInterviewer || reqDoc.assignedInterviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to schedule this interview' });
    }

    reqDoc.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    reqDoc.status = 'scheduled';
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName');

    // Notify requester (user)
    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: reqDoc.requester._id,
      type: 'interview-scheduled',
      message: `Your interview has been scheduled for ${reqDoc.scheduledAt ? reqDoc.scheduledAt.toString() : 'TBD'}`,
      requestId: reqDoc._id,
      requesterId: reqDoc.assignedInterviewer,
      requesterName: `${reqDoc.assignedInterviewer.firstName || ''} ${reqDoc.assignedInterviewer.lastName || ''}`,
      company: reqDoc.company,
      position: reqDoc.position,
      timestamp: Date.now(),
    });

    if (io) io.to(reqDoc.requester._id.toString()).emit('notification', notification);

    // Also notify the assigned interviewer (confirmation)
    try {
      const notifInterviewer = await Notification.create({
        userId: reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer,
        type: 'interview-scheduled-confirmation',
        message: `You scheduled the interview for ${reqDoc.scheduledAt ? reqDoc.scheduledAt.toString() : 'TBD'}`,
        requestId: reqDoc._id,
        company: reqDoc.company,
        position: reqDoc.position,
        timestamp: Date.now(),
      });
      if (io && reqDoc.assignedInterviewer) io.to((reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer).toString()).emit('notification', notifInterviewer);
    } catch (e) {
      console.error('[DEBUG] failed to create interviewer confirmation notification', e);
    }

    res.json({ message: 'Interview scheduled', request: reqDoc });
  } catch (err) {
    console.error('scheduleInterview error', err);
    res.status(500).json({ message: 'Failed to schedule interview' });
  }
};

// Get scheduled interviews for user or interviewer (either role)
exports.getScheduledForUserOrInterviewer = async (req, res) => {
  try {
    const userId = req.user._id;
    const scheduled = await InterviewRequest.find({
      $or: [{ requester: userId }, { assignedInterviewer: userId }],
      status: 'scheduled'
    }).populate('requester', 'username firstName lastName').populate('assignedInterviewer', 'username firstName lastName').sort({ scheduledAt: 1 });

    res.json(scheduled);
  } catch (err) {
    console.error('getScheduledForUserOrInterviewer error', err);
    res.status(500).json({ message: 'Failed to fetch scheduled interviews' });
  }
};

module.exports = exports;

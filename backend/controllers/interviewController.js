const InterviewRequest = require('../models/InterviewRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Create a new interview request (by requester)
exports.submitRequest = async (req, res) => {
  try {
    const { subject, topic, subtopic, message } = req.body;
    const requester = req.user._id;

    const reqDoc = new InterviewRequest({
      requester,
      subject,
      topic: topic || '',
      subtopic: subtopic || '',
      message: message || '',
      status: 'pending',
    });

    await reqDoc.save();
    await reqDoc.populate('requester', 'firstName lastName username profilePic');

    // Notify admins (emit to admin email via skill-swap admin flow). For now create notification for admin based on ADMIN_EMAIL user if exists
    const io = req.app.get('io');

    // try to find admin user by email in env
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    let admin = null;
    if (adminEmail) admin = await User.findOne({ email: adminEmail });

    if (admin) {
      const notification = await Notification.create({
        userId: admin._id,
        type: 'interview-requested',
        message: `${req.user.firstName} ${req.user.lastName} requested an interview on ${subject}${subtopic ? ` (${subtopic})` : ''}`,
        requestId: reqDoc._id,
        requesterId: requester,
        requesterName: `${req.user.firstName} ${req.user.lastName}`,
        subject,
        topic,
        subtopic,
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
    reqDoc.status = 'assigned';
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName');

    // Notify interviewer
    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: interviewer._id,
      type: 'interview-assigned',
      message: `You have been assigned an interview request on ${reqDoc.subject}`,
      requestId: reqDoc._id,
      requesterId: reqDoc.requester,
      requesterName: `${reqDoc.requester.firstName || ''} ${reqDoc.requester.lastName || ''}`,
      subject: reqDoc.subject,
      topic: reqDoc.topic,
      subtopic: reqDoc.subtopic,
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
      message: `Your interview has been scheduled for ${reqDoc.scheduledAt}`,
      requestId: reqDoc._id,
      requesterId: reqDoc.assignedInterviewer,
      requesterName: `${reqDoc.assignedInterviewer.firstName || ''} ${reqDoc.assignedInterviewer.lastName || ''}`,
      subject: reqDoc.subject,
      topic: reqDoc.topic,
      subtopic: reqDoc.subtopic,
      timestamp: Date.now(),
    });

    if (io) io.to(reqDoc.requester._id.toString()).emit('notification', notification);

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

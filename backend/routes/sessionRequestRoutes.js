const express = require('express');
const router = express.Router();
const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/requireAuth');

// Create a new session request
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { tutorId, subject, topic, subtopic, message } = req.body;
    const requesterId = req.user._id;

    // Check if tutor exists
    const tutor = await User.findById(tutorId).select('firstName lastName profilePic username');
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Check if there's already a pending request
    const existingRequest = await SessionRequest.findOne({
      requester: requesterId,
      tutor: tutorId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending request with this tutor' });
    }

    // Create new session request
    const sessionRequest = new SessionRequest({
      requester: requesterId,
      tutor: tutorId,
      subject,
      topic,
      subtopic: subtopic || '',
      message: message || '',
      status: 'pending',
      createdAt: new Date()
    });

    await sessionRequest.save();

    // Populate user details for response and notification
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Create notification for the tutor
    const requesterName = `${sessionRequest.requester.firstName} ${sessionRequest.requester.lastName}`;
    const notification = await Notification.create({
      userId: tutorId,
      type: 'session-requested',
      message: `${requesterName} has requested a session on ${subject}${subtopic ? ` (${subtopic})` : ''}.`,
      sessionId: sessionRequest._id,
      requesterId: requesterId,
      requesterName,
      subject,
      topic,
      subtopic,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the tutor
    const io = req.app.get('io');
    io.to(tutorId.toString()).emit('notification', {
      _id: notification._id,
      userId: tutorId,
      type: 'session-requested',
      message: `${requesterName} has requested a session on ${subject}${subtopic ? ` (${subtopic})` : ''}.`,
      sessionId: sessionRequest._id,
      requesterId: requesterId,
      requesterName,
      subject,
      topic,
      subtopic,
      timestamp: notification.timestamp,
      read: false
    });

    // Emit real-time event to tutor if online (consistent with socket.js)
    io.to(tutorId.toString()).emit('session-request-received', {
      sessionRequest,
      requester: {
        userId: sessionRequest.requester._id,
        firstName: sessionRequest.requester.firstName,
        lastName: sessionRequest.requester.lastName,
        profilePic: sessionRequest.requester.profilePic
      }
    });

    res.status(201).json({
      message: 'Session request sent successfully',
      sessionRequest
    });
  } catch (error) {
    console.error('Error creating session request:', error);
    res.status(500).json({ message: 'Failed to create session request' });
  }
});

// Get session requests for a user (as tutor)
router.get('/received', requireAuth, async (req, res) => {
  try {
    const requests = await SessionRequest.find({ 
      tutor: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'firstName lastName profilePic username')
    .populate('tutor', 'firstName lastName profilePic username')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching received requests:', error);
    res.status(500).json({ message: 'Failed to fetch session requests' });
  }
});

// Get session requests sent by a user (as requester)
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const requests = await SessionRequest.find({ 
      requester: req.user._id 
    })
    .populate('requester', 'firstName lastName profilePic username')
    .populate('tutor', 'firstName lastName profilePic username')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({ message: 'Failed to fetch sent requests' });
  }
});

// Get all session requests for a user (both sent and received)
router.get('/all', requireAuth, async (req, res) => {
  try {
    const [received, sent] = await Promise.all([
      SessionRequest.find({ 
        tutor: req.user._id 
      })
      .populate('requester', 'firstName lastName profilePic username')
      .populate('tutor', 'firstName lastName profilePic username')
      .sort({ createdAt: -1 }),
      
      SessionRequest.find({ 
        requester: req.user._id 
      })
      .populate('requester', 'firstName lastName profilePic username')
      .populate('tutor', 'firstName lastName profilePic username')
      .sort({ createdAt: -1 })
    ]);

    res.json({
      received,
      sent
    });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// Get active session for a user
router.get('/active', requireAuth, async (req, res) => {
  try {
    const activeSession = await SessionRequest.findOne({
      $or: [
        { tutor: req.user._id },
        { requester: req.user._id }
      ],
      status: 'active'
    })
    .populate('requester', 'firstName lastName profilePic username')
    .populate('tutor', 'firstName lastName profilePic username')
    .sort({ updatedAt: -1 });

    if (!activeSession) {
      return res.json({ activeSession: null });
    }

    let role = null;
    if (activeSession.tutor._id.toString() === req.user._id.toString()) {
      role = 'tutor';
    } else if (activeSession.requester._id.toString() === req.user._id.toString()) {
      role = 'requester';
    }

    res.json({
      activeSession: {
        sessionId: activeSession._id.toString(),
        sessionRequest: activeSession,
        role
      }
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ message: 'Failed to fetch active session' });
  }
});

// Approve a session request
router.post('/approve/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const tutorId = req.user._id;

    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      tutor: tutorId,
      status: 'pending'
    });

    if (!sessionRequest) {
      return res.status(404).json({ message: 'Session request not found' });
    }

    sessionRequest.status = 'approved';
    await sessionRequest.save();

    // Populate user details for response and notification
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Create notification for the requester
    const tutorName = `${sessionRequest.tutor.firstName} ${sessionRequest.tutor.lastName}`;
    const notification = await Notification.create({
      userId: sessionRequest.requester._id,
      type: 'session-approved',
      message: `Your session request on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''} has been approved by ${tutorName}.`,
      sessionId: sessionRequest._id,
      requesterId: tutorId,
      requesterName: tutorName,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the requester
    const io = req.app.get('io');
    io.to(sessionRequest.requester._id.toString()).emit('notification', {
      _id: notification._id,
      userId: sessionRequest.requester._id,
      type: 'session-approved',
      message: `Your session request on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''} has been approved by ${tutorName}.`,
      sessionId: sessionRequest._id,
      requesterId: tutorId,
      requesterName: tutorName,
      timestamp: notification.timestamp,
      read: false
    });

    // Emit real-time event to requester (consistent with socket.js)
    io.to(sessionRequest.requester._id.toString()).emit('session-request-updated', {
      sessionRequest,
      action: 'approve'
    });

    // Emit session started event (consistent with socket.js)
    const sessionStartedPayload = {
      sessionId: sessionRequest._id.toString(),
      sessionRequest,
      tutor: sessionRequest.tutor,
      requester: sessionRequest.requester
    };
    io.to(tutorId.toString()).emit('session-started', sessionStartedPayload);
    io.to(sessionRequest.requester._id.toString()).emit('session-started', sessionStartedPayload);

    res.json({
      message: 'Session request approved',
      sessionRequest
    });
  } catch (error) {
    console.error('Error approving session request:', error);
    res.status(500).json({ message: 'Failed to approve session request' });
  }
});

// Reject a session request
router.post('/reject/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const tutorId = req.user._id;

    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      tutor: tutorId,
      status: 'pending'
    });

    if (!sessionRequest) {
      return res.status(404).json({ message: 'Session request not found' });
    }

    sessionRequest.status = 'rejected';
    await sessionRequest.save();

    // Populate user details for response and notification
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Create notification for the requester
    const tutorName = `${sessionRequest.tutor.firstName} ${sessionRequest.tutor.lastName}`;
    const notification = await Notification.create({
      userId: sessionRequest.requester._id,
      type: 'session-rejected',
      message: `Your session request on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''} has been rejected by ${tutorName}.`,
      sessionId: sessionRequest._id,
      requesterId: tutorId,
      requesterName: tutorName,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the requester
    const io = req.app.get('io');
    io.to(sessionRequest.requester._id.toString()).emit('notification', {
      _id: notification._id,
      userId: sessionRequest.requester._id,
      type: 'session-rejected',
      message: `Your session request on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''} has been rejected by ${tutorName}.`,
      sessionId: sessionRequest._id,
      requesterId: tutorId,
      requesterName: tutorName,
      timestamp: notification.timestamp,
      read: false
    });

    // Emit real-time event to requester (consistent with socket.js)
    io.to(sessionRequest.requester._id.toString()).emit('session-request-updated', {
      sessionRequest,
      action: 'reject'
    });

    res.json({
      message: 'Session request rejected',
      sessionRequest
    });
  } catch (error) {
    console.error('Error rejecting session request:', error);
    res.status(500).json({ message: 'Failed to reject session request' });
  }
});

// Start a session (set status to 'active')
router.post('/start/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const tutorId = req.user._id;

    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      tutor: tutorId,
      status: 'approved'
    });

    if (!sessionRequest) {
      return res.status(404).json({ message: 'Session request not found or not approved' });
    }

    sessionRequest.status = 'active';
    await sessionRequest.save();

    // Populate user details for response
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Emit session started event (consistent with socket.js)
    const io = req.app.get('io');
    const sessionStartedPayload = {
      sessionId: sessionRequest._id.toString(),
      sessionRequest,
      tutor: sessionRequest.tutor,
      requester: sessionRequest.requester
    };
    io.to(tutorId.toString()).emit('session-started', sessionStartedPayload);
    io.to(sessionRequest.requester._id.toString()).emit('session-started', sessionStartedPayload);

    res.json({
      message: 'Session started',
      sessionRequest
    });
  } catch (error) {
    console.error('Error starting session:', error);
    res.status(500).json({ message: 'Failed to start session' });
  }
});

// Complete a session (set status to 'completed')
router.post('/complete/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      status: 'active'
    });

    if (!sessionRequest) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    if (
      sessionRequest.tutor.toString() !== req.user._id.toString() &&
      sessionRequest.requester.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to complete this session' });
    }

    sessionRequest.status = 'completed';
    await sessionRequest.save();

    // Emit session completed event (consistent with socket.js)
    const io = req.app.get('io');
    io.to(sessionRequest._id.toString()).emit('session-completed', { sessionId: sessionRequest._id.toString() });

    res.json({ message: 'Session marked as completed' });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ message: 'Failed to complete session' });
  }
});

// Cancel a session (set status to 'cancelled')
router.post('/cancel/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      status: { $in: ['approved', 'active'] },
      requester: req.user._id
    });

    if (!sessionRequest) {
      return res.status(404).json({ message: 'Session not found or not authorized' });
    }

    sessionRequest.status = 'cancelled';
    await sessionRequest.save();

    // Populate user details for notification
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');

    // Create notification for the tutor
    const requesterName = `${sessionRequest.requester.firstName} ${sessionRequest.requester.lastName}`;
    const notification = await Notification.create({
      userId: sessionRequest.tutor._id,
      type: 'session-cancelled',
      message: `${requesterName} has cancelled the session on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`,
      sessionId: sessionRequest._id,
      requesterId: req.user._id,
      requesterName,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the tutor
    const io = req.app.get('io');
    io.to(sessionRequest.tutor._id.toString()).emit('notification', {
      _id: notification._id,
      userId: sessionRequest.tutor._id,
      type: 'session-cancelled',
      message: `${requesterName} has cancelled the session on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`,
      sessionId: sessionRequest._id,
      requesterId: req.user._id,
      requesterName,
      timestamp: notification.timestamp,
      read: false
    });

    // Emit session cancelled event (consistent with socket.js)
    const payload = {
      sessionId: sessionRequest._id.toString(),
      sessionRequest,
      message: 'Session was cancelled by the requester.'
    };
    io.to(sessionRequest.tutor._id.toString()).emit('session-cancelled', payload);
    io.to(req.user._id.toString()).emit('session-cancelled', payload);

    res.json({ message: 'Session cancelled' });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({ message: 'Failed to cancel session' });
  }
});

module.exports = router;
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/requireAuth');

// Rate limiter for sensitive endpoints
const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit to 100 requests per window
  message: 'Too many requests, please try again later.',
});

// Validation middleware for creating session request
const validateSessionRequest = [
  body('tutorId').isMongoId().withMessage('Invalid tutor ID'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('topic').trim().notEmpty().withMessage('Topic is required'),
  body('subtopic').trim().optional(),
  body('message').trim().optional(),
];

// Validation middleware for request ID
const validateRequestId = [
  param('requestId').isMongoId().withMessage('Invalid request ID'),
];

// Helper function to send notifications
const sendNotification = async (io, userId, type, message, sessionId, requesterId, requesterName) => {
  const notification = await Notification.create({
    userId,
    type,
    message,
    sessionId,
    requesterId,
    requesterName,
    timestamp: Date.now(),
  });

  io.to(userId.toString()).emit('notification', {
    _id: notification._id,
    userId,
    type,
    message,
    sessionId,
    requesterId,
    requesterName,
    timestamp: Date.now(),
  });
};

// Error handling middleware
const handleErrors = (res, status, message) => {
  return res.status(status).json({ message });
};

/**
 * @route POST /api/session-requests/create
 * @desc Create a new session request
 * @access Private
 */
router.post('/create', requireAuth, requestLimiter, validateSessionRequest, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleErrors(res, 400, errors.array()[0].msg);
  }

  try {
    const { tutorId, subject, topic, subtopic, message } = req.body;
    const requesterId = req.user._id;

    // Check if tutor exists
    const tutor = await User.findById(tutorId).select('firstName lastName profilePic');
    if (!tutor) {
      return handleErrors(res, 404, 'Tutor not found');
    }

    // Check for existing pending request
    const existingRequest = await SessionRequest.findOne({
      requester: requesterId,
      tutor: tutorId,
      status: 'pending',
    });
    if (existingRequest) {
      return handleErrors(res, 400, 'You already have a pending request with this tutor');
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
    });

    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Send notification to tutor
    const io = req.app.get('io');
    const requesterName = `${req.user.firstName} ${req.user.lastName}`;
    const notificationMessage = `${requesterName} has requested a session on ${subject}${subtopic ? ` (${subtopic})` : ''}.`;
    await sendNotification(
      io,
      tutor._id,
      'session-requested',
      notificationMessage,
      sessionRequest._id,
      requesterId,
      requesterName
    );

    res.status(201).json({
      message: 'Session request sent successfully',
      sessionRequest,
    });
  } catch (error) {
    console.error('Error creating session request:', error);
    handleErrors(res, 500, 'Failed to create session request');
  }
});

/**
 * @route GET /api/session-request doubted-requests/received
 * @desc Get received session requests (as tutor)
 * @access Private
 */
router.get('/received', requireAuth, async (req, res) => {
  try {
    const requests = await SessionRequest.find({ tutor: req.user._id, status: 'pending' })
      .populate('requester', 'firstName lastName profilePic username')
      .populate('tutor', 'firstName lastName profilePic username')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching received requests:', error);
    handleErrors(res, 500, 'Failed to fetch session requests');
  }
});

/**
 * @route GET /api/session-requests/sent
 * @desc Get sent session requests (as requester)
 * @access Private
 */
router.get('/sent', requireAuth, async (req, res) => {
  try {
    const requests = await SessionRequest.find({ requester: req.user._id })
      .populate('requester', 'firstName lastName profilePic username')
      .populate('tutor', 'firstName lastName profilePic username')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    handleErrors(res, 500, 'Failed to fetch sent requests');
  }
});

/**
 * @route GET /api/session-requests/all
 * @desc Get all session requests (sent and received)
 * @access Private
 */
router.get('/all', requireAuth, async (req, res) => {
  try {
    const [received, sent] = await Promise.all([
      SessionRequest.find({ tutor: req.user._id })
        .populate('requester', 'firstName lastName profilePic username')
        .populate('tutor', 'firstName lastName profilePic username')
        .sort({ createdAt: -1 }),
      SessionRequest.find({ requester: req.user._id })
        .populate('requester', 'firstName lastName profilePic username')
        .populate('tutor', 'firstName lastName profilePic username')
        .sort({ createdAt: -1 }),
    ]);

    res.json({ received, sent });
  } catch (error) {
    console.error('Error fetching all requests:', error);
    handleErrors(res, 500, 'Failed to fetch requests');
  }
});

/**
 * @route GET /api/session-requests/active
 * @desc Get active session for the user
 * @access Private
 */
router.get('/active', requireAuth, async (req, res) => {
  try {
    const activeSession = await SessionRequest.findOne({
      $or: [{ tutor: req.user._id }, { requester: req.user._id }],
      status: 'active',
    })
      .populate('requester', 'firstName lastName profilePic username')
      .populate('tutor', 'firstName lastName profilePic username')
      .sort({ updatedAt: -1 });

    if (!activeSession) {
      return res.json({ activeSession: null });
    }

    const role = activeSession.tutor._id.toString() === req.user._id.toString() ? 'tutor' : 'requester';

    res.json({
      activeSession: {
        sessionId: activeSession._id.toString(),
        sessionRequest: activeSession,
        role,
      },
    });
  } catch (error) {
    console.error('Error fetching active session:', error);
    handleErrors(res, 500, 'Failed to fetch active session');
  }
});

/**
 * @route POST /api/session-requests/approve/:requestId
 * @desc Approve a session request
 * @access Private
 */
router.post('/approve/:requestId', requireAuth, requestLimiter, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleErrors(res, 400, errors.array()[0].msg);
  }

  try {
    const { requestId } = req.params;
    const tutorId = req.user._id;

    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      tutor: tutorId,
      status: 'pending',
    });

    if (!sessionRequest) {
      return handleErrors(res, 404, 'Session request not found or not pending');
    }

    sessionRequest.status = 'approved';
    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Send notification to requester
    const io = req.app.get('io');
    const tutorName = `${req.user.firstName} ${req.user.lastName}`;
    const notificationMessage = `${tutorName} has approved your session request on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`;
    await sendNotification(
      io,
      sessionRequest.requester._id,
      'session-approved',
      notificationMessage,
      sessionRequest._id,
      tutorId,
      tutorName
    );

    res.json({
      message: 'Session request approved',
      sessionRequest,
    });
  } catch (error) {
    console.error('Error approving session request:', error);
    handleErrors(res, 500, 'Failed to approve session request');
  }
});

/**
 * @route POST /api/session-requests/reject/:requestId
 * @desc Reject a session request
 * @access Private
 */
router.post('/reject/:requestId', requireAuth, requestLimiter, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleErrors(res, 400, errors.array()[0].msg);
  }

  try {
    const { requestId } = req.params;
    const tutorId = req.user._id;

    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      tutor: tutorId,
      status: 'pending',
    });

    if (!sessionRequest) {
      return handleErrors(res, 404, 'Session request not found or not pending');
    }

    sessionRequest.status = 'rejected';
    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Send notification to requester
    const io = req.app.get('io');
    const tutorName = `${req.user.firstName} ${req.user.lastName}`;
    const notificationMessage = `${tutorName} has rejected your session request on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`;
    await sendNotification(
      io,
      sessionRequest.requester._id,
      'session-rejected',
      notificationMessage,
      sessionRequest._id,
      tutorId,
      tutorName
    );

    res.json({
      message: 'Session request rejected',
      sessionRequest,
    });
  } catch (error) {
    console.error('Error rejecting session request:', error);
    handleErrors(res, 500, 'Failed to reject session request');
  }
});

/**
 * @route POST /api/session-requests/start/:requestId
 * @desc Start an approved session
 * @access Private
 */
router.post('/start/:requestId', requireAuth, requestLimiter, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleErrors(res, 400, errors.array()[0].msg);
  }

  try {
    const { requestId } = req.params;
    const tutorId = req.user._id;

    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      tutor: tutorId,
      status: 'approved',
    });

    if (!sessionRequest) {
      return handleErrors(res, 404, 'Session request not found or not approved');
    }

    sessionRequest.status = 'active';
    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Send notification to requester
    const io = req.app.get('io');
    const tutorName = `${req.user.firstName} ${req.user.lastName}`;
    const notificationMessage = `${tutorName} has started your session on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`;
    await sendNotification(
      io,
      sessionRequest.requester._id,
      'session-started',
      notificationMessage,
      sessionRequest._id,
      tutorId,
      tutorName
    );

    res.json({
      message: 'Session started',
      sessionRequest,
    });
  } catch (error) {
    console.error('Error starting session:', error);
    handleErrors(res, 500, 'Failed to start session');
  }
});

/**
 * @route POST /api/session-requests/complete/:requestId
 * @desc Complete an active session
 * @access Private
 */
router.post('/complete/:requestId', requireAuth, requestLimiter, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleErrors(res, 400, errors.array()[0].msg);
  }

  try {
    const { requestId } = req.params;
    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      status: 'active',
    });

    if (!sessionRequest) {
      return handleErrors(res, 404, 'Active session not found');
    }

    if (
      sessionRequest.tutor.toString() !== req.user._id.toString() &&
      sessionRequest.requester.toString() !== req.user._id.toString()
    ) {
      return handleErrors(res, 403, 'Not authorized to complete this session');
    }

    sessionRequest.status = 'completed';
    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Determine completer and recipient
    const completer = sessionRequest.tutor._id.toString() === req.user._id.toString()
      ? sessionRequest.tutor
      : sessionRequest.requester;
    const recipient = sessionRequest.tutor._id.toString() === req.user._id.toString()
      ? sessionRequest.requester
      : sessionRequest.tutor;

    // Send notification to recipient
    const io = req.app.get('io');
    const notificationMessage = `${completer.firstName} ${completer.lastName} has completed the session on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`;
    await sendNotification(
      io,
      recipient._id,
      'session-completed',
      notificationMessage,
      sessionRequest._id,
      req.user._id,
      `${completer.firstName} ${completer.lastName}`
    );

    res.json({
      message: 'Session marked as completed',
      sessionRequest,
    });
  } catch (error) {
    console.error('Error completing session:', error);
    handleErrors(res, 500, 'Failed to complete session');
  }
});

/**
 * @route POST /api/session-requests/cancel/:requestId
 * @desc Cancel an approved or active session
 * @access Private
 */
router.post('/cancel/:requestId', requireAuth, requestLimiter, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleErrors(res, 400, errors.array()[0].msg);
  }

  try {
    const { requestId } = req.params;
    const sessionRequest = await SessionRequest.findOne({
      _id: requestId,
      status: { $in: ['approved', 'active'] },
      requester: req.user._id,
    });

    if (!sessionRequest) {
      return handleErrors(res, 404, 'Session not found or not authorized');
    }

    sessionRequest.status = 'cancelled';
    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Send notification to tutor
    const io = req.app.get('io');
    const requesterName = `${req.user.firstName} ${req.user.lastName}`;
    const notificationMessage = `${requesterName} has cancelled the session on ${sessionRequest.subject}${sessionRequest.subtopic ? ` (${sessionRequest.subtopic})` : ''}.`;
    await sendNotification(
      io,
      sessionRequest.tutor._id,
      'session-cancelled',
      notificationMessage,
      sessionRequest._id,
      req.user._id,
      requesterName
    );

    res.json({
      message: 'Session cancelled',
      sessionRequest,
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    handleErrors(res, 500, 'Failed to cancel session');
  }
});

module.exports = router;
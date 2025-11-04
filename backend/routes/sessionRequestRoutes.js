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
    const { tutorId, subject, topic, message } = req.body;
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
    const notificationMessage = `${requesterName} has requested a session on ${subject} - ${topic}.`;
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
    const notificationMessage = `${tutorName} has approved your session request on ${sessionRequest.subject} - ${sessionRequest.topic}.`;
    await sendNotification(
      io,
      sessionRequest.requester._id,
      'session-approved',
      notificationMessage,
      sessionRequest._id,
      tutorId,
      tutorName
    );

    // Do NOT emit 'session-started' here. That should happen when tutor actually starts the session
    // via POST /api/session-requests/start/:requestId. Keeping flow aligned with UX: approve first, then start.

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
    const notificationMessage = `${tutorName} has rejected your session request on ${sessionRequest.subject} - ${sessionRequest.topic}.`;
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
    if (!sessionRequest.startedAt) {
      sessionRequest.startedAt = new Date();
    }
    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Send notification to requester
    const io = req.app.get('io');
    const tutorName = `${req.user.firstName} ${req.user.lastName}`;
    const notificationMessage = `${tutorName} has started your session on ${sessionRequest.subject} - ${sessionRequest.topic}.`;
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

    // Compute real duration and coin usage
    const now = new Date();
    if (!sessionRequest.startedAt) {
      // If for some reason start was not stamped, assume a minimal 1-minute session starting now
      sessionRequest.startedAt = new Date(now.getTime() - 60 * 1000);
    }
    sessionRequest.endedAt = now;
    const durationMinutes = Math.max(1, Math.round((sessionRequest.endedAt - sessionRequest.startedAt) / 60000));
    sessionRequest.duration = durationMinutes;

    // Derive coins spent from duration if not already tracked
    const perMinute = sessionRequest.coinType === 'gold' ? 1 : 1; // adjust if gold pricing differs later
    if (typeof sessionRequest.coinsSpent !== 'number' || sessionRequest.coinsSpent < 0) {
      sessionRequest.coinsSpent = durationMinutes * perMinute;
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
    const otherParty = sessionRequest.tutor._id.toString() === req.user._id.toString()
      ? sessionRequest.requester
      : sessionRequest.tutor;

    // Send notification to both parties and emit direct event for rating redirect
    const io = req.app.get('io');
    const notificationMessage = `${completer.firstName} ${completer.lastName} has completed the session on ${sessionRequest.subject} - ${sessionRequest.topic}.`;
    // Notify other party
    await sendNotification(io, otherParty._id, 'session-completed', notificationMessage, sessionRequest._id, req.user._id, `${completer.firstName} ${completer.lastName}`);
    // Notify completer as well for consistent UX
    await sendNotification(io, completer._id, 'session-completed', 'You marked the session as completed.', sessionRequest._id, req.user._id, `${completer.firstName} ${completer.lastName}`);
    // Emit direct event to both for legacy listeners
    try {
      io.to(sessionRequest.tutor._id.toString()).emit('session-completed', { sessionId: sessionRequest._id.toString() });
      io.to(sessionRequest.requester._id.toString()).emit('session-completed', { sessionId: sessionRequest._id.toString() });
    } catch {}

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
    const notificationMessage = `${requesterName} has cancelled the session on ${sessionRequest.subject} - ${sessionRequest.topic}.`;
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

/**
 * @route GET /api/session-requests/learning-history
 * @desc Get learning history (sessions where user was a student, older than 2 days)
 * @access Private
 */
router.get('/learning-history', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find completed sessions where user was the requester (student)
    const sessions = await SessionRequest.find({
      requester: userId,
      status: 'completed',
      createdAt: { $lt: twoDaysAgo }
    })
      .populate('tutor', 'firstName lastName profilePic')
      .sort({ createdAt: -1 });

    // Group sessions by date
    const groupedByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.createdAt).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      
      groupedByDate[date].push({
        id: session._id,
        type: session.sessionType, // Get actual session type
        with: `${session.tutor.firstName} ${session.tutor.lastName}`,
        when: session.createdAt,
        duration: session.duration, // Actual duration from database
        coinType: session.coinType, // silver or gold
        coinsSpent: session.coinsSpent, // Actual coins spent
        subject: session.subject,
        topic: session.topic,
        rating: session.rating,
        notes: session.message || ''
      });
    });

    // Convert to array format expected by frontend
    const historyArray = Object.keys(groupedByDate).map(date => ({
      date,
      sessions: groupedByDate[date]
    }));

    res.json(historyArray);
  } catch (error) {
    console.error('Error fetching learning history:', error);
    handleErrors(res, 500, 'Failed to fetch learning history');
  }
});

/**
 * @route GET /api/session-requests/teaching-history
 * @desc Get teaching history (sessions where user was a tutor, older than 2 days)
 * @access Private
 */
router.get('/teaching-history', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find completed sessions where user was the tutor (teacher)
    const sessions = await SessionRequest.find({
      tutor: userId,
      status: 'completed',
      createdAt: { $lt: twoDaysAgo }
    })
      .populate('requester', 'firstName lastName profilePic')
      .sort({ createdAt: -1 });

    // Group sessions by date
    const groupedByDate = {};
    sessions.forEach(session => {
      const date = new Date(session.createdAt).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      
      groupedByDate[date].push({
        id: session._id,
        type: session.sessionType || 'ONE-ON-ONE',
        with: `${(session.requester && session.requester.firstName) ? session.requester.firstName : 'Unknown'} ${session.requester && session.requester.lastName ? session.requester.lastName : ''}`.trim(),
        when: session.createdAt,
        duration: session.duration || 0,
        coinType: session.coinType || 'silver',
        coinsSpent: typeof session.coinsSpent === 'number' ? session.coinsSpent : 0,
        subject: session.subject || 'N/A',
        topic: session.topic || 'N/A',
        rating: session.rating || null,
        notes: session.message || ''
      });
    });

    // Convert to array format expected by frontend
    const historyArray = Object.keys(groupedByDate).map(date => ({
      date,
      sessions: groupedByDate[date]
    }));

    res.json(historyArray);
  } catch (error) {
    console.error('Error fetching teaching history:', error);
    handleErrors(res, 500, 'Failed to fetch teaching history');
  }
});

/**
 * @route GET /api/session-requests/all-coin-history
 * @desc Get complete coin transaction history (ALL completed sessions, no date restriction)
 * @note This is different from learning-history/teaching-history which only show sessions older than 2 days
 * @access Private
 */
router.get('/all-coin-history', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find ALL completed sessions where user was either requester or tutor
    // NO date restriction - returns complete transaction history
    const [learningSessions, teachingSessions] = await Promise.all([
      // Sessions where user was the student (spent coins)
      SessionRequest.find({
        requester: userId,
        status: 'completed'
      })
        .populate('tutor', 'firstName lastName profilePic')
        .sort({ createdAt: -1 }),
      
      // Sessions where user was the teacher (earned coins)
      SessionRequest.find({
        tutor: userId,
        status: 'completed'
      })
        .populate('requester', 'firstName lastName profilePic')
        .sort({ createdAt: -1 })
    ]);

    // Process learning sessions (spent)
    const learningHistory = learningSessions.map(session => ({
      id: session._id,
      type: 'spent',
      sessionType: session.sessionType || 'ONE-ON-ONE',
      with: `${(session.tutor && session.tutor.firstName) ? session.tutor.firstName : 'Unknown'} ${session.tutor && session.tutor.lastName ? session.tutor.lastName : ''}`.trim(),
      when: session.createdAt,
      date: new Date(session.createdAt).toISOString().split('T')[0],
      duration: session.duration || 0,
      coinType: session.coinType || 'silver',
      coinsSpent: typeof session.coinsSpent === 'number' ? session.coinsSpent : 0,
      subject: session.subject || 'N/A',
      topic: session.topic || 'N/A',
      rating: session.rating || null,
      notes: session.message || ''
    }));

    // Process teaching sessions (earned)
    const teachingHistory = teachingSessions.map(session => ({
      id: session._id,
      type: 'earned',
      sessionType: session.sessionType || 'ONE-ON-ONE',
      with: `${(session.requester && session.requester.firstName) ? session.requester.firstName : 'Unknown'} ${session.requester && session.requester.lastName ? session.requester.lastName : ''}`.trim(),
      when: session.createdAt,
      date: new Date(session.createdAt).toISOString().split('T')[0],
      duration: session.duration || 0,
      coinType: session.coinType || 'silver',
      coinsSpent: typeof session.coinsSpent === 'number' ? session.coinsSpent : 0, // earned
      subject: session.subject || 'N/A',
      topic: session.topic || 'N/A',
      rating: session.rating || null,
      notes: session.message || ''
    }));

    // Combine and sort all transactions by date
    const allTransactions = [...learningHistory, ...teachingHistory]
      .sort((a, b) => new Date(b.when) - new Date(a.when));

    res.json({
      learning: learningHistory,
      teaching: teachingHistory,
      all: allTransactions
    });
  } catch (error) {
    console.error('Error fetching complete coin history:', error);
    handleErrors(res, 500, 'Failed to fetch coin history');
  }
});

/**
 * @route GET /api/session-requests/:requestId
 * @desc Get a session request by id with populated users
 * @access Private
 */
router.get('/:requestId', requireAuth, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return handleErrors(res, 400, errors.array()[0].msg);
  try {
    const { requestId } = req.params;
    const sr = await SessionRequest.findById(requestId)
      .populate('requester', 'firstName lastName username profilePic')
      .populate('tutor', 'firstName lastName username profilePic');
    if (!sr) return handleErrors(res, 404, 'Session not found');
    // Only allow participants to view
    const requesterId = String(sr.requester && sr.requester._id ? sr.requester._id : sr.requester);
    const tutorId = String(sr.tutor && sr.tutor._id ? sr.tutor._id : sr.tutor);
    if (
      requesterId !== String(req.user._id) &&
      tutorId !== String(req.user._id)
    ) {
      return handleErrors(res, 403, 'Not authorized');
    }
    res.json(sr);
  } catch (e) {
    console.error('Fetch session by id error:', e);
    handleErrors(res, 500, 'Failed to fetch session');
  }
});

/**
 * @route POST /api/session-requests/rate/:requestId
 * @desc Submit rating and feedback for a completed session (student -> tutor)
 * @access Private
 */
router.post('/rate/:requestId', requireAuth, requestLimiter, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return handleErrors(res, 400, errors.array()[0].msg);
  }

  try {
    const { requestId } = req.params;
    const { rating, feedback } = req.body || {};

    // Validate rating
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return handleErrors(res, 400, 'Rating must be between 1 and 5');
    }

  // Find the session; allow rating if user was requester or tutor and session is completed
  const sessionRequest = await SessionRequest.findById(requestId).populate('tutor requester', 'firstName lastName username');
    if (!sessionRequest) {
      return handleErrors(res, 404, 'Session not found');
    }

    if (sessionRequest.status !== 'completed') {
      return handleErrors(res, 400, 'Only completed sessions can be rated');
    }
    // Determine role of rater and set proper fields; also maintain legacy fields for requester ratings
    const isRequester = sessionRequest.requester.toString() === req.user._id.toString();
    const isTutor = sessionRequest.tutor.toString() === req.user._id.toString();
    if (!isRequester && !isTutor) {
      return handleErrors(res, 403, 'You are not part of this session');
    }

    if (isRequester) {
      if (typeof sessionRequest.ratingByRequester === 'number' && sessionRequest.ratingByRequester >= 1) {
        return handleErrors(res, 400, 'You have already rated this session');
      }
      sessionRequest.ratingByRequester = parsedRating;
      sessionRequest.reviewByRequester = (feedback || '').toString().trim();
      sessionRequest.ratedByRequesterAt = new Date();
      // Legacy single rating fields for compatibility
      sessionRequest.rating = parsedRating;
      sessionRequest.reviewText = sessionRequest.reviewByRequester;
      sessionRequest.ratedAt = sessionRequest.ratedByRequesterAt;
    } else if (isTutor) {
      if (typeof sessionRequest.ratingByTutor === 'number' && sessionRequest.ratingByTutor >= 1) {
        return handleErrors(res, 400, 'You have already rated this session');
      }
      sessionRequest.ratingByTutor = parsedRating;
      sessionRequest.reviewByTutor = (feedback || '').toString().trim();
      sessionRequest.ratedByTutorAt = new Date();
    }

    await sessionRequest.save();

    // Update aggregates for the target user
    try {
      const targetUserId = isRequester ? sessionRequest.tutor._id : sessionRequest.requester._id;
      const target = await User.findById(targetUserId);
      if (target) {
        const oldAvg = Number(target.ratingAverage || 0);
        const oldCount = Number(target.ratingCount || 0);
        const newCount = oldCount + 1;
        const newAvg = ((oldAvg * oldCount) + parsedRating) / newCount;
        target.ratingAverage = Number(newAvg.toFixed(2));
        target.ratingCount = newCount;
        await target.save();
      }
    } catch (e) {
      console.warn('Failed to update user rating aggregates:', e && e.message);
    }

    // Notify the rated user
    const io = req.app.get('io');
    const targetUserId = isRequester ? sessionRequest.tutor._id : sessionRequest.requester._id;
    const message = `${req.user.firstName || 'A user'} rated you ${parsedRating}★`;
    await sendNotification(
      io,
      targetUserId,
      'session-rated',
      message,
      sessionRequest._id,
      req.user._id,
      `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username || 'User'
    );

    res.json({ message: 'Rating submitted successfully', rating: parsedRating, feedback: (feedback || '').toString().trim() });
  } catch (error) {
    console.error('Error rating session:', error);
    handleErrors(res, 500, 'Failed to submit rating');
  }
});

module.exports = router;
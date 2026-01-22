const express = require('express');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/requireAuth');
const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
const { sendMail } = require('../utils/sendMail');
const { getEmailTemplate } = require('../utils/dynamicEmailTemplate');

// Coin rate configuration
// If business rules change, update these in one place.
// NOTE: Bronze coins use a higher spend rate but same earn multiplier ratio.
const COIN_RATES = {
  silver: {
    spendPerMinute: 1,
    earnMultiplier: 0.75,
  },
  gold: {
    spendPerMinute: 1,
    earnMultiplier: 0.75,
  },
  bronze: {
    spendPerMinute: 4,   // learner spends 4 bronze coins per minute
    earnMultiplier: 0.75 // tutor earns 3 bronze coins per minute
  },
};

// Minimum pre-session balance requirement (10 minutes worth of coins)
const MIN_BALANCE = {
  silver: 10,
  gold: 10,
  bronze: 40,
};

// Helper to check requester balance for a given SessionRequest
async function checkRequesterBalance(sessionRequest) {
  if (!sessionRequest || !sessionRequest.requester) {
    return { ok: false, reason: 'session-or-requester-missing' };
  }

  const coinTypeKey = (sessionRequest.coinType || 'silver').toLowerCase();
  const minRequired = MIN_BALANCE[coinTypeKey] || MIN_BALANCE.silver;

  const requester = await User.findById(sessionRequest.requester).select('silverCoins goldCoins bronzeCoins');
  if (!requester) {
    return { ok: false, reason: 'requester-not-found' };
  }

  let field;
  if (coinTypeKey === 'bronze') field = 'bronzeCoins';
  else if (coinTypeKey === 'gold') field = 'goldCoins';
  else field = 'silverCoins';

  const balance = Number(requester[field] || 0);
  const hasEnough = balance >= minRequired;

  return {
    ok: true,
    coinTypeKey,
    field,
    balance,
    minRequired,
    hasEnough,
  };
}

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
    const { tutorId, subject, topic, message, coinType } = req.body;
    const requesterId = req.user._id;

    // Check if tutor exists (include email for SMTP)
    const tutor = await User.findById(tutorId).select('firstName lastName profilePic email username isAvailableForSessions role');
    if (!tutor) {
      return handleErrors(res, 404, 'Tutor not found');
    }

    // Check if tutor is available for sessions
    if (tutor.isAvailableForSessions === false) {
      return handleErrors(res, 400, 'This tutor is currently not available for session requests');
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
      coinType: (coinType || 'silver').toLowerCase(),
      status: 'pending',
    });

    await sessionRequest.save();

    // Populate user details
    await sessionRequest.populate('requester', 'firstName lastName profilePic username');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic username');

    // Send notification to tutor
    const io = req.app.get('io');
    const requesterName = `${req.user.firstName || req.user.username || 'User'} ${req.user.lastName || ''}`.trim();
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

    // Send email to tutor
    try {
      if (tutor && tutor.email) {
        const tpl = await getEmailTemplate('sessionRequested', {
          tutorName: tutor.firstName || tutor.username,
          requesterName,
          subject,
          topic
        });
        console.info('[MAIL] Preparing session request email', { to: tutor.email, requesterName, subject, topic });
        await sendMail({ to: tutor.email, subject: tpl.subject, html: tpl.html });
      } else {
        console.warn('[MAIL] Tutor email missing; skipping email', { tutorId: tutorId.toString() });
      }
    } catch (e) {
      console.error('Failed to send session request email', e);
    }

    res.status(201).json({
      message: 'Session request sent successfully',
      sessionRequest,
    });
    // No contribution on request creation to avoid multi-counts; count on completion only
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
 * @route GET /api/session-requests/expert
 * @desc Get expert session requests (sent and received)
 * @access Private
 */
router.get('/expert', requireAuth, async (req, res) => {
  try {
    const Session = require('../models/Session');
    
    // Find expert sessions where user is invited (received)
    const received = await Session.find({ 
      invitedSkillMate: req.user._id,
      sessionType: 'expert'
    })
      .populate('creator', 'firstName lastName profilePic username')
      .populate('invitedSkillMate', 'firstName lastName profilePic username')
      .sort({ createdAt: -1 });

    // Find expert sessions created by user (sent)
    const sent = await Session.find({ 
      creator: req.user._id,
      sessionType: 'expert'
    })
      .populate('creator', 'firstName lastName profilePic username')
      .populate('invitedSkillMate', 'firstName lastName profilePic username')
      .sort({ createdAt: -1 });

    res.json({ received, sent });
  } catch (error) {
    console.error('Error fetching expert session requests:', error);
    handleErrors(res, 500, 'Failed to fetch expert session requests');
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

    // Email requester about approval
    try {
      const requester = await User.findById(sessionRequest.requester._id);
      if (requester?.email) {
        const tpl = await getEmailTemplate('sessionApproved', {
          requesterName: requester.firstName || requester.username,
          tutorName,
          subject: sessionRequest.subject,
          topic: sessionRequest.topic
        });
        await sendMail({ to: requester.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send approval email', e);
    }

    // Do NOT emit 'session-started' here. That should happen when tutor actually starts the session
    // via POST /api/session-requests/start/:requestId. Keeping flow aligned with UX: approve first, then start.

    res.json({
      message: 'Session request approved',
      sessionRequest,
    });
    // No contribution on approve to avoid multi-counts
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

    // Email requester about rejection
    try {
      const requester = await User.findById(sessionRequest.requester._id);
      if (requester?.email) {
        const tpl = await getEmailTemplate('sessionRejected', {
          requesterName: requester.firstName || requester.username,
          tutorName,
          subject: sessionRequest.subject,
          topic: sessionRequest.topic
        });
        await sendMail({ to: requester.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send rejection email', e);
    }

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

    // Backend safeguard: ensure requester has at least 10 minutes worth of selected coins
    try {
      const balanceCheck = await checkRequesterBalance(sessionRequest);
      if (!balanceCheck.ok) {
        return handleErrors(res, 400, 'Unable to validate coin balance for this session');
      }
      if (!balanceCheck.hasEnough) {
        const prettyType = balanceCheck.coinTypeKey.charAt(0).toUpperCase() + balanceCheck.coinTypeKey.slice(1);
        return handleErrors(
          res,
          400,
          `Insufficient ${prettyType} balance to join session`
        );
      }
    } catch (e) {
      console.error('Error validating balance before start:', e);
      return handleErrors(res, 500, 'Failed to validate coin balance before starting the session');
    }

    sessionRequest.status = 'active';
    // Note: startedAt is now set in socket.js when both users join the video call
    // This ensures accurate duration tracking based on actual call time, not acceptance time
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
    // No contribution on start to avoid multi-counts; count on completion only
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
    
    // Compute real duration and coin usage BEFORE modifying the session
    const now = new Date();
    let durationMinutes;

    // Prefer client-provided duration (from VideoCall) when available
    const rawDuration = req.body && req.body.durationMinutes;
    const parsedDuration = Number(rawDuration);

    console.log('[DURATION DEBUG]', {
      rawDuration,
      parsedDuration,
      isFinite: Number.isFinite(parsedDuration),
      requestBody: req.body,
    });

    // First, atomically transition from 'active' to 'completed' to prevent race conditions
    const sessionRequest = await SessionRequest.findOneAndUpdate(
      { _id: requestId, status: 'active' },
      { status: 'completed' },
      { new: false } // Return the OLD document so we can work with active state
    );

    if (!sessionRequest) {
      // Either session doesn't exist or already completed
      const existing = await SessionRequest.findById(requestId);
      if (existing && existing.status === 'completed') {
        console.log('[SESSION COMPLETE] Session already completed, skipping duplicate call:', requestId);
        await existing.populate('requester', 'firstName lastName profilePic username');
        await existing.populate('tutor', 'firstName lastName profilePic username');
        return res.status(200).json({
          message: 'Session already completed',
          sessionRequest: existing,
        });
      }
      return handleErrors(res, 404, 'Active session not found');
    }

    if (
      sessionRequest.tutor.toString() !== req.user._id.toString() &&
      sessionRequest.requester.toString() !== req.user._id.toString()
    ) {
      return handleErrors(res, 403, 'Not authorized to complete this session');
    }

    // Now compute duration and coins (we own the transition to 'completed')

    if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
      durationMinutes = Math.max(1, Math.floor(parsedDuration));
      sessionRequest.endedAt = now;
      // Backfill startedAt for logging / analytics if missing
      if (!sessionRequest.startedAt) {
        sessionRequest.startedAt = new Date(now.getTime() - durationMinutes * 60000);
      }
      console.log('[DURATION] Using client-provided:', durationMinutes, 'minutes');
    } else {
      if (!sessionRequest.startedAt) {
        // If for some reason start was not stamped, assume a minimal 1-minute session starting now
        console.warn('[SESSION COMPLETE] No startedAt timestamp found for session', requestId, '- using 1 minute fallback');
        sessionRequest.startedAt = new Date(now.getTime() - 60 * 1000);
      }
      sessionRequest.endedAt = now;
      durationMinutes = Math.max(1, Math.floor((sessionRequest.endedAt - sessionRequest.startedAt) / 60000));
      console.log('[DURATION] Falling back to timestamp-based:', durationMinutes, 'minutes from', Math.floor((sessionRequest.endedAt - sessionRequest.startedAt) / 1000), 'seconds');
    }

    sessionRequest.duration = durationMinutes;

    console.log('[SESSION COMPLETE]', {
      sessionId: requestId,
      startedAt: sessionRequest.startedAt,
      endedAt: sessionRequest.endedAt,
      durationSeconds: Math.floor((sessionRequest.endedAt - sessionRequest.startedAt) / 1000),
      durationMinutes,
      coinType: sessionRequest.coinType,
    });

    // Derive coins spent/earned purely from duration (ignore any stale coinsSpent defaults)
    const coinTypeKey = (sessionRequest.coinType || 'silver').toLowerCase();
    const spendPerMinute = (COIN_RATES[coinTypeKey] || COIN_RATES.silver).spendPerMinute;
    const earnMultiplier = (COIN_RATES[coinTypeKey] || COIN_RATES.silver).earnMultiplier;

    sessionRequest.coinsSpent = durationMinutes * spendPerMinute;

    const coinsSpentFinal = Number(sessionRequest.coinsSpent || 0);
    const coinsEarnedFinal = Number((coinsSpentFinal * earnMultiplier).toFixed(2));

    console.log('[COIN CALCULATION]', {
      coinTypeKey,
      spendPerMinute,
      earnMultiplier,
      coinsSpentFinal,
      coinsEarnedFinal,
    });

    // Persist summary fields for audit/history
    sessionRequest.coinTypeUsed = coinTypeKey;
    sessionRequest.coinsDeducted = coinsSpentFinal;
    sessionRequest.coinsCredited = coinsEarnedFinal;
    
    // Status was already set to 'completed' atomically above
    await sessionRequest.save();

    // Atomic-ish coin settlement at session end (single pass; no per-minute updates)
    const requesterId = sessionRequest.requester;
    const tutorId = sessionRequest.tutor;
    const io = req.app.get('io');

    try {
      let debitField;
      if (coinTypeKey === 'bronze') debitField = 'bronzeCoins';
      else if (coinTypeKey === 'gold') debitField = 'goldCoins';
      else debitField = 'silverCoins';

      const debitAmount = coinsSpentFinal > 0 ? coinsSpentFinal : 0;
      const creditAmount = coinsEarnedFinal > 0 ? coinsEarnedFinal : 0;

      let updatedRequester = null;
      let updatedTutor = null;

      if (debitAmount > 0 && requesterId) {
        const beforeRequester = await User.findById(requesterId).select('silverCoins goldCoins bronzeCoins');
        
        const filter = { _id: requesterId };
        filter[debitField] = { $gte: debitAmount };

        updatedRequester = await User.findOneAndUpdate(
          filter,
          { $inc: { [debitField]: -debitAmount } },
          { new: true }
        );

        if (!updatedRequester) {
          console.error('[Coins] Failed to debit coins from requester due to insufficient balance or missing user.', {
            requesterId: String(requesterId),
            debitField,
            debitAmount,
          });
        } else {
          console.log('[STUDENT DEBIT]', {
            before: beforeRequester[debitField],
            debitAmount,
            after: updatedRequester[debitField],
          });
        }
      }

      if (creditAmount > 0 && tutorId) {
        const beforeTutor = await User.findById(tutorId).select('silverCoins goldCoins bronzeCoins');
        
        updatedTutor = await User.findByIdAndUpdate(
          tutorId,
          { $inc: { [debitField]: creditAmount } },
          { new: true }
        );
        
        console.log('[TUTOR CREDIT]', {
          before: beforeTutor[debitField],
          creditAmount,
          after: updatedTutor[debitField],
        });
      }

      // Emit realtime coin updates to both parties for UI refresh
      try {
        if (io) {
          if (updatedRequester) {
            io.to(String(requesterId)).emit('coin-update', {
              silverCoins: updatedRequester.silverCoins || 0,
              goldCoins: updatedRequester.goldCoins || 0,
              bronzeCoins: updatedRequester.bronzeCoins || 0,
            });
          }
          if (updatedTutor) {
            io.to(String(tutorId)).emit('coin-update', {
              silverCoins: updatedTutor.silverCoins || 0,
              goldCoins: updatedTutor.goldCoins || 0,
              bronzeCoins: updatedTutor.bronzeCoins || 0,
            });
          }
        }
      } catch (e) {
        console.warn('[Coins] Non-fatal: failed to emit coin-update after settlement:', e && e.message);
      }
    } catch (e) {
      console.error('[Coins] Error during final coin settlement:', e);
    }

    // Populate user details

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
    const notificationMessage = `${completer.firstName} ${completer.lastName} has completed the session on ${sessionRequest.subject} - ${sessionRequest.topic}.`;
    // Notify other party
    try {
      await sendNotification(
        io,
        otherParty._id,
        'session-completed',
        notificationMessage,
        sessionRequest._id,
        req.user._id,
        `${completer.firstName} ${completer.lastName}`
      );
    } catch (e) {
      console.warn('Non-fatal: failed to send other party completion notification:', e && e.message);
    }
    // Notify completer as well for consistent UX
    try {
      await sendNotification(
        io,
        completer._id,
        'session-completed',
        'You marked the session as completed.',
        sessionRequest._id,
        req.user._id,
        `${completer.firstName} ${completer.lastName}`
      );
    } catch (e) {
      console.warn('Non-fatal: failed to send completer completion notification:', e && e.message);
    }
    // Emit direct event to both for legacy listeners
    try {
      io.to(sessionRequest.tutor._id.toString()).emit('session-completed', { sessionId: sessionRequest._id.toString() });
      io.to(sessionRequest.requester._id.toString()).emit('session-completed', { sessionId: sessionRequest._id.toString() });
    } catch {}

    // Contributions: on completion, idempotent single increment for both users
    try {
      const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
      await Promise.all([
        trackActivity({
          userId: sessionRequest.tutor._id,
          activityType: ACTIVITY_TYPES.SESSION_COMPLETED_TUTOR,
          activityId: sessionRequest._id.toString(),
          io
        }),
        trackActivity({
          userId: sessionRequest.requester._id,
          activityType: ACTIVITY_TYPES.SESSION_COMPLETED_LEARNER,
          activityId: sessionRequest._id.toString(),
          io
        })
      ]);
    } catch (_) {}

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

    // Find completed sessions where user was the requester (student)
    const sessions = await SessionRequest.find({
      requester: userId,
      status: 'completed'
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

      const tutorFirst = session.tutor && session.tutor.firstName ? session.tutor.firstName : 'Unknown';
      const tutorLast = session.tutor && session.tutor.lastName ? session.tutor.lastName : '';

      // Recompute coinsSpent from duration to handle old static values
      const duration = typeof session.duration === 'number' ? session.duration : 0;
      const cType = (session.coinType || 'silver').toLowerCase();
      const spendRate = (COIN_RATES[cType] || COIN_RATES.silver).spendPerMinute;
      const computedSpent = duration * spendRate;
      const coinsSpent = computedSpent > 0 ? computedSpent : (typeof session.coinsSpent === 'number' ? session.coinsSpent : 0);

      groupedByDate[date].push({
        id: session._id,
        type: session.sessionType || 'ONE-ON-ONE',
        with: `${tutorFirst} ${tutorLast}`.trim(),
        when: session.createdAt,
        duration,
        coinType: session.coinType || 'silver',
        coinsSpent,
        subject: session.subject || 'N/A',
        topic: session.topic || 'N/A',
        rating: typeof session.rating === 'number' ? session.rating : null,
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

    // Find completed sessions where user was the tutor (teacher)
    const sessions = await SessionRequest.find({
      tutor: userId,
      status: 'completed'
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
      const cType = (session.coinType || 'silver').toLowerCase();
      const spendRate = (COIN_RATES[cType] || COIN_RATES.silver).spendPerMinute;
      const earnMultiplier = (COIN_RATES[cType] || COIN_RATES.silver).earnMultiplier;
      
      // Recompute from duration to handle old static values
      const duration = session.duration || 0;
      const computedSpent = duration * spendRate;
      const baseSpent = computedSpent > 0 ? computedSpent : (typeof session.coinsSpent === 'number' ? session.coinsSpent : 0);
      const computedEarned = Math.round(baseSpent * earnMultiplier);
      
      groupedByDate[date].push({
        id: session._id,
        type: session.sessionType || 'ONE-ON-ONE',
        with: `${(session.requester && session.requester.firstName) ? session.requester.firstName : 'Unknown'} ${session.requester && session.requester.lastName ? session.requester.lastName : ''}`.trim(),
        when: session.createdAt,
        duration,
        coinType: session.coinType || 'silver',
        coinsSpent: baseSpent, // kept for backward compatibility
        coinsEarned: computedEarned,
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
    const learningHistory = learningSessions.map(session => {
      const duration = session.duration || 0;
      const cType = (session.coinType || 'silver').toLowerCase();
      const spendRate = (COIN_RATES[cType] || COIN_RATES.silver).spendPerMinute;
      const computedSpent = duration * spendRate;
      const coinsSpent = computedSpent > 0 ? computedSpent : (typeof session.coinsSpent === 'number' ? session.coinsSpent : 0);
      
      return ({
        id: session._id,
        type: 'spent',
        sessionType: session.sessionType || 'ONE-ON-ONE',
        with: `${(session.tutor && session.tutor.firstName) ? session.tutor.firstName : 'Unknown'} ${session.tutor && session.tutor.lastName ? session.tutor.lastName : ''}`.trim(),
        when: session.createdAt,
        date: new Date(session.createdAt).toISOString().split('T')[0],
        duration,
        coinType: session.coinType || 'silver',
        coinsSpent,
        subject: session.subject || 'N/A',
        topic: session.topic || 'N/A',
        rating: session.rating || null,
        notes: session.message || ''
      });
    });

    // Process teaching sessions (earned)
    const teachingHistory = teachingSessions.map(session => {
      const duration = session.duration || 0;
      const cType = (session.coinType || 'silver').toLowerCase();
      const spendRate = (COIN_RATES[cType] || COIN_RATES.silver).spendPerMinute;
      const earnMultiplier = (COIN_RATES[cType] || COIN_RATES.silver).earnMultiplier;
      
      // Recompute from duration to handle old static values
      const computedSpent = duration * spendRate;
      const baseSpent = computedSpent > 0 ? computedSpent : (typeof session.coinsSpent === 'number' ? session.coinsSpent : 0);
      const coinsEarned = Math.round(baseSpent * earnMultiplier);
      
      return ({
        id: session._id,
        type: 'earned',
        sessionType: session.sessionType || 'ONE-ON-ONE',
        with: `${(session.requester && session.requester.firstName) ? session.requester.firstName : 'Unknown'} ${session.requester && session.requester.lastName ? session.requester.lastName : ''}`.trim(),
        when: session.createdAt,
        date: new Date(session.createdAt).toISOString().split('T')[0],
        duration,
        coinType: session.coinType || 'silver',
        coinsSpent: baseSpent, // spent by student (legacy)
        coinsEarned,
        subject: session.subject || 'N/A',
        topic: session.topic || 'N/A',
        rating: session.rating || null,
        notes: session.message || ''
      });
    });

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
 * @route GET /api/session-requests/validate-join/:requestId
 * @desc Validate that the requester has enough coins to start/join the session
 * @access Private
 */
router.get('/validate-join/:requestId', requireAuth, validateRequestId, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return handleErrors(res, 400, errors.array()[0].msg);

  try {
    const { requestId } = req.params;
    const sr = await SessionRequest.findById(requestId)
      .select('requester tutor coinType');
    if (!sr) return handleErrors(res, 404, 'Session not found');

    const requesterId = String(sr.requester);
    const tutorId = String(sr.tutor);
    const currentUserId = String(req.user._id);

    // Only participants may query validation
    if (requesterId !== currentUserId && tutorId !== currentUserId) {
      return handleErrors(res, 403, 'Not authorized');
    }

    const balanceCheck = await checkRequesterBalance(sr);
    if (!balanceCheck.ok) {
      return handleErrors(res, 400, 'Unable to validate coin balance for this session');
    }

    res.json({
      coinType: balanceCheck.coinTypeKey,
      availableBalance: balanceCheck.balance,
      minRequired: balanceCheck.minRequired,
      hasEnough: balanceCheck.hasEnough,
    });
  } catch (e) {
    console.error('validate-join error:', e);
    handleErrors(res, 500, 'Failed to validate coin balance');
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
  // Normalize IDs to strings (supports populated docs or raw ObjectIds)
  const requesterId = String(sessionRequest.requester && sessionRequest.requester._id ? sessionRequest.requester._id : sessionRequest.requester);
  const tutorId = String(sessionRequest.tutor && sessionRequest.tutor._id ? sessionRequest.tutor._id : sessionRequest.tutor);
  const currentUserId = String(req.user._id);
  const isRequester = requesterId === currentUserId;
  const isTutor = tutorId === currentUserId;
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
    try {
      await sendNotification(
        io,
        targetUserId,
        'session-rated',
        message,
        sessionRequest._id,
        req.user._id,
        `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username || 'User'
      );
    } catch (e) {
      console.warn('Non-fatal: failed to send rating notification:', e && e.message);
    }

    res.json({ message: 'Rating submitted successfully', rating: parsedRating, feedback: (feedback || '').toString().trim() });

    // No contribution on rating to avoid multi-count inflation; completion already counted
  } catch (error) {
    console.error('Error rating session:', error);
    handleErrors(res, 500, 'Failed to submit rating');
  }
});

module.exports = router;
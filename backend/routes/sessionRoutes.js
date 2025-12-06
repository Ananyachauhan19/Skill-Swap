// routes/sessionRoutes.js
const express = require('express');
const Session = require('../models/Session');
const SessionRequest = require('../models/SessionRequest');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const tutorCtrl = require('../controllers/tutorController');
const { sendMail } = require('../utils/sendMail');
const T = require('../utils/emailTemplates');

router.get('/search', async (req, res) => {
  try {
    const { subject, topic } = req.query;

    const filter = {
      status: 'pending',
    };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;

    const sessions = await Session.find(filter)
      .populate('creator', 'firstName lastName') // This replaces the ObjectId with the user object { _id, name }
      .exec();


    res.json(sessions);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Failed to search sessions' });
  }
});

// Create a session
router.post('/', requireAuth, tutorCtrl.ensureTutorActivation, tutorCtrl.requireActiveTutor, async (req, res) => {
  try {
    console.log('Session creation - req.user:', req.user); // Debug log
    const { subject, topic, description, date, time } = req.body;
    const session = await Session.create({
      subject, topic, description, date, time,
      creator: req.user._id
    });
    
    // Track session creation contribution
    try {
      const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
      const io = req.app.get('io');
      await trackActivity({
        userId: req.user._id,
        activityType: ACTIVITY_TYPES.SESSION_CREATED,
        activityId: session._id.toString(),
        io
      });
    } catch (_) {}
    
    // Email SkillMates: if requester is a skillmate of creator, notify
    try {
      const creator = await User.findById(req.user._id).select('skillMates firstName lastName email username');
      if (creator && Array.isArray(creator.skillMates) && creator.skillMates.length > 0) {
        const mates = await User.find({ _id: { $in: creator.skillMates } }).select('email firstName username');
        for (const m of mates) {
          if (m.email) {
            const tpl = T.skillmateSessionCreated({
              mateName: m.firstName || m.username,
              creatorName: creator.firstName || creator.username,
              subject,
              topic
            });
            await sendMail({ to: m.email, subject: tpl.subject, html: tpl.html });
          }
        }
      }
    } catch (e) {
      console.error('Failed to send skillmate session email', e);
    }
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error creating session', error: err.message });
  }
});

// Get all sessions (search by subject/topic)
router.get('/', async (req, res) => {
  const { search } = req.query;
  const query = search ? {
    $or: [
      { subject: { $regex: search, $options: 'i' } },
      { topic: { $regex: search, $options: 'i' } }
    ]
  } : {};
  const sessions = await Session.find(query).populate('creator', 'name email');
  res.json(sessions);
});

// GET /sessions/mine – get sessions created by logged-in user
// GET /api/sessions/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    // Get sessions created by the user
    let createdSessions = await Session.find({ creator: req.user._id })
      .populate('creator', 'firstName lastName')
      .populate('requester', 'firstName lastName')
      .sort({ date: -1, time: -1 });

    // Get sessions where the user is the requester
    let requestedSessions = await Session.find({ requester: req.user._id })
      .populate('creator', 'firstName lastName')
      .populate('requester', 'firstName lastName')
      .sort({ date: -1, time: -1 });

    // Combine both arrays
    let allSessions = [...createdSessions, ...requestedSessions];

    // Remove duplicates (in case user is both creator and requester)
    const uniqueSessions = allSessions.filter((session, index, self) =>
      index === self.findIndex(s => s._id.toString() === session._id.toString())
    );

    const now = new Date();

    // Update status if needed
    const updatedSessions = await Promise.all(
      uniqueSessions.map(async (session) => {
        const sessionDateTime = new Date(`${session.date}T${session.time}`);

        if (session.status === 'pending' && sessionDateTime < now) {
          session.status = 'completed';
          await session.save(); // Save updated status
        }

        return session;
      })
    );

    res.json(updatedSessions);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

// PUT /api/sessions/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!session) return res.status(404).json({ error: 'Session not found or not yours' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a session (only creator can delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the creator can delete this session' });
    }
    await session.deleteOne();
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Request session (no tutor requirement; learners can request)
router.post('/request/:id', requireAuth, tutorCtrl.ensureTutorActivation, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('creator', 'firstName lastName socketId')
      .populate('requester', 'firstName lastName');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.status = 'requested';
    session.requester = req.user ? req.user._id : req.body.userId;
    await session.save();

    const io = req.app.get('io');

    if (session.creator?.socketId) {
      io.to(session.creator.socketId).emit('session-requested', session);
    }

    res.json({ message: 'Request sent', session });

    // No contribution here; counted once on completion in sessionRequestRoutes
  } catch (error) {
    console.error('Session request error:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Approve
router.post('/:id/approve', requireAuth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('requester');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is the creator
    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the session creator can approve sessions' });
    }

    session.status = 'approved';
    await session.save();

    const io = req.app.get('io');
    if (session.requester && session.requester.socketId) {
      io.to(session.requester.socketId).emit('session-approved', session);
    }
    // Email requester
    try {
      if (session.requester?.email) {
        const tpl = T.sessionApproved({
          requesterName: session.requester.firstName || session.requester.username,
          tutorName: req.user.firstName || req.user.username,
          subject: session.subject,
          topic: session.topic
        });
        await sendMail({ to: session.requester.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send session approval email', e);
    }
    res.json(session);
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve session' });
  }
});

// Reject
router.post('/:id/reject', requireAuth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('requester');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is the creator
    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the session creator can reject sessions' });
    }

    session.status = 'rejected';
    await session.save();

    const io = req.app.get('io');
    if (session.requester && session.requester.socketId) {
      io.to(session.requester.socketId).emit('session-rejected', session);
    }
    // Email requester
    try {
      if (session.requester?.email) {
        const tpl = T.sessionRejected({
          requesterName: session.requester.firstName || session.requester.username,
          tutorName: req.user.firstName || req.user.username,
          subject: session.subject,
          topic: session.topic
        });
        await sendMail({ to: session.requester.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send session rejection email', e);
    }
    res.json(session);
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject session' });
  }
});

// Start session (creator must be active tutor)
router.post('/:id/start', requireAuth, tutorCtrl.ensureTutorActivation, tutorCtrl.requireActiveTutor, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('creator', 'firstName lastName socketId')
      .populate('requester', 'firstName lastName socketId');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is the creator
    if (session.creator._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the session creator can start the session' });
    }

    // Check if session is approved
    if (session.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved sessions can be started' });
    }

    // Update session status to 'active'
    session.status = 'active';
    await session.save();

    // Notify the approved user (requester)
    const io = req.app.get('io');
    if (session.requester && session.requester.socketId) {
      io.to(session.requester.socketId).emit('session-started', {
        sessionId: session._id,
        creator: session.creator,
        subject: session.subject,
        topic: session.topic,
        message: 'Your session has started! Click Join to start the video call or Cancel to decline.'
      });
    }

    res.json({
      message: 'Session started successfully',
      session: session
    });

    // No contribution here; counted once on completion in sessionRequestRoutes
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Cancel session (for requester)
router.post('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('creator', 'firstName lastName socketId')
      .populate('requester', 'firstName lastName socketId');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is the requester
    if (!session.requester || session.requester._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the session requester can cancel the session' });
    }

    // Check if session is approved or active
    if (session.status !== 'approved' && session.status !== 'active') {
      return res.status(400).json({ error: 'Only approved or active sessions can be cancelled' });
    }

    // Update session status to 'cancelled'
    session.status = 'cancelled';
    await session.save();

    // Notify the creator
    const io = req.app.get('io');
    if (session.creator && session.creator.socketId) {
      io.to(session.creator.socketId).emit('session-cancelled', {
        sessionId: session._id,
        message: 'The requester has cancelled the session.'
      });
    }

    res.json({
      message: 'Session cancelled successfully',
      session: session
    });
  } catch (error) {
    console.error('Cancel session error:', error);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

// GET /api/sessions/top-performers – compute from SessionRequest collection (OPTIMIZED)
router.get('/top-performers', async (req, res) => {
  try {
    // Get limit from query parameter, default to 3
    const limit = parseInt(req.query.limit) || 3;
    
    // Only consider completed sessions for metrics
    const completedMatch = { status: 'completed' };

    // Run all aggregations in parallel for better performance
    const [topRatedAgg, mostActiveAgg, topEarnerAgg, allStarsAgg] = await Promise.all([
      // Top Rated Tutors with $lookup to fetch user data in one query
      SessionRequest.aggregate([
        { $match: { ...completedMatch, rating: { $ne: null } } },
        { $group: { _id: '$tutor', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        { $sort: { avgRating: -1, count: -1 } },
        { $limit: limit },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $project: {
            _id: '$userInfo._id',
            firstName: '$userInfo.firstName',
            lastName: '$userInfo.lastName',
            username: '$userInfo.username',
            profilePic: '$userInfo.profilePic',
            role: '$userInfo.role',
            avgRating: 1,
            count: 1
          }
        }
      ]),
      
      // Most Active Learners with $lookup
      SessionRequest.aggregate([
        { $match: completedMatch },
        { $group: { _id: '$requester', sessionCount: { $sum: 1 } } },
        { $sort: { sessionCount: -1 } },
        { $limit: limit },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $project: {
            _id: '$userInfo._id',
            firstName: '$userInfo.firstName',
            lastName: '$userInfo.lastName',
            username: '$userInfo.username',
            profilePic: '$userInfo.profilePic',
            role: '$userInfo.role',
            sessionCount: 1
          }
        }
      ]),
      
      // Top Earners with $lookup
      SessionRequest.aggregate([
        { $match: completedMatch },
        { $group: { _id: { tutor: '$tutor', coinType: '$coinType' }, coins: { $sum: { $ifNull: ['$coinsSpent', 0] } } } },
        { $group: { _id: '$_id.tutor', coinsBreakdown: { $push: { coinType: '$_id.coinType', coins: '$coins' } }, totalEarnings: { $sum: '$coins' } } },
        { $sort: { totalEarnings: -1 } },
        { $limit: limit },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $project: {
            _id: '$userInfo._id',
            firstName: '$userInfo.firstName',
            lastName: '$userInfo.lastName',
            username: '$userInfo.username',
            profilePic: '$userInfo.profilePic',
            role: '$userInfo.role',
            coinsBreakdown: 1,
            totalEarnings: 1
          }
        }
      ]),
      
      // All Stars - Optimized with $lookup and filter only learner/both roles
      SessionRequest.aggregate([
        { $match: completedMatch },
        { $group: { 
            _id: '$requester',
            sessionCount: { $sum: 1 },
            tutors: { $addToSet: '$tutor' },
            ratings: { $push: '$ratingByTutor' }
          } 
        },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
        { $unwind: '$userInfo' },
        { $match: { 'userInfo.role': { $in: ['learner', 'both'] } } },
        { $project: {
            _id: '$userInfo._id',
            firstName: '$userInfo.firstName',
            lastName: '$userInfo.lastName',
            username: '$userInfo.username',
            profilePic: '$userInfo.profilePic',
            role: '$userInfo.role',
            sessionCount: 1,
            tutors: 1,
            ratings: 1
          }
        }
      ])
    ]);

    // Format Top Rated results
    const topRated = topRatedAgg.map(doc => ({
      _id: doc._id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      username: doc.username,
      profilePic: doc.profilePic,
      role: doc.role,
      rating: Number(doc.avgRating.toFixed(1)),
      ratingCount: doc.count,
    }));

    // Format Most Active results
    const mostActive = mostActiveAgg.map(doc => ({
      _id: doc._id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      username: doc.username,
      profilePic: doc.profilePic,
      role: doc.role,
      sessionCount: doc.sessionCount,
    }));

    // Format Top Earners results
    const topEarners = topEarnerAgg.map(doc => {
      const silverEntry = doc.coinsBreakdown.find(c => c.coinType === 'silver');
      const goldEntry = doc.coinsBreakdown.find(c => c.coinType === 'gold');
      return {
        _id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        username: doc.username,
        profilePic: doc.profilePic,
        role: doc.role,
        silverEarnings: silverEntry ? silverEntry.coins : 0,
        goldEarnings: goldEntry ? goldEntry.coins : 0,
        totalEarnings: doc.totalEarnings,
      };
    });

    // Process All Stars with composite scoring
    const learnerPerf = allStarsAgg.map(doc => {
      const validRatings = (doc.ratings || []).filter(r => r !== null && r !== undefined);
      const avgTutorRating = validRatings.length ? (validRatings.reduce((a,b)=>a+b,0) / validRatings.length) : 0;
      return {
        _id: doc._id,
        firstName: doc.firstName,
        lastName: doc.lastName,
        username: doc.username,
        profilePic: doc.profilePic,
        role: doc.role,
        sessionCount: doc.sessionCount,
        avgTutorRating: Number(avgTutorRating.toFixed(1)),
        distinctTutorsCount: (doc.tutors || []).length
      };
    });

    // Calculate composite scores and rank
    if (learnerPerf.length > 0) {
      const maxSessions = Math.max(...learnerPerf.map(l => l.sessionCount), 1);
      const maxDistinctTutors = Math.max(...learnerPerf.map(l => l.distinctTutorsCount), 1);

      const rankedLearners = learnerPerf.map(l => ({
        ...l,
        compositeScore: (
          (l.sessionCount / maxSessions) * 0.4 +
          (l.avgTutorRating / 5) * 0.4 +
          (l.distinctTutorsCount / maxDistinctTutors) * 0.2
        )
      })).sort((a,b) => b.compositeScore - a.compositeScore).slice(0, limit);

      var allStars = rankedLearners.map(({ compositeScore, ...rest }) => rest);
    } else {
      var allStars = [];
    }

    return res.json({
      allStars,
      mostActive,
      topRated,
      topEarners
    });
  } catch (err) {
    console.error('top-performers error:', err);
    res.status(500).json({ error: 'Failed to compute top performers' });
  }
});

module.exports = router;

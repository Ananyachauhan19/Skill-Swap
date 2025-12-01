// routes/sessionRoutes.js
const express = require('express');
const Session = require('../models/Session');
const SessionRequest = require('../models/SessionRequest');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const tutorCtrl = require('../controllers/tutorController');

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
    res.status(201).json(session);

    // No contribution on create; count once per activity elsewhere
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

// GET /api/sessions/top-performers – compute from SessionRequest collection
router.get('/top-performers', async (req, res) => {
  try {
    // Only consider completed sessions for metrics
    const completedMatch = { status: 'completed' };

    // Top Rated Tutors (legacy single rating field) - Top 3
    const topRatedAgg = await SessionRequest.aggregate([
      { $match: { ...completedMatch, rating: { $ne: null } } },
      { $group: { _id: '$tutor', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      { $sort: { avgRating: -1, count: -1 } },
      { $limit: 3 },
    ]);

    const topRated = await Promise.all(
      topRatedAgg.map(async (doc) => {
        const user = await User.findById(doc._id).select('firstName lastName username profilePic role');
        if (user) {
          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            profilePic: user.profilePic,
            role: user.role,
            rating: Number(doc.avgRating.toFixed(1)),
            ratingCount: doc.count,
          };
        }
        return null;
      })
    ).then(results => results.filter(Boolean));

    // Most Active Learners (by count of completed requests as requester) - Top 3
    const mostActiveAgg = await SessionRequest.aggregate([
      { $match: completedMatch },
      { $group: { _id: '$requester', sessionCount: { $sum: 1 } } },
      { $sort: { sessionCount: -1 } },
      { $limit: 3 },
    ]);

    const mostActive = await Promise.all(
      mostActiveAgg.map(async (doc) => {
        const user = await User.findById(doc._id).select('firstName lastName username profilePic role');
        if (user) {
          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            profilePic: user.profilePic,
            role: user.role,
            sessionCount: doc.sessionCount,
          };
        }
        return null;
      })
    ).then(results => results.filter(Boolean));

    // Top Earners (separate silver / gold coins earned by tutors from completed sessions) - Top 3
    const topEarnerAgg = await SessionRequest.aggregate([
      { $match: completedMatch },
      { $group: { _id: { tutor: '$tutor', coinType: '$coinType' }, coins: { $sum: { $ifNull: ['$coinsSpent', 0] } } } },
      { $group: { _id: '$_id.tutor', coinsBreakdown: { $push: { coinType: '$_id.coinType', coins: '$coins' } }, totalEarnings: { $sum: '$coins' } } },
      { $sort: { totalEarnings: -1 } },
      { $limit: 3 }
    ]);

    const topEarners = await Promise.all(
      topEarnerAgg.map(async (doc) => {
        const user = await User.findById(doc._id).select('firstName lastName username profilePic role');
        if (user) {
          const silverEntry = doc.coinsBreakdown.find(c => c.coinType === 'silver');
          const goldEntry = doc.coinsBreakdown.find(c => c.coinType === 'gold');
          const silverEarnings = silverEntry ? silverEntry.coins : 0;
          const goldEarnings = goldEntry ? goldEntry.coins : 0;
          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            profilePic: user.profilePic,
            role: user.role,
            silverEarnings,
            goldEarnings,
            totalEarnings: silverEarnings + goldEarnings,
          };
        }
        return null;
      })
    ).then(results => results.filter(Boolean));

    // All Stars – overall active learners (exclude pure tutors) based on combined engagement
    // Metrics: sessionCount, avgTutorRating (ratingByTutor), distinctTutorsCount
    const allStarsAgg = await SessionRequest.aggregate([
      { $match: completedMatch },
      { $group: { 
          _id: '$requester',
          sessionCount: { $sum: 1 },
          tutors: { $addToSet: '$tutor' },
          ratings: { $push: '$ratingByTutor' }
        } 
      }
    ]);

    // Build learner performance list
    const learnerPerf = [];
    for (const doc of allStarsAgg) {
      const user = await User.findById(doc._id).select('firstName lastName username profilePic role');
      if (!user) continue;
      if (!(user.role === 'learner' || user.role === 'both')) continue; // only learners / both
      const validRatings = (doc.ratings || []).filter(r => r !== null && r !== undefined);
      const avgTutorRating = validRatings.length ? (validRatings.reduce((a,b)=>a+b,0) / validRatings.length) : 0;
      const distinctTutorsCount = (doc.tutors || []).length;
      learnerPerf.push({
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profilePic: user.profilePic,
        role: user.role,
        sessionCount: doc.sessionCount,
        avgTutorRating: Number(avgTutorRating.toFixed(1)),
        distinctTutorsCount
      });
    }

    // Normalization for composite ranking (not returned visibly)
    const maxSessions = Math.max(...learnerPerf.map(l => l.sessionCount), 1);
    const maxDistinctTutors = Math.max(...learnerPerf.map(l => l.distinctTutorsCount), 1);

    const rankedLearners = learnerPerf.map(l => ({
      ...l,
      compositeScore: (
        (l.sessionCount / maxSessions) * 0.4 +
        (l.avgTutorRating / 5) * 0.4 +
        (l.distinctTutorsCount / maxDistinctTutors) * 0.2
      )
    })).sort((a,b) => b.compositeScore - a.compositeScore).slice(0,3);

    // Hide composite score number for All Stars in response (frontend won't display)
    const allStars = rankedLearners.map(l => ({
      _id: l.userId,
      firstName: l.firstName,
      lastName: l.lastName,
      username: l.username,
      profilePic: l.profilePic,
      role: l.role,
      sessionCount: l.sessionCount,
      avgTutorRating: l.avgTutorRating,
      distinctTutorsCount: l.distinctTutorsCount
    }));

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

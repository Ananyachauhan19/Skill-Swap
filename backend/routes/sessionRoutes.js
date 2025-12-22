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
      // Expert sessions are not publicly searchable; they are invite-only for SkillMates
      sessionType: { $ne: 'expert' },
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
    const { subject, topic, subtopic, description, date, time, sessionType, skillMateId } = req.body;
    const normalizedSessionType = sessionType === 'expert' ? 'expert' : 'normal';
    
    // Validate required fields
    if (!subject || !topic || !subtopic || !description || !date || !time) {
      const missing = [];
      if (!subject) missing.push('subject');
      if (!topic) missing.push('topic');
      if (!subtopic) missing.push('subtopic');
      if (!description) missing.push('description');
      if (!date) missing.push('date');
      if (!time) missing.push('time');
      
      return res.status(400).json({ 
        message: `Missing required fields: ${missing.join(', ')}`,
        missingFields: missing 
      });
    }
    
    let invitedSkillMate = undefined;
    let invitedSkillMateName = '';
    if (normalizedSessionType === 'expert') {
      if (!skillMateId) {
        return res.status(400).json({ message: 'SkillMate is required for expert sessions' });
      }
      const creator = await User.findById(req.user._id).select('skillMates firstName lastName username');
      const isSkillMate = creator && Array.isArray(creator.skillMates) && creator.skillMates.some(id => String(id) === String(skillMateId));
      if (!isSkillMate) {
        return res.status(403).json({ message: 'Expert sessions can be created only for your SkillMates' });
      }
      invitedSkillMate = skillMateId;

      // Snapshot the invited SkillMate display name at creation time.
      const mate = await User.findById(invitedSkillMate).select('firstName lastName username');
      invitedSkillMateName = `${mate?.firstName || ''} ${mate?.lastName || ''}`.trim() || mate?.username || 'SkillMate';
    }

    const session = await Session.create({
      subject,
      topic,
      subtopic,
      description,
      date,
      time,
      creator: req.user._id,
      sessionType: normalizedSessionType,
      invitedSkillMate,
      invitedSkillMateName,
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
    
    // Notifications/emails
    if (normalizedSessionType === 'expert') {
      try {
        const Notification = require('../models/Notification');
        const creator = await User.findById(req.user._id).select('firstName lastName username');
        const mate = await User.findById(invitedSkillMate).select('email firstName lastName username');

        const creatorName = `${creator?.firstName || ''} ${creator?.lastName || ''}`.trim() || creator?.username || 'Your SkillMate';
        const mateName = `${mate?.firstName || ''} ${mate?.lastName || ''}`.trim() || mate?.username || 'SkillMate';
        const message = `${creatorName} invited you to an expert session (${subject} • ${topic})`;

        await Notification.create({
          userId: invitedSkillMate,
          type: 'expert-session-invited',
          message,
          sessionId: session._id,
          requesterId: req.user._id,
          requesterName: creatorName,
          timestamp: Date.now(),
        });

        const io = req.app.get('io');
        if (io) {
          io.to(String(invitedSkillMate)).emit('notification', {
            type: 'expert-session-invited',
            message,
            sessionId: session._id,
            requesterId: req.user._id,
            requesterName: creatorName,
            timestamp: Date.now(),
          });
        }

        if (mate?.email) {
          const tpl = T.expertSessionInvitation({
            mateName,
            creatorName,
            subject,
            topic,
            date,
            time,
          });
          await sendMail({ to: mate.email, subject: tpl.subject, html: tpl.html });
        }
      } catch (e) {
        console.error('Failed to send expert session notifications', e);
      }
    } else {
      // Normal session behavior: email all SkillMates (existing behavior)
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
    }
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: 'Error creating session', error: err.message });
  }
});

// Alias route for /create (same as POST /)
router.post('/create', requireAuth, tutorCtrl.ensureTutorActivation, tutorCtrl.requireActiveTutor, async (req, res) => {
  try {
    console.log('Session creation via /create - req.user:', req.user); // Debug log
    const { subject, topic, subtopic, description, date, time, sessionType, skillMateId } = req.body;
    const normalizedSessionType = sessionType === 'expert' ? 'expert' : 'normal';
    
    // Validate required fields
    if (!subject || !topic || !subtopic || !description || !date || !time) {
      const missing = [];
      if (!subject) missing.push('subject');
      if (!topic) missing.push('topic');
      if (!subtopic) missing.push('subtopic');
      if (!description) missing.push('description');
      if (!date) missing.push('date');
      if (!time) missing.push('time');
      
      return res.status(400).json({ 
        message: `Missing required fields: ${missing.join(', ')}`,
        missingFields: missing 
      });
    }
    
    let invitedSkillMate = undefined;
    let invitedSkillMateName = '';
    if (normalizedSessionType === 'expert') {
      if (!skillMateId) {
        return res.status(400).json({ message: 'SkillMate is required for expert sessions' });
      }
      const creator = await User.findById(req.user._id).select('skillMates firstName lastName username');
      const isSkillMate = creator && Array.isArray(creator.skillMates) && creator.skillMates.some(id => String(id) === String(skillMateId));
      if (!isSkillMate) {
        return res.status(403).json({ message: 'Expert sessions can be created only for your SkillMates' });
      }
      invitedSkillMate = skillMateId;

      // Snapshot the invited SkillMate display name at creation time.
      const mate = await User.findById(invitedSkillMate).select('firstName lastName username');
      invitedSkillMateName = `${mate?.firstName || ''} ${mate?.lastName || ''}`.trim() || mate?.username || 'SkillMate';
    }

    const session = await Session.create({
      subject,
      topic,
      subtopic,
      description,
      date,
      time,
      creator: req.user._id,
      sessionType: normalizedSessionType,
      invitedSkillMate,
      invitedSkillMateName,
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
    
    // Notifications/emails
    if (normalizedSessionType === 'expert') {
      try {
        const Notification = require('../models/Notification');
        const creator = await User.findById(req.user._id).select('firstName lastName username');
        const mate = await User.findById(invitedSkillMate).select('email firstName lastName username');

        const creatorName = `${creator?.firstName || ''} ${creator?.lastName || ''}`.trim() || creator?.username || 'Your SkillMate';
        const mateName = `${mate?.firstName || ''} ${mate?.lastName || ''}`.trim() || mate?.username || 'SkillMate';
        const message = `${creatorName} invited you to an expert session (${subject} • ${topic})`;

        await Notification.create({
          userId: invitedSkillMate,
          type: 'expert-session-invited',
          message,
          sessionId: session._id,
          requesterId: req.user._id,
          requesterName: creatorName,
          timestamp: Date.now(),
        });

        const io = req.app.get('io');
        if (io) {
          io.to(String(invitedSkillMate)).emit('notification', {
            type: 'expert-session-invited',
            message,
            sessionId: session._id,
            requesterId: req.user._id,
            requesterName: creatorName,
            timestamp: Date.now(),
          });
        }

        if (mate?.email) {
          const tpl = T.expertSessionInvitation({
            mateName,
            creatorName,
            subject,
            topic,
            date,
            time,
          });
          await sendMail({ to: mate.email, subject: tpl.subject, html: tpl.html });
        }
      } catch (e) {
        console.error('Failed to send expert session notifications', e);
      }
    } else {
      // Normal session behavior: email all SkillMates (existing behavior)
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
    }
    
    res.status(201).json(session);
  } catch (err) {
    console.error('Session creation error:', err);
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
  // Expert sessions are invite-only and should not be listed publicly
  query.sessionType = { $ne: 'expert' };
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

// GET /api/sessions/top-performers – compute from SessionRequest collection (OPTIMIZED)
// NOTE: Must be defined BEFORE `/:id` routes, otherwise Express will treat `top-performers`
// as an `:id` and hit the private route (401).
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
    let allStars;
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

      allStars = rankedLearners.map(({ compositeScore, ...rest }) => rest);
    } else {
      allStars = [];
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

// GET /api/sessions/:id – fetch a single session (private)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('creator', 'firstName lastName username profilePic')
      .populate('requester', 'firstName lastName username profilePic')
      .populate('invitedSkillMate', 'firstName lastName username profilePic');

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userId = req.user._id.toString();
    const isCreator = session.creator && session.creator._id.toString() === userId;
    const isRequester = session.requester && session.requester._id.toString() === userId;
    const isInvited = session.invitedSkillMate && session.invitedSkillMate._id.toString() === userId;

    if (!isCreator && !isRequester && !isInvited) {
      return res.status(403).json({ error: 'Not authorized to view this session' });
    }

    return res.json(session);
  } catch (err) {
    console.error('Fetch session error:', err);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// PUT /api/sessions/:id
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { subject, topic, subtopic, description, date, time } = req.body;
    
    // Validate required fields if provided
    if (subject !== undefined || topic !== undefined || subtopic !== undefined || description !== undefined || date !== undefined || time !== undefined) {
      const updates = {};
      if (subject) updates.subject = subject;
      if (topic) updates.topic = topic;
      if (subtopic) updates.subtopic = subtopic;
      if (description) updates.description = description;
      if (date) updates.date = date;
      if (time) updates.time = time;
      
      // Ensure all required fields are present in the update
      const session = await Session.findOne({ _id: req.params.id, creator: req.user._id });
      if (!session) return res.status(404).json({ error: 'Session not found or not yours' });
      
      // Merge with existing values to ensure required fields remain
      Object.assign(updates, {
        subject: updates.subject || session.subject,
        topic: updates.topic || session.topic,
        subtopic: updates.subtopic || session.subtopic,
        description: updates.description || session.description,
        date: updates.date || session.date,
        time: updates.time || session.time,
      });
      
      const updatedSession = await Session.findOneAndUpdate(
        { _id: req.params.id, creator: req.user._id },
        updates,
        { new: true, runValidators: true }
      );
      
      return res.json(updatedSession);
    }
    
    res.status(400).json({ error: 'No valid fields to update' });
  } catch (err) {
    console.error('Session update error:', err);
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
      .populate('creator', 'firstName lastName socketId email username')
      .populate('requester', 'firstName lastName socketId email username')
      .populate('invitedSkillMate', 'firstName lastName socketId email username');

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

    const io = req.app.get('io');
    const Notification = require('../models/Notification');

    // For expert sessions, notify invitedSkillMate; otherwise notify requester
    const participantToNotify = session.sessionType === 'expert'
      ? session.invitedSkillMate
      : session.requester;

    const creatorName = `${session.creator?.firstName || ''} ${session.creator?.lastName || ''}`.trim() || session.creator?.username || 'Tutor';
    const participantName = `${participantToNotify?.firstName || ''} ${participantToNotify?.lastName || ''}`.trim() || participantToNotify?.username || 'User';
    const notificationMessage = `${creatorName} has started your session on ${session.subject} - ${session.topic}.`;

    if (participantToNotify?._id) {
      // Persist notification (drives in-app notifications + toast bridge)
      try {
        await Notification.create({
          userId: participantToNotify._id,
          type: 'session-started',
          message: notificationMessage,
          sessionId: session._id,
          requesterId: session.creator?._id,
          requesterName: creatorName,
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error('Failed to persist session-started notification', e);
      }

      // Emit notification to the user's room (preferred)
      if (io) {
        io.to(String(participantToNotify._id)).emit('notification', {
          type: 'session-started',
          message: notificationMessage,
          sessionId: session._id,
          requesterId: session.creator?._id,
          requesterName: creatorName,
          timestamp: Date.now(),
        });
      }

      // Legacy direct event (older clients)
      if (io && participantToNotify.socketId) {
        io.to(participantToNotify.socketId).emit('session-started', {
          sessionId: session._id,
          creator: session.creator,
          subject: session.subject,
          topic: session.topic,
          message: 'Your session has started! Tap Join to start the video call.'
        });
      }

      // Email with deep-link to Join Session page
      try {
        if (participantToNotify.email) {
          const frontendUrl = (process.env.FRONTEND_URL ||
            (process.env.NODE_ENV === 'production' ? 'http://www.skillswaphub.in' : 'http://localhost:5173')
          ).replace(/\/+$/, '');

          const tpl = T.sessionLive({
            recipientName: participantToNotify.firstName || participantToNotify.username || participantName,
            otherPartyName: creatorName,
            subject: session.subject,
            topic: session.topic,
            joinLink: `${frontendUrl}/join-session/${session._id}`,
          });
          await sendMail({ to: participantToNotify.email, subject: tpl.subject, html: tpl.html });
        }
      } catch (e) {
        console.error('Failed to send session-live email', e);
      }
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

// Approve expert session invitation
router.post('/expert/approve/:sessionId', requireAuth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      invitedSkillMate: req.user._id,
      sessionType: 'expert'
    });

    if (!session) {
      return res.status(404).json({ message: 'Expert session not found or you are not invited' });
    }

    session.status = 'approved';
    await session.save();

    // Send notification to creator
    const Notification = require('../models/Notification');
    const skillMate = await User.findById(req.user._id).select('firstName lastName username');
    await Notification.create({
      userId: session.creator,
      type: 'expert-session-approved',
      message: `${skillMate.firstName || skillMate.username} accepted your expert session invitation`,
      sessionId: session._id,
      requesterId: req.user._id,
      requesterName: `${skillMate.firstName || skillMate.username}`,
      timestamp: Date.now(),
    });

    // Send socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(session.creator.toString()).emit('notification', {
        type: 'expert-session-approved',
        message: `${skillMate.firstName || skillMate.username} accepted your expert session invitation`,
        sessionId: session._id,
        requesterId: req.user._id,
        requesterName: `${skillMate.firstName || skillMate.username}`,
        timestamp: Date.now(),
      });
    }

    res.json({ message: 'Expert session approved successfully', session });
  } catch (err) {
    console.error('Expert session approve error:', err);
    res.status(500).json({ error: 'Failed to approve expert session' });
  }
});

// Reject expert session invitation
router.post('/expert/reject/:sessionId', requireAuth, async (req, res) => {
  try {
    const session = await Session.findOne({
      _id: req.params.sessionId,
      invitedSkillMate: req.user._id,
      sessionType: 'expert'
    });

    if (!session) {
      return res.status(404).json({ message: 'Expert session not found or you are not invited' });
    }

    session.status = 'rejected';
    await session.save();

    // Send notification to creator
    const Notification = require('../models/Notification');
    const skillMate = await User.findById(req.user._id).select('firstName lastName username');
    await Notification.create({
      userId: session.creator,
      type: 'expert-session-rejected',
      message: `${skillMate.firstName || skillMate.username} declined your expert session invitation`,
      sessionId: session._id,
      requesterId: req.user._id,
      requesterName: `${skillMate.firstName || skillMate.username}`,
      timestamp: Date.now(),
    });

    // Send socket notification
    const io = req.app.get('io');
    if (io) {
      io.to(session.creator.toString()).emit('notification', {
        type: 'expert-session-rejected',
        message: `${skillMate.firstName || skillMate.username} declined your expert session invitation`,
        sessionId: session._id,
        requesterId: req.user._id,
        requesterName: `${skillMate.firstName || skillMate.username}`,
        timestamp: Date.now(),
      });
    }

    res.json({ message: 'Expert session rejected successfully' });
  } catch (err) {
    console.error('Expert session reject error:', err);
    res.status(500).json({ error: 'Failed to reject expert session' });
  }
});

module.exports = router;

// routes/sessionRoutes.js
const express = require('express');
const Session = require('../models/Session');
const router = express.Router();
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');


router.get('/search', async (req, res) => {
  try {
    const { subject, topic, subtopic } = req.query;

    const filter = {
      status: 'pending',
    };

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (subtopic) filter.subtopic = subtopic;

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
router.post('/', requireAuth, async (req, res) => {
  try {
    const { subject, topic,subtopic,description, date, time } = req.body;
    const session = await Session.create({
      subject, topic, subtopic,description, date, time,
      creator: req.user._id
    });
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
      { topic: { $regex: search, $options: 'i' } },
       { subtopic: { $regex: search, $options: 'i' } }
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

// Request session
router.post('/request/:id', requireAuth, async (req, res) => {
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

// Start session
router.post('/:id/start', requireAuth, async (req, res) => {
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
        subtopic: session.subtopic,
        message: 'Your session has started! Click Join to start the video call or Cancel to decline.'
      });
    }

    res.json({ 
      message: 'Session started successfully',
      session: session
    });
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

module.exports = router;

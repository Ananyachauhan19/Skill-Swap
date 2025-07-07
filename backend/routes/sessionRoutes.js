// routes/sessionRoutes.js
const express = require('express');
const Session = require('../models/Session');
const router = express.Router();

// Middleware to check authentication (you can reuse your existing one)
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



router.use(requireAuth);
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
    let sessions = await Session.find({ creator: req.user._id }).sort({ date: -1, time: -1 });

    const now = new Date();

    // Update status if needed
    const updatedSessions = await Promise.all(
      sessions.map(async (session) => {
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



module.exports = router;

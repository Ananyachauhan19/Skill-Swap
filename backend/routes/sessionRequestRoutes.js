const express = require('express');
const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Create a new session request
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { tutorId, subject, topic, subtopic, message } = req.body;
    const requesterId = req.user._id;

    // Check if tutor exists
    const tutor = await User.findById(tutorId);
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
      subtopic,
      message: message || ''
    });

    await sessionRequest.save();

    // Populate user details for response
    await sessionRequest.populate('requester', 'firstName lastName profilePic');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic');

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

    // Populate user details for response
    await sessionRequest.populate('requester', 'firstName lastName profilePic');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic');

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

    // Populate user details for response
    await sessionRequest.populate('requester', 'firstName lastName profilePic');
    await sessionRequest.populate('tutor', 'firstName lastName profilePic');

    res.json({
      message: 'Session request rejected',
      sessionRequest
    });
  } catch (error) {
    console.error('Error rejecting session request:', error);
    res.status(500).json({ message: 'Failed to reject session request' });
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

module.exports = router; 
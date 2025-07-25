const express = require('express');
const SkillMate = require('../models/SkillMate');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const router = express.Router();

// Create a new SkillMate request
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    // Prevent self-requests
    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: 'You cannot send a SkillMate request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's already a request or relationship
    const existingRequest = await SkillMate.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingRequest) {
      if (existingRequest.status === 'approved') {
        return res.status(400).json({ message: 'You are already SkillMates with this user' });
      } else if (existingRequest.status === 'pending') {
        if (existingRequest.requester.toString() === requesterId.toString()) {
          return res.status(400).json({ message: 'You already have a pending request with this user' });
        } else {
          // If the recipient has already sent a request to the requester, approve it
          existingRequest.status = 'approved';
          await existingRequest.save();

          // Add each user to the other's skillMates array
          await User.findByIdAndUpdate(requesterId, { $addToSet: { skillMates: recipientId } });
          await User.findByIdAndUpdate(recipientId, { $addToSet: { skillMates: requesterId } });

          return res.status(200).json({ 
            message: 'SkillMate request approved automatically as the user had already sent you a request',
            skillMate: existingRequest
          });
        }
      } else if (existingRequest.status === 'rejected') {
        // If previously rejected, update to pending
        existingRequest.status = 'pending';
        await existingRequest.save();
        return res.status(200).json({ 
          message: 'SkillMate request sent successfully',
          skillMate: existingRequest
        });
      }
    }

    // Create new SkillMate request
    const skillMateRequest = new SkillMate({
      requester: requesterId,
      recipient: recipientId
    });

    await skillMateRequest.save();

    // Populate user details for response
    await skillMateRequest.populate('requester', 'firstName lastName username profilePic');
    await skillMateRequest.populate('recipient', 'firstName lastName username profilePic');

    res.status(201).json({
      message: 'SkillMate request sent successfully',
      skillMate: skillMateRequest
    });
  } catch (error) {
    console.error('Error creating SkillMate request:', error);
    res.status(500).json({ message: 'Failed to create SkillMate request', error: error.message });
  }
});

// Get SkillMate requests received by the user
router.get('/requests/received', requireAuth, async (req, res) => {
  try {
    const requests = await SkillMate.find({ 
      recipient: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'firstName lastName username profilePic')
    .populate('recipient', 'firstName lastName username profilePic')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching received SkillMate requests:', error);
    res.status(500).json({ message: 'Failed to fetch SkillMate requests', error: error.message });
  }
});

// Get SkillMate requests sent by the user
router.get('/requests/sent', requireAuth, async (req, res) => {
  try {
    const requests = await SkillMate.find({ 
      requester: req.user._id,
      status: 'pending'
    })
    .populate('requester', 'firstName lastName username profilePic')
    .populate('recipient', 'firstName lastName username profilePic')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching sent SkillMate requests:', error);
    res.status(500).json({ message: 'Failed to fetch sent SkillMate requests', error: error.message });
  }
});

// Approve a SkillMate request
router.post('/requests/approve/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const skillMateRequest = await SkillMate.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });

    if (!skillMateRequest) {
      return res.status(404).json({ message: 'SkillMate request not found or already processed' });
    }

    // Update request status
    skillMateRequest.status = 'approved';
    await skillMateRequest.save();

    // Add each user to the other's skillMates array
    await User.findByIdAndUpdate(skillMateRequest.requester, { 
      $addToSet: { skillMates: skillMateRequest.recipient } 
    });
    await User.findByIdAndUpdate(skillMateRequest.recipient, { 
      $addToSet: { skillMates: skillMateRequest.requester } 
    });

    // Populate user details for response
    await skillMateRequest.populate('requester', 'firstName lastName username profilePic');
    await skillMateRequest.populate('recipient', 'firstName lastName username profilePic');

    res.json({
      message: 'SkillMate request approved successfully',
      skillMate: skillMateRequest
    });
  } catch (error) {
    console.error('Error approving SkillMate request:', error);
    res.status(500).json({ message: 'Failed to approve SkillMate request', error: error.message });
  }
});

// Reject a SkillMate request
router.post('/requests/reject/:requestId', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const skillMateRequest = await SkillMate.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });

    if (!skillMateRequest) {
      return res.status(404).json({ message: 'SkillMate request not found or already processed' });
    }

    // Update request status
    skillMateRequest.status = 'rejected';
    await skillMateRequest.save();

    // Populate user details for response
    await skillMateRequest.populate('requester', 'firstName lastName username profilePic');
    await skillMateRequest.populate('recipient', 'firstName lastName username profilePic');

    res.json({
      message: 'SkillMate request rejected successfully',
      skillMate: skillMateRequest
    });
  } catch (error) {
    console.error('Error rejecting SkillMate request:', error);
    res.status(500).json({ message: 'Failed to reject SkillMate request', error: error.message });
  }
});

// Remove a SkillMate
router.post('/remove/:skillMateId', requireAuth, async (req, res) => {
  try {
    const { skillMateId } = req.params;
    const userId = req.user._id;

    // Remove from both users' skillMates arrays
    await User.findByIdAndUpdate(userId, { 
      $pull: { skillMates: skillMateId } 
    });
    await User.findByIdAndUpdate(skillMateId, { 
      $pull: { skillMates: userId } 
    });

    // Find and delete any existing SkillMate document
    await SkillMate.deleteOne({
      $or: [
        { requester: userId, recipient: skillMateId },
        { requester: skillMateId, recipient: userId }
      ],
      status: 'approved'
    });

    res.json({ message: 'SkillMate removed successfully' });
  } catch (error) {
    console.error('Error removing SkillMate:', error);
    res.status(500).json({ message: 'Failed to remove SkillMate', error: error.message });
  }
});

// Get all SkillMates for the current user
router.get('/list', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('skillMates', 'firstName lastName username profilePic');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.skillMates || []);
  } catch (error) {
    console.error('Error fetching SkillMates:', error);
    res.status(500).json({ message: 'Failed to fetch SkillMates', error: error.message });
  }
});

// Check if users are SkillMates
router.get('/check/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if users are SkillMates
    const user = await User.findById(currentUserId);
    const isSkillMate = user.skillMates && user.skillMates.includes(userId);

    // Check if there's a pending request
    const pendingRequest = await SkillMate.findOne({
      $or: [
        { requester: currentUserId, recipient: userId, status: 'pending' },
        { requester: userId, recipient: currentUserId, status: 'pending' }
      ]
    });

    res.json({
      isSkillMate,
      pendingRequest: pendingRequest ? {
        id: pendingRequest._id,
        status: pendingRequest.status,
        isRequester: pendingRequest.requester.toString() === currentUserId.toString()
      } : null
    });
  } catch (error) {
    console.error('Error checking SkillMate status:', error);
    res.status(500).json({ message: 'Failed to check SkillMate status', error: error.message });
  }
});

module.exports = router;
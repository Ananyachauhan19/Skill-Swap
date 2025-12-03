const express = require('express');
const SkillMate = require('../models/SkillMate');
const User = require('../models/User');
const Notification = require('../models/Notification');
const requireAuth = require('../middleware/requireAuth');
const { recordContributionEvent } = require('../utils/contributions');
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

          // Create a notification for the recipient
          const requester = await User.findById(requesterId);
          await Notification.create({
            userId: recipient._id,
            type: 'skillmate-approved',
            message: `${requester.firstName} ${requester.lastName} has approved your SkillMate request.`,
            skillMateId: existingRequest._id,
            requesterId: requesterId,
            requesterName: `${requester.firstName} ${requester.lastName}`,
            timestamp: Date.now(),
          });

          // Emit real-time notification via Socket.IO
          const io = req.app.get('io');
          io.to(recipient._id.toString()).emit('notification', {
            type: 'skillmate-approved',
            message: `${requester.firstName} ${requester.lastName} has approved your SkillMate request.`,
            skillMateId: existingRequest._id,
            requesterId: requesterId,
            requesterName: `${requester.firstName} ${requester.lastName}`,
            timestamp: Date.now(),
          });

          // Create a notification for the requester
          await Notification.create({
            userId: requesterId,
            type: 'skillmate-approved',
            message: `Your SkillMate request to ${recipient.firstName} ${recipient.lastName} has been approved automatically.`,
            skillMateId: existingRequest._id,
            requesterId: recipientId,
            requesterName: `${recipient.firstName} ${recipient.lastName}`,
            timestamp: Date.now(),
          });

          io.to(requesterId.toString()).emit('notification', {
            type: 'skillmate-approved',
            message: `Your SkillMate request to ${recipient.firstName} ${recipient.lastName} has been approved automatically.`,
            skillMateId: existingRequest._id,
            requesterId: recipientId,
            requesterName: `${recipient.firstName} ${recipient.lastName}`,
            timestamp: Date.now(),
          });

          // Contributions: both users gain exactly one contribution for this approval (idempotent)
          try {
            const io = req.app.get('io');
            const key = `skillmate-approved:${existingRequest._id}`;
            await Promise.all([
              recordContributionEvent({ userId: requesterId, key, breakdownKey: 'skillMateApprovals', io }),
              recordContributionEvent({ userId: recipientId, key, breakdownKey: 'skillMateApprovals', io }),
            ]);
          } catch (_) {}

          return res.status(200).json({ 
            message: 'SkillMate request approved automatically as the user had already sent you a request',
            skillMate: existingRequest
          });
        }
      } else if (existingRequest.status === 'rejected') {
        // If previously rejected, update to pending
        existingRequest.status = 'pending';
        await existingRequest.save();

        // Create a notification for the recipient
        const requester = await User.findById(requesterId);
        await Notification.create({
          userId: recipient._id,
          type: 'skillmate-requested',
          message: `${requester.firstName} ${requester.lastName} has sent you a SkillMate request.`,
          skillMateId: existingRequest._id,
          requesterId: requesterId,
          requesterName: `${requester.firstName} ${requester.lastName}`,
          timestamp: Date.now(),
        });

        // Emit real-time notification via Socket.IO
        const io = req.app.get('io');
        io.to(recipient._id.toString()).emit('notification', {
          type: 'skillmate-requested',
          message: `${requester.firstName} ${requester.lastName} has sent you a SkillMate request.`,
          skillMateId: existingRequest._id,
          requesterId: requesterId,
          requesterName: `${requester.firstName} ${requester.lastName}`,
          timestamp: Date.now(),
        });

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

    // Create a notification for the recipient
    const requester = await User.findById(requesterId);
    await Notification.create({
      userId: recipient._id,
      type: 'skillmate-requested',
      message: `${requester.firstName} ${requester.lastName} has sent you a SkillMate request.`,
      skillMateId: skillMateRequest._id,
      requesterId: requesterId,
      requesterName: `${requester.firstName} ${requester.lastName}`,
      timestamp: Date.now(),
    });

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    io.to(recipient._id.toString()).emit('notification', {
      type: 'skillmate-requested',
      message: `${requester.firstName} ${requester.lastName} has sent you a SkillMate request.`,
      skillMateId: skillMateRequest._id,
      requesterId: requesterId,
      requesterName: `${requester.firstName} ${requester.lastName}`,
      timestamp: Date.now(),
    });

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

    // Create a notification for the requester
    const recipient = await User.findById(userId);
    await Notification.create({
      userId: skillMateRequest.requester._id,
      type: 'skillmate-approved',
      message: `${recipient.firstName} ${recipient.lastName} has approved your SkillMate request.`,
      skillMateId: skillMateRequest._id,
      requesterId: userId,
      requesterName: `${recipient.firstName} ${recipient.lastName}`,
      timestamp: Date.now(),
    });

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    io.to(skillMateRequest.requester._id.toString()).emit('notification', {
      type: 'skillmate-approved',
      message: `${recipient.firstName} ${recipient.lastName} has approved your SkillMate request.`,
      skillMateId: skillMateRequest._id,
      requesterId: userId,
      requesterName: `${recipient.firstName} ${recipient.lastName}`,
      timestamp: Date.now(),
    });

    // Contributions: both users gain exactly one contribution for this approval (idempotent)
    try {
      const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
      await Promise.all([
        trackActivity({
          userId: skillMateRequest.requester,
          activityType: ACTIVITY_TYPES.SKILLMATE_ADDED,
          activityId: skillMateRequest._id.toString(),
          io
        }),
        trackActivity({
          userId: skillMateRequest.recipient,
          activityType: ACTIVITY_TYPES.SKILLMATE_ADDED,
          activityId: skillMateRequest._id.toString(),
          io
        })
      ]);
    } catch (_) {}

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

    // Create a notification for the requester
    const recipient = await User.findById(userId);
    await Notification.create({
      userId: skillMateRequest.requester._id,
      type: 'skillmate-rejected',
      message: `${recipient.firstName} ${recipient.lastName} has rejected your SkillMate request.`,
      skillMateId: skillMateRequest._id,
      requesterId: userId,
      requesterName: `${recipient.firstName} ${recipient.lastName}`,
      timestamp: Date.now(),
    });

    // Emit real-time notification via Socket.IO
    const io = req.app.get('io');
    io.to(skillMateRequest.requester._id.toString()).emit('notification', {
      type: 'skillmate-rejected',
      message: `${recipient.firstName} ${recipient.lastName} has rejected your SkillMate request.`,
      skillMateId: skillMateRequest._id,
      requesterId: userId,
      requesterName: `${recipient.firstName} ${recipient.lastName}`,
      timestamp: Date.now(),
    });

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
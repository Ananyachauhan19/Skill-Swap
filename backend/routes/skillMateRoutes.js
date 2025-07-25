const express = require('express');
const SkillMate = require('../models/SkillMate');
const User = require('../models/User');
const Notification = require('../models/Notification');
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
    const recipient = await User.findById(recipientId).select('firstName lastName username profilePic');
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

          // Populate user details for response and notification
          await existingRequest.populate('requester', 'firstName lastName username profilePic');
          await existingRequest.populate('recipient', 'firstName lastName username profilePic');

          // Create notification for the requester (recipient of the original request)
          const requesterName = `${existingRequest.recipient.firstName} ${existingRequest.recipient.lastName}`;
          const notification = await Notification.create({
            userId: existingRequest.requester._id,
            type: 'skillmate-approved',
            message: `Your SkillMate request has been approved by ${requesterName}.`,
            requestId: existingRequest._id,
            requesterId: recipientId,
            requesterName,
            timestamp: new Date(),
            read: false
          });

          // Emit real-time notification to the requester
          const io = req.app.get('io');
          io.to(existingRequest.requester._id.toString()).emit('notification', {
            _id: notification._id,
            userId: existingRequest.requester._id,
            type: 'skillmate-approved',
            message: `Your SkillMate request has been approved by ${requesterName}.`,
            requestId: existingRequest._id,
            requesterId: recipientId,
            requesterName,
            timestamp: notification.timestamp,
            read: false
          });

          // Emit real-time approval event (consistent with socket.js)
          io.to(existingRequest.requester._id.toString()).emit('skillmate-request-approved', {
            message: 'Your SkillMate request has been approved',
            skillMate: existingRequest
          });

          return res.status(200).json({ 
            message: 'SkillMate request approved automatically as the user had already sent you a request',
            skillMate: existingRequest
          });
        }
      } else if (existingRequest.status === 'rejected') {
        // If previously rejected, update to pending
        existingRequest.status = 'pending';
        await existingRequest.save();

        // Populate user details for response and notification
        await existingRequest.populate('requester', 'firstName lastName username profilePic');
        await existingRequest.populate('recipient', 'firstName lastName username profilePic');

        // Create notification for the recipient
        const requesterName = `${existingRequest.requester.firstName} ${existingRequest.requester.lastName}`;
        const notification = await Notification.create({
          userId: recipientId,
          type: 'skillmate-requested',
          message: `${requesterName} has sent you a SkillMate request.`,
          requestId: existingRequest._id,
          requesterId: requesterId,
          requesterName,
          timestamp: new Date(),
          read: false
        });

        // Emit real-time notification to the recipient
        const io = req.app.get('io');
        io.to(recipientId.toString()).emit('notification', {
          _id: notification._id,
          userId: recipientId,
          type: 'skillmate-requested',
          message: `${requesterName} has sent you a SkillMate request.`,
          requestId: existingRequest._id,
          requesterId: requesterId,
          requesterName,
          timestamp: notification.timestamp,
          read: false
        });

        // Emit real-time request event (consistent with socket.js)
        io.to(recipientId.toString()).emit('skillmate-request-received', {
          skillMate: existingRequest,
          requester: {
            userId: existingRequest.requester._id,
            firstName: existingRequest.requester.firstName,
            lastName: existingRequest.requester.lastName,
            profilePic: existingRequest.requester.profilePic
          }
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

    // Populate user details for response and notification
    await skillMateRequest.populate('requester', 'firstName lastName username profilePic');
    await skillMateRequest.populate('recipient', 'firstName lastName username profilePic');

    // Create notification for the recipient
    const requesterName = `${skillMateRequest.requester.firstName} ${skillMateRequest.requester.lastName}`;
    const notification = await Notification.create({
      userId: recipientId,
      type: 'skillmate-requested',
      message: `${requesterName} has sent you a SkillMate request.`,
      requestId: skillMateRequest._id,
      requesterId: requesterId,
      requesterName,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the recipient
    const io = req.app.get('io');
    io.to(recipientId.toString()).emit('notification', {
      _id: notification._id,
      userId: recipientId,
      type: 'skillmate-requested',
      message: `${requesterName} has sent you a SkillMate request.`,
      requestId: skillMateRequest._id,
      requesterId: requesterId,
      requesterName,
      timestamp: notification.timestamp,
      read: false
    });

    // Emit real-time request event (consistent with socket.js)
    io.to(recipientId.toString()).emit('skillmate-request-received', {
      skillMate: skillMateRequest,
      requester: {
        userId: skillMateRequest.requester._id,
        firstName: skillMateRequest.requester.firstName,
        lastName: skillMateRequest.requester.lastName,
        profilePic: skillMateRequest.requester.profilePic
      }
    });

    res.status(201).json({
      message: 'SkillMate request sent successfully',
      sessionRequest: skillMateRequest
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

    // Populate user details for response and notification
    await skillMateRequest.populate('requester', 'firstName lastName username profilePic');
    await skillMateRequest.populate('recipient', 'firstName lastName username profilePic');

    // Create notification for the requester
    const recipientName = `${skillMateRequest.recipient.firstName} ${skillMateRequest.recipient.lastName}`;
    const notification = await Notification.create({
      userId: skillMateRequest.requester._id,
      type: 'skillmate-approved',
      message: `Your SkillMate request has been approved by ${recipientName}.`,
      requestId: skillMateRequest._id,
      requesterId: userId,
      requesterName: recipientName,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the requester
    const io = req.app.get('io');
    io.to(skillMateRequest.requester._id.toString()).emit('notification', {
      _id: notification._id,
      userId: skillMateRequest.requester._id,
      type: 'skillmate-approved',
      message: `Your SkillMate request has been approved by ${recipientName}.`,
      requestId: skillMateRequest._id,
      requesterId: userId,
      requesterName: recipientName,
      timestamp: notification.timestamp,
      read: false
    });

    // Emit real-time approval event (consistent with socket.js)
    io.to(skillMateRequest.requester._id.toString()).emit('skillmate-request-approved', {
      message: 'Your SkillMate request has been approved',
      skillMate: skillMateRequest
    });

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

    // Populate user details for response and notification
    await skillMateRequest.populate('requester', 'firstName lastName username profilePic');
    await skillMateRequest.populate('recipient', 'firstName lastName username profilePic');

    // Create notification for the requester
    const recipientName = `${skillMateRequest.recipient.firstName} ${skillMateRequest.recipient.lastName}`;
    const notification = await Notification.create({
      userId: skillMateRequest.requester._id,
      type: 'skillmate-rejected',
      message: `Your SkillMate request has been rejected by ${recipientName}.`,
      requestId: skillMateRequest._id,
      requesterId: userId,
      requesterName: recipientName,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the requester
    const io = req.app.get('io');
    io.to(skillMateRequest.requester._id.toString()).emit('notification', {
      _id: notification._id,
      userId: skillMateRequest.requester._id,
      type: 'skillmate-rejected',
      message: `Your SkillMate request has been rejected by ${recipientName}.`,
      requestId: skillMateRequest._id,
      requesterId: userId,
      requesterName: recipientName,
      timestamp: notification.timestamp,
      read: false
    });

    // Emit real-time rejection event (consistent with socket.js)
    io.to(skillMateRequest.requester._id.toString()).emit('skillmate-request-rejected', {
      message: 'Your SkillMate request has been rejected',
      skillMate: skillMateRequest
    });

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

    // Find the SkillMate relationship
    const skillMateRelationship = await SkillMate.findOne({
      $or: [
        { requester: userId, recipient: skillMateId },
        { requester: skillMateId, recipient: userId }
      ],
      status: 'approved'
    });

    if (!skillMateRelationship) {
      return res.status(404).json({ message: 'SkillMate relationship not found' });
    }

    // Get user details for notification
    const otherUser = await User.findById(skillMateId).select('firstName lastName username profilePic');
    const currentUser = await User.findById(userId).select('firstName lastName username profilePic');

    // Remove from both users' skillMates arrays
    await User.findByIdAndUpdate(userId, { 
      $pull: { skillMates: skillMateId } 
    });
    await User.findByIdAndUpdate(skillMateId, { 
      $pull: { skillMates: userId } 
    });

    // Delete the SkillMate document
    await SkillMate.deleteOne({
      $or: [
        { requester: userId, recipient: skillMateId },
        { requester: skillMateId, recipient: userId }
      ],
      status: 'approved'
    });

    // Create notification for the other user
    const currentUserName = `${currentUser.firstName} ${currentUser.lastName}`;
    const notification = await Notification.create({
      userId: skillMateId,
      type: 'skillmate-removed',
      message: `${currentUserName} has removed you as a SkillMate.`,
      requesterId: userId,
      requesterName: currentUserName,
      timestamp: new Date(),
      read: false
    });

    // Emit real-time notification to the other user
    const io = req.app.get('io');
    io.to(skillMateId.toString()).emit('notification', {
      _id: notification._id,
      userId: skillMateId,
      type: 'skillmate-removed',
      message: `${currentUserName} has removed you as a SkillMate.`,
      requesterId: userId,
      requesterName: currentUserName,
      timestamp: notification.timestamp,
      read: false
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
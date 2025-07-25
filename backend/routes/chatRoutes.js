const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/Chat');
const User = require('../models/User');
const SkillMate = require('../models/SkillMate');
const auth = require('../middleware/requireAuth');

// Get chat history with a specific skillmate
router.get('/history/:skillMateId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const skillMateId = req.params.skillMateId;

    // Verify that the users are skillmates
    const skillMateRelationship = await SkillMate.findOne({
      status: 'approved',
      $or: [
        { requester: userId, recipient: skillMateId },
        { requester: skillMateId, recipient: userId }
      ]
    });

    if (!skillMateRelationship) {
      return res.status(403).json({ message: 'You are not skillmates with this user' });
    }

    // Get skillmate info
    const skillMateInfo = await User.findById(skillMateId, 'firstName lastName username profilePic');
    
    if (!skillMateInfo) {
      return res.status(404).json({ message: 'SkillMate not found' });
    }

    // Get chat messages
    const messages = await ChatMessage.find({
      $or: [
        { senderId: userId, recipientId: skillMateId },
        { senderId: skillMateId, recipientId: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(100); // Limit to last 100 messages

    // Mark messages as read
    await ChatMessage.updateMany(
      { senderId: skillMateId, recipientId: userId, read: false },
      { $set: { read: true } }
    );

    res.json({
      skillMateInfo,
      messages
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await ChatMessage.countDocuments({
      recipientId: userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
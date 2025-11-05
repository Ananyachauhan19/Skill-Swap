const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/Chat');
const User = require('../models/User');
const SkillMate = require('../models/SkillMate');
const Notification = require('../models/Notification');
const auth = require('../middleware/requireAuth');
// Chat does not contribute to the calendar to avoid inflating activity counts

// Send a new chat message
router.post('/send', auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient ID and content are required' });
    }

    // Verify that the users are skillmates
    const skillMateRelationship = await SkillMate.findOne({
      status: 'approved',
      $or: [
        { requester: senderId, recipient: recipientId },
        { requester: recipientId, recipient: senderId }
      ]
    });

    if (!skillMateRelationship) {
      return res.status(403).json({ message: 'You can only chat with your SkillMates' });
    }

    // Get sender's information
    const sender = await User.findById(senderId).select('firstName lastName');
    if (!sender) {
      return res.status(404).json({ message: 'Sender not found' });
    }

    // Create and save the message
    const chatMessage = new ChatMessage({
      senderId,
      recipientId,
      content,
      sender: {
        firstName: sender.firstName,
        lastName: sender.lastName
      }
    });

    await chatMessage.save();

    // Create notification for recipient
    const senderName = `${sender.firstName} ${sender.lastName}`;
    await Notification.create({
      userId: recipientId,
      type: 'chat-message',
      message: `${senderName}: ${content.length > 50 ? content.substring(0, 50) + '...' : content}`,
      requesterId: senderId,
      requesterName: senderName,
      messageId: chatMessage._id,
      timestamp: Date.now(),
      read: false
    });

    res.json({ message: 'Message sent successfully', chatMessage });

    // No contribution increment on chat send
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

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
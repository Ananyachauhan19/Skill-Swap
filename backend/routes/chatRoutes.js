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

// Get chat threads for current user (SkillMates list + last message + unread count)
router.get('/threads', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('skillMates');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const skillMateIds = Array.isArray(user.skillMates) ? user.skillMates : [];
    if (!skillMateIds.length) return res.json([]);

    const skillMates = await User.find({ _id: { $in: skillMateIds } })
      .select('firstName lastName username profilePic isOnline lastSeenAt')
      .lean();

    const threads = await Promise.all(
      skillMates.map(async (sm) => {
        const [lastMessage, unreadCount] = await Promise.all([
          ChatMessage.findOne({
            $or: [
              { senderId: userId, recipientId: sm._id },
              { senderId: sm._id, recipientId: userId }
            ]
          })
            .sort({ createdAt: -1 })
            .select('senderId recipientId content createdAt read')
            .lean(),
          ChatMessage.countDocuments({ senderId: sm._id, recipientId: userId, read: false }),
        ]);

        return {
          skillMate: sm,
          lastMessage: lastMessage || null,
          unreadCount: unreadCount || 0,
        };
      })
    );

    threads.sort((a, b) => {
      const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bt - at;
    });

    res.json(threads);
  } catch (error) {
    console.error('Error fetching chat threads:', error);
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
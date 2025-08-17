const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const Notification = require('../models/Notification');
const SessionRequest = require('../models/SessionRequest');
const SkillMate = require('../models/SkillMate');
const ChatMessage = require('../models/Chat');

router.get('/', requireAuth, async (req, res) => {
  try {
    // Fetch notifications and populate requesterId
    let notifications = await Notification.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .populate('requesterId', 'firstName lastName');

    // Populate requestId or messageId based on notification type
    notifications = await Promise.all(notifications.map(async (notification) => {
      let populatedNotification = notification.toObject();
      if (notification.requestId) {
        if (notification.type.startsWith('session')) {
          const sessionRequest = await SessionRequest.findById(notification.requestId)
            .populate('requester', 'firstName lastName profilePic')
            .populate('tutor', 'firstName lastName profilePic');
          populatedNotification.sessionRequest = sessionRequest;
        } else if (notification.type.startsWith('skillmate')) {
          const skillMateRequest = await SkillMate.findById(notification.requestId)
            .populate('requester', 'firstName lastName profilePic')
            .populate('recipient', 'firstName lastName profilePic');
          populatedNotification.skillMateRequest = skillMateRequest;
        }
      } else if (notification.messageId && notification.type === 'chat-message') {
        const chatMessage = await ChatMessage.findById(notification.messageId)
          .populate('senderId', 'firstName lastName profilePic');
        populatedNotification.chatMessage = chatMessage;
      }
      return populatedNotification;
    }));

    // Filter out notifications older than 12 hours
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    notifications = notifications.filter(n => Date.now() - new Date(n.timestamp).getTime() <= TWELVE_HOURS);

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear all notifications for the user
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
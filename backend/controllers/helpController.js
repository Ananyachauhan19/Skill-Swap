const HelpMessage = require('../models/HelpMessage');
const { sendMail } = require('../utils/sendMail');

const getRangeForPeriod = (period, date) => {
  if (!period || !date) return null;

  const selectedDate = new Date(date);
  if (Number.isNaN(selectedDate.getTime())) return null;
  selectedDate.setHours(0, 0, 0, 0);

  let startDate;
  let endDate;

  switch (period) {
    case 'daily':
      startDate = new Date(selectedDate);
      endDate = new Date(selectedDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'weekly': {
      // Week = Monday..Sunday
      const dayOfWeek = selectedDate.getDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(selectedDate);
      startDate.setDate(selectedDate.getDate() + daysToMonday);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'monthly':
      startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      return null;
  }

  return { startDate, endDate };
};

// Submit help/support request
exports.submitHelpRequest = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Create help message record
    const helpMessage = new HelpMessage({
      userId: req.user?._id || null,
      name,
      email,
      message,
      status: 'pending'
    });

    await helpMessage.save();

    // Send notification email to support team
    const emailContent = `
      <h2>New Help Request from SkillSwap Hub</h2>
      <p><strong>From:</strong> ${name} (${email})</p>
      <p><strong>User ID:</strong> ${req.user?._id || 'Guest'}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      <hr/>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr/>
      <p><em>Please reply to this help request from the Admin Panel.</em></p>
    `;

    await sendMail({
      to: 'skillswaphubb@gmail.com',
      subject: `Help Request from ${name}`,
      html: emailContent
    });

    res.status(200).json({ 
      message: 'Your help request has been submitted successfully. We will get back to you soon!',
      helpMessageId: helpMessage._id
    });
  } catch (error) {
    console.error('Error submitting help request:', error);
    res.status(500).json({ message: 'Failed to submit help request. Please try again.' });
  }
};

// Get all help messages (Admin only)
exports.getAllHelpMessages = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20, period, date } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    if (period && period !== 'overall' && date) {
      const range = getRangeForPeriod(period, date);
      if (!range) {
        return res.status(400).json({ message: 'Invalid period/date' });
      }
      query.createdAt = { $gte: range.startDate, $lte: range.endDate };
    }

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Math.max(Number(page) || 1, 1);

    const messages = await HelpMessage.find(query)
      .populate('userId', 'firstName lastName username email')
      .populate('repliedBy', 'firstName lastName username')
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit);

    const count = await HelpMessage.countDocuments(query);

    res.status(200).json({
      messages,
      totalPages: Math.ceil(count / safeLimit),
      currentPage: safePage,
      total: count
    });
  } catch (error) {
    console.error('Error fetching help messages:', error);
    res.status(500).json({ message: 'Failed to fetch help messages' });
  }
};

// Get single help message details (Admin only)
exports.getHelpMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await HelpMessage.findById(id)
      .populate('userId', 'firstName lastName username email phone')
      .populate('repliedBy', 'firstName lastName username email');

    if (!message) {
      return res.status(404).json({ message: 'Help message not found' });
    }

    res.status(200).json({ message });
  } catch (error) {
    console.error('Error fetching help message:', error);
    res.status(500).json({ message: 'Failed to fetch help message' });
  }
};

// Reply to help message (Admin only)
exports.replyToHelpMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim() === '') {
      return res.status(400).json({ message: 'Reply message is required' });
    }

    const helpMessage = await HelpMessage.findById(id);
    if (!helpMessage) {
      return res.status(404).json({ message: 'Help message not found' });
    }

    // Update help message
    helpMessage.adminReply = reply;
    helpMessage.status = 'replied';
    helpMessage.repliedBy = req.user._id;
    helpMessage.repliedAt = new Date();
    await helpMessage.save();

    // Send reply email to user
    const replyEmailContent = `
      <h2>SkillSwap Hub Support Team Response</h2>
      <p>Hello ${helpMessage.name},</p>
      <p>Thank you for reaching out to us. Here's our response to your inquiry:</p>
      <hr/>
      <h3>Your Message:</h3>
      <p style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${helpMessage.message.replace(/\n/g, '<br>')}</p>
      <hr/>
      <h3>Our Response:</h3>
      <p style="background: #e3f2fd; padding: 10px; border-radius: 5px;">${reply.replace(/\n/g, '<br>')}</p>
      <hr/>
      <p>If you have any further questions, feel free to contact us again.</p>
      <p>Best regards,<br/>SkillSwap Hub Support Team</p>
      <p style="font-size: 12px; color: #666;">
        <em>This email was sent in response to your help request submitted on ${new Date(helpMessage.createdAt).toLocaleString()}</em>
      </p>
    `;

    await sendMail({
      to: helpMessage.email,
      subject: 'Re: Your SkillSwap Hub Help Request',
      html: replyEmailContent
    });

    res.status(200).json({ 
      message: 'Reply sent successfully',
      helpMessage 
    });
  } catch (error) {
    console.error('Error replying to help message:', error);
    res.status(500).json({ message: 'Failed to send reply. Please try again.' });
  }
};

// Update help message status (Admin only)
exports.updateHelpMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'replied', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const helpMessage = await HelpMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!helpMessage) {
      return res.status(404).json({ message: 'Help message not found' });
    }

    res.status(200).json({ 
      message: 'Status updated successfully',
      helpMessage 
    });
  } catch (error) {
    console.error('Error updating help message status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
};

// Get help statistics (Admin only)
exports.getHelpStatistics = async (req, res) => {
  try {
    const totalMessages = await HelpMessage.countDocuments();
    const pendingMessages = await HelpMessage.countDocuments({ status: 'pending' });
    const repliedMessages = await HelpMessage.countDocuments({ status: 'replied' });
    const resolvedMessages = await HelpMessage.countDocuments({ status: 'resolved' });

    res.status(200).json({
      total: totalMessages,
      pending: pendingMessages,
      replied: repliedMessages,
      resolved: resolvedMessages
    });
  } catch (error) {
    console.error('Error fetching help statistics:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};

// Get date-based statistics (Admin only)
exports.getDateStatistics = async (req, res) => {
  try {
    const { period, date } = req.query;

    if (!period || !date) {
      return res.status(400).json({ message: 'Period and date are required' });
    }

    const range = getRangeForPeriod(period, date);
    if (!range) {
      return res.status(400).json({ message: 'Invalid period/date' });
    }

    const { startDate, endDate } = range;

    const dateFilter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const totalMessages = await HelpMessage.countDocuments(dateFilter);
    const pendingMessages = await HelpMessage.countDocuments({ ...dateFilter, status: 'pending' });
    const repliedMessages = await HelpMessage.countDocuments({ ...dateFilter, status: 'replied' });
    const resolvedMessages = await HelpMessage.countDocuments({ ...dateFilter, status: 'resolved' });

    res.status(200).json({
      total: totalMessages,
      pending: pendingMessages,
      replied: repliedMessages,
      resolved: resolvedMessages,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  } catch (error) {
    console.error('Error fetching date statistics:', error);
    res.status(500).json({ message: 'Failed to fetch date statistics' });
  }
};

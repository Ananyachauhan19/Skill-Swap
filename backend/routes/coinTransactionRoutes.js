const express = require('express');
const router = express.Router();
const CoinTransaction = require('../models/CoinTransaction');
const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');
const requireAuth = require('../middleware/requireAuth');

// Save coin transaction after session ends
router.post('/save-transaction', requireAuth, async (req, res) => {
  try {
    const {
      sessionId,
      transactionType,
      coinType,
      amount,
      balanceBefore,
      balanceAfter,
      sessionDuration,
      userRole,
      partnerName,
      subject,
      topic,
      sessionStartTime,
      sessionEndTime
    } = req.body;

    // Validate required fields
    if (!sessionId || !transactionType || !coinType || amount === undefined || !userRole) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate transaction type
    if (!['earned', 'spent'].includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type'
      });
    }

    // Validate coin type
    if (!['silver', 'bronze', 'gold'].includes(coinType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coin type'
      });
    }

    // Calculate duration in minutes
    const sessionDurationMinutes = Math.ceil(sessionDuration / 60);

    // Create transaction record
    const transaction = new CoinTransaction({
      userId: req.user._id,
      sessionId,
      transactionType,
      coinType,
      amount: Math.abs(amount),
      balanceBefore: balanceBefore || 0,
      balanceAfter: balanceAfter || 0,
      sessionDuration,
      sessionDurationMinutes,
      userRole,
      partnerName,
      subject,
      topic,
      description: `${transactionType === 'earned' ? 'Earned' : 'Spent'} ${Math.abs(amount)} ${coinType} coins in ${sessionDurationMinutes} minute session`,
      sessionStartTime: sessionStartTime ? new Date(sessionStartTime) : null,
      sessionEndTime: sessionEndTime ? new Date(sessionEndTime) : null
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction saved successfully',
      transaction
    });

  } catch (error) {
    console.error('Error saving coin transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save transaction',
      error: error.message
    });
  }
});

// Get user's coin transaction history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, coinType, transactionType } = req.query;
    
    const query = { userId: req.user._id };
    
    // Filter by coin type if provided
    if (coinType && ['silver', 'bronze', 'gold'].includes(coinType)) {
      query.coinType = coinType;
    }
    
    // Filter by transaction type if provided
    if (transactionType && ['earned', 'spent'].includes(transactionType)) {
      query.transactionType = transactionType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, total] = await Promise.all([
      CoinTransaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('sessionId', 'subject topic status')
        .lean(),
      CoinTransaction.countDocuments(query)
    ]);

    // Get summary statistics
    const summary = await CoinTransaction.getUserSummary(req.user._id);

    res.json({
      success: true,
      transactions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: transactions.length,
        totalRecords: total
      },
      summary
    });

  } catch (error) {
    console.error('Error fetching coin history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
});

// Get summary statistics
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const summary = await CoinTransaction.getUserSummary(req.user._id);
    
    // Get recent transactions (last 5)
    const recentTransactions = await CoinTransaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      summary,
      recentTransactions
    });

  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summary',
      error: error.message
    });
  }
});

// Get transaction details by ID
router.get('/:transactionId', requireAuth, async (req, res) => {
  try {
    const transaction = await CoinTransaction.findOne({
      _id: req.params.transactionId,
      userId: req.user._id
    })
      .populate('sessionId', 'subject topic status createdAt')
      .lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message
    });
  }
});

module.exports = router;

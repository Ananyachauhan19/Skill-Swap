const mongoose = require('mongoose');

const coinTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SessionRequest',
    required: true
  },
  transactionType: {
    type: String,
    enum: ['earned', 'spent'],
    required: true
  },
  coinType: {
    type: String,
    enum: ['silver', 'bronze', 'gold'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  sessionDuration: {
    type: Number, // in seconds
    required: true
  },
  sessionDurationMinutes: {
    type: Number, // in minutes (rounded)
    required: true
  },
  userRole: {
    type: String,
    enum: ['tutor', 'student', 'learner', 'expert'],
    required: true
  },
  partnerName: {
    type: String,
    required: false // Name of the other person in the session
  },
  subject: {
    type: String,
    required: false
  },
  topic: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  sessionStartTime: {
    type: Date,
    required: false
  },
  sessionEndTime: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for faster queries
coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ sessionId: 1 });
coinTransactionSchema.index({ transactionType: 1, coinType: 1 });

// Virtual for formatted amount
coinTransactionSchema.virtual('formattedAmount').get(function() {
  return `${this.transactionType === 'earned' ? '+' : '-'}${this.amount}`;
});

// Method to get summary statistics
coinTransactionSchema.statics.getUserSummary = async function(userId) {
  const summary = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { transactionType: '$transactionType', coinType: '$coinType' },
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    silver: { earned: 0, spent: 0 },
    bronze: { earned: 0, spent: 0 },
    gold: { earned: 0, spent: 0 }
  };

  summary.forEach(item => {
    result[item._id.coinType][item._id.transactionType] = item.totalAmount;
  });

  return result;
};

module.exports = mongoose.model('CoinTransaction', coinTransactionSchema);

const InterviewRequest = require('../models/InterviewRequest');

/**
 * Automatically expire scheduled interviews that are 12 hours past their scheduled time
 * and haven't been completed yet
 */
async function expireOverdueInterviews() {
  try {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    // Find all scheduled interviews where scheduledAt is more than 12 hours ago
    const result = await InterviewRequest.updateMany(
      {
        status: 'scheduled',
        scheduledAt: { $exists: true, $ne: null, $lte: twelveHoursAgo }
      },
      {
        $set: { status: 'expired' }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Cron] Expired ${result.modifiedCount} overdue interview(s) at ${new Date().toISOString()}`);
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('[Cron] Error expiring overdue interviews:', error);
    return 0;
  }
}

module.exports = { expireOverdueInterviews };

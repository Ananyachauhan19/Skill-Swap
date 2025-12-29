const cron = require('node-cron');
const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const { sendAssessmentReminders } = require('../utils/assessmentNotifications');

/**
 * Auto-submit in-progress attempts after endTime
 * Runs every 5 minutes
 */
function scheduleAutoSubmitExpiredAttempts() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('[CRON] Running auto-submit check for expired assessments...');
      
      const now = new Date();
      
      // Find assessments that have ended
      const expiredAssessments = await Assessment.find({
        endTime: { $lte: now },
        isActive: true
      }).select('_id endTime');

      if (expiredAssessments.length === 0) {
        console.log('[CRON] No expired assessments found');
        return;
      }

      console.log(`[CRON] Found ${expiredAssessments.length} expired assessments`);

      // Find in-progress attempts for expired assessments
      const assessmentIds = expiredAssessments.map(a => a._id);
      const inProgressAttempts = await AssessmentAttempt.find({
        assessmentId: { $in: assessmentIds },
        status: 'in-progress'
      });

      if (inProgressAttempts.length === 0) {
        console.log('[CRON] No in-progress attempts to auto-submit');
        return;
      }

      console.log(`[CRON] Found ${inProgressAttempts.length} in-progress attempts to auto-submit`);

      let autoSubmitted = 0;
      for (const attempt of inProgressAttempts) {
        try {
          attempt.status = 'auto-submitted';
          attempt.submittedAt = now;
          await attempt.calculateScore();
          await attempt.save();
          autoSubmitted++;
          
          console.log(`[CRON] ✅ Auto-submitted attempt ${attempt._id} for student ${attempt.studentId}`);
        } catch (error) {
          console.error(`[CRON] ❌ Failed to auto-submit attempt ${attempt._id}:`, error.message);
        }
      }

      console.log(`[CRON] Auto-submit complete: ${autoSubmitted}/${inProgressAttempts.length} attempts submitted`);

      // Update assessment statistics
      for (const assessment of expiredAssessments) {
        try {
          const assessmentDoc = await Assessment.findById(assessment._id);
          await assessmentDoc.updateStatistics();
        } catch (error) {
          console.error(`[CRON] Failed to update statistics for assessment ${assessment._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[CRON] Error in auto-submit job:', error);
    }
  });

  console.log('[CRON] ✅ Auto-submit job scheduled (every 5 minutes)');
}

/**
 * Send reminder emails for assessments ending within 24 hours
 * Runs every hour
 */
function scheduleAssessmentReminders() {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Running assessment reminder check...');
      
      const now = new Date();
      const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Find assessments ending within next 24 hours
      const upcomingDeadlines = await Assessment.find({
        endTime: { 
          $gte: now,
          $lte: twentyFourHoursLater
        },
        isActive: true,
        'universitySemesterConfig.isCompulsory': true // Only for compulsory assessments
      });

      if (upcomingDeadlines.length === 0) {
        console.log('[CRON] No assessments with upcoming deadlines found');
        return;
      }

      console.log(`[CRON] Found ${upcomingDeadlines.length} assessments with upcoming deadlines`);

      for (const assessment of upcomingDeadlines) {
        try {
          const results = await sendAssessmentReminders(assessment);
          console.log(`[CRON] ✅ Sent ${results.sent} reminders for assessment: ${assessment.title}`);
        } catch (error) {
          console.error(`[CRON] ❌ Failed to send reminders for assessment ${assessment._id}:`, error.message);
        }
      }

      console.log('[CRON] Reminder check complete');
    } catch (error) {
      console.error('[CRON] Error in reminder job:', error);
    }
  });

  console.log('[CRON] ✅ Assessment reminder job scheduled (every hour)');
}

/**
 * Initialize all assessment-related cron jobs
 */
function initAssessmentCronJobs() {
  scheduleAutoSubmitExpiredAttempts();
  scheduleAssessmentReminders();
  console.log('[CRON] 🚀 All assessment cron jobs initialized');
}

module.exports = {
  initAssessmentCronJobs,
  scheduleAutoSubmitExpiredAttempts,
  scheduleAssessmentReminders
};

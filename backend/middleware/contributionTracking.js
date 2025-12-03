/**
 * Middleware and helpers for automatic contribution tracking
 */
const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');

/**
 * Track profile update after successful update
 */
async function trackProfileUpdate(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function(data) {
    // Track after successful response
    setImmediate(async () => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300 && req.user && req.user._id) {
          const io = req.app.get('io');
          await trackActivity({
            userId: req.user._id,
            activityType: ACTIVITY_TYPES.PROFILE_UPDATED,
            activityId: `profile-update-${Date.now()}`,
            io
          });
        }
      } catch (error) {
        console.error('[trackProfileUpdate] Non-fatal error:', error);
      }
    });
    return originalJson(data);
  };
  next();
}

/**
 * Helper to track skillmate addition
 */
async function trackSkillMateAddition(userId, skillmateId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.SKILLMATE_ADDED,
      activityId: skillmateId,
      io
    });
  } catch (error) {
    console.error('[trackSkillMateAddition] Non-fatal error:', error);
  }
}

/**
 * Helper to track question posting
 */
async function trackQuestionPost(userId, questionId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.QUESTION_POSTED,
      activityId: questionId,
      io
    });
  } catch (error) {
    console.error('[trackQuestionPost] Non-fatal error:', error);
  }
}

/**
 * Helper to track answer posting
 */
async function trackAnswerPost(userId, answerId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.ANSWER_PROVIDED,
      activityId: answerId,
      io
    });
  } catch (error) {
    console.error('[trackAnswerPost] Non-fatal error:', error);
  }
}

/**
 * Helper to track certificate upload
 */
async function trackCertificateUpload(userId, certificateId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.CERTIFICATE_UPLOADED,
      activityId: certificateId || `cert-${Date.now()}`,
      io
    });
  } catch (error) {
    console.error('[trackCertificateUpload] Non-fatal error:', error);
  }
}

/**
 * Helper to track testimonial submission
 */
async function trackTestimonialSubmission(userId, testimonialId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.TESTIMONIAL_GIVEN,
      activityId: testimonialId,
      io
    });
  } catch (error) {
    console.error('[trackTestimonialSubmission] Non-fatal error:', error);
  }
}

/**
 * Helper to track tutor application submission
 */
async function trackTutorApplication(userId, applicationId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.TUTOR_APPLICATION_SUBMITTED,
      activityId: applicationId,
      io
    });
  } catch (error) {
    console.error('[trackTutorApplication] Non-fatal error:', error);
  }
}

/**
 * Helper to track interview completion
 */
async function trackInterviewCompletion(userId, interviewId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.INTERVIEW_COMPLETED,
      activityId: interviewId,
      io
    });
  } catch (error) {
    console.error('[trackInterviewCompletion] Non-fatal error:', error);
  }
}

/**
 * Helper to track coin purchase
 */
async function trackCoinPurchase(userId, transactionId, coinAmount, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.COINS_PURCHASED,
      activityId: transactionId,
      io,
      metadata: { coinsAmount: coinAmount }
    });
  } catch (error) {
    console.error('[trackCoinPurchase] Non-fatal error:', error);
  }
}

/**
 * Helper to track session rating
 */
async function trackSessionRating(userId, sessionId, io) {
  try {
    await trackActivity({
      userId,
      activityType: ACTIVITY_TYPES.SESSION_RATED,
      activityId: sessionId,
      io
    });
  } catch (error) {
    console.error('[trackSessionRating] Non-fatal error:', error);
  }
}

module.exports = {
  trackProfileUpdate,
  trackSkillMateAddition,
  trackQuestionPost,
  trackAnswerPost,
  trackCertificateUpload,
  trackTestimonialSubmission,
  trackTutorApplication,
  trackInterviewCompletion,
  trackCoinPurchase,
  trackSessionRating,
};

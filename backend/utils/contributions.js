const Contribution = require('../models/Contribution');
const ContributionEvent = require('../models/ContributionEvent');

// Best-effort cleanup of legacy unique index on { user, date }
// which conflicts with the new { userId, dateKey } model.
let legacyIndexDropAttempted = false;

async function ensureLegacyIndexDropped() {
  if (legacyIndexDropAttempted) return;
  legacyIndexDropAttempted = true;
  try {
    await Contribution.collection.dropIndex('user_1_date_1');
    // eslint-disable-next-line no-console
    console.log('[Contributions] Dropped legacy index user_1_date_1');
  } catch (e) {
    // Ignore if index does not exist or cannot be dropped
    if (e && e.codeName !== 'IndexNotFound') {
      // eslint-disable-next-line no-console
      console.warn('[Contributions] Could not drop legacy index user_1_date_1:', e.message || e);
    }
  }
}

function toDateKeyUTC(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return d.toISOString().slice(0, 10);
}

/**
 * Increment a user's contribution count for the UTC day of `when`.
 * Also increments an optional breakdown key and emits a socket event when provided.
 *
 * @param {Object} opts
 * @param {string|ObjectId} opts.userId
 * @param {Date} [opts.when=new Date()]
 * @param {number} [opts.by=1]
 * @param {string} [opts.breakdownKey] - key in Contribution.breakdown to $inc
 * @param {Object} [opts.breakdownIncs] - additional breakdown increments e.g. { coinsEarnedGold: 1 }
 * @param {Object} [opts.io] - socket.io server instance for realtime notification
 */
async function incrementContribution({ userId, when = new Date(), by = 1, breakdownKey, breakdownIncs = {}, io }) {
  if (!userId) return;
  const dateKey = toDateKeyUTC(when);

  // Ensure we are not blocked by old unique index
  await ensureLegacyIndexDropped();

  const inc = { count: by };
  if (breakdownKey) {
    inc[`breakdown.${breakdownKey}`] = by;
  }
  Object.entries(breakdownIncs || {}).forEach(([k, v]) => {
    inc[`breakdown.${k}`] = (typeof v === 'number' ? v : 1);
  });

  await Contribution.updateOne(
    { userId, dateKey },
    {
      $inc: inc,
      // Also hydrate legacy fields used by old unique index (user, date)
      $set: {
        user: userId,
        date: dateKey,
      },
    },
    { upsert: true }
  );

  // Emit realtime update for the user (room named by user _id)
  if (io) {
    try {
      io.to(String(userId)).emit('contribution-updated', { date: dateKey, delta: by });
    } catch (_) {}
  }
  return { dateKey };
}

/**
 * Activity Type Constants - Track all platform activities
 */
const ACTIVITY_TYPES = {
  DAILY_LOGIN: 'daily_login',
  SESSION_COMPLETED_LEARNER: 'session_completed_learner',
  SESSION_COMPLETED_TUTOR: 'session_completed_tutor',
  LIVE_SESSION_JOINED: 'live_session_joined',
  ONE_ON_ONE_SESSION: 'one_on_one_session',
  COINS_PURCHASED: 'coins_purchased',
  SESSION_CREATED: 'session_created',
  INTERVIEW_COMPLETED: 'interview_completed',
  SKILLMATE_ADDED: 'skillmate_added',
  QUESTION_POSTED: 'question_posted',
  ANSWER_PROVIDED: 'answer_provided',
  PROFILE_UPDATED: 'profile_updated',
  CERTIFICATE_UPLOADED: 'certificate_uploaded',
  TESTIMONIAL_GIVEN: 'testimonial_given',
  TUTOR_APPLICATION_SUBMITTED: 'tutor_application_submitted',
  FIRST_SESSION_AS_TUTOR: 'first_session_as_tutor',
  FIRST_SESSION_AS_LEARNER: 'first_session_as_learner',
  SESSION_RATED: 'session_rated',
  COINS_EARNED: 'coins_earned',
  BADGE_EARNED: 'badge_earned',
  VIDEO_UPLOADED: 'video_uploaded',
  VIDEO_WATCHED: 'video_watched',
};

/**
 * Idempotent record-and-increment. Creates a ContributionEvent(userId,key) first;
 * if it already exists, no-op. Otherwise increments the daily contribution once.
 */
async function recordContributionEvent({ userId, key, when = new Date(), by = 1, breakdownKey, breakdownIncs = {}, io }) {
  if (!userId || !key) return { recorded: false };
  const dateKey = toDateKeyUTC(when);
  try {
    await ContributionEvent.create({ userId, key, dateKey });
  } catch (e) {
    // duplicate -> already recorded
    if (e && e.code === 11000) {
      return { recorded: false, duplicate: true };
    }
    throw e;
  }
  await incrementContribution({ userId, when, by, breakdownKey, breakdownIncs, io });
  return { recorded: true };
}

/**
 * Track specific activity types with proper breakdown categorization
 */
async function trackActivity({ userId, activityType, activityId, when = new Date(), io, metadata = {} }) {
  if (!userId || !activityType) return { tracked: false };

  const key = activityId ? `${activityType}:${activityId}` : `${activityType}:${Date.now()}`;
  
  // Map activity types to breakdown keys for better analytics
  const breakdownMapping = {
    [ACTIVITY_TYPES.DAILY_LOGIN]: 'dailyLogins',
    [ACTIVITY_TYPES.SESSION_COMPLETED_LEARNER]: 'sessionsAsLearner',
    [ACTIVITY_TYPES.SESSION_COMPLETED_TUTOR]: 'sessionsAsTutor',
    [ACTIVITY_TYPES.LIVE_SESSION_JOINED]: 'liveSessions',
    [ACTIVITY_TYPES.ONE_ON_ONE_SESSION]: 'oneOnOneSessions',
    [ACTIVITY_TYPES.COINS_PURCHASED]: 'coinsPurchased',
    [ACTIVITY_TYPES.SESSION_CREATED]: 'sessionsCreated',
    [ACTIVITY_TYPES.INTERVIEW_COMPLETED]: 'interviewsCompleted',
    [ACTIVITY_TYPES.SKILLMATE_ADDED]: 'skillmatesAdded',
    [ACTIVITY_TYPES.QUESTION_POSTED]: 'questionsPosted',
    [ACTIVITY_TYPES.ANSWER_PROVIDED]: 'answersProvided',
    [ACTIVITY_TYPES.PROFILE_UPDATED]: 'profileUpdates',
    [ACTIVITY_TYPES.CERTIFICATE_UPLOADED]: 'certificatesUploaded',
    [ACTIVITY_TYPES.TESTIMONIAL_GIVEN]: 'testimonialsGiven',
    [ACTIVITY_TYPES.TUTOR_APPLICATION_SUBMITTED]: 'tutorApplications',
    [ACTIVITY_TYPES.FIRST_SESSION_AS_TUTOR]: 'firstSessionAsTutor',
    [ACTIVITY_TYPES.FIRST_SESSION_AS_LEARNER]: 'firstSessionAsLearner',
    [ACTIVITY_TYPES.SESSION_RATED]: 'sessionsRated',
    [ACTIVITY_TYPES.COINS_EARNED]: 'coinsEarned',
    [ACTIVITY_TYPES.BADGE_EARNED]: 'badgesEarned',
    [ACTIVITY_TYPES.VIDEO_UPLOADED]: 'videosUploaded',
    [ACTIVITY_TYPES.VIDEO_WATCHED]: 'videosWatched',
  };

  const breakdownKey = breakdownMapping[activityType] || 'other';
  const breakdownIncs = {};

  // Add metadata to breakdown if provided (e.g., coin amounts)
  if (metadata.coinsAmount) {
    breakdownIncs.totalCoinsTransacted = metadata.coinsAmount;
  }

  return await recordContributionEvent({
    userId,
    key,
    when,
    by: 1,
    breakdownKey,
    breakdownIncs,
    io,
  });
}

/**
 * Track daily login - idempotent (one per day)
 */
async function trackDailyLogin({ userId, when = new Date(), io }) {
  const dateKey = toDateKeyUTC(when);
  return await trackActivity({
    userId,
    activityType: ACTIVITY_TYPES.DAILY_LOGIN,
    activityId: dateKey,
    when,
    io,
  });
}

module.exports = {
  toDateKeyUTC,
  incrementContribution,
  recordContributionEvent,
  trackActivity,
  trackDailyLogin,
  ACTIVITY_TYPES,
};

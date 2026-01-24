// Fully database-backed email template system
// Templates are loaded from MongoDB - no hardcoded fallbacks

const EmailTemplate = require('../models/EmailTemplate');

/**
 * Get email template from database
 * @param {string} templateKey - The unique key for the template
 * @param {object} variables - Variables to substitute in the template
 * @returns {Promise<{subject: string, html: string}>}
 */
async function getEmailTemplate(templateKey, variables = {}) {
  try {
    const template = await EmailTemplate.getTemplate(templateKey, variables);
    return template;
  } catch (error) {
    console.error(`❌ Failed to load email template '${templateKey}':`, error.message);
    throw new Error(`Email template '${templateKey}' not found in database. Please ensure templates are seeded.`);
  }
}

// Export all template functions with database integration
module.exports = {
  passwordReset: async (variables) => await getEmailTemplate('passwordReset', variables),
  interviewRequestConfirmation: async (variables) => await getEmailTemplate('interviewRequestConfirmation', variables),
  interviewAssigned: async (variables) => await getEmailTemplate('interviewAssigned', variables),
  interviewScheduled: async (variables) => await getEmailTemplate('interviewScheduled', variables),
  interviewScheduledInterviewer: async (variables) => await getEmailTemplate('interviewScheduledInterviewer', variables),
  interviewSlotsProposed: async (variables) => await getEmailTemplate('interviewSlotsProposed', variables),
  interviewAlternateSlotsProposed: async (variables) => await getEmailTemplate('interviewAlternateSlotsProposed', variables),
  interviewAlternateRejected: async (variables) => await getEmailTemplate('interviewAlternateRejected', variables),
  interviewRejected: async (variables) => await getEmailTemplate('interviewRejected', variables),
  sessionRequested: async (variables) => await getEmailTemplate('sessionRequested', variables),
  sessionApproved: async (variables) => await getEmailTemplate('sessionApproved', variables),
  sessionRejected: async (variables) => await getEmailTemplate('sessionRejected', variables),
  skillmateSessionCreated: async (variables) => await getEmailTemplate('skillmateSessionCreated', variables),
  expertSessionInvitation: async (variables) => await getEmailTemplate('expertSessionInvitation', variables),
  expertSessionReminder: async (variables) => await getEmailTemplate('expertSessionReminder', variables),
  sessionLive: async (variables) => await getEmailTemplate('sessionLive', variables),
  compulsoryAssessmentNotification: async (variables) => await getEmailTemplate('compulsoryAssessmentNotification', variables),
  nonCompulsoryAssessmentNotification: async (variables) => await getEmailTemplate('nonCompulsoryAssessmentNotification', variables),
  assessmentReminder: async (variables) => await getEmailTemplate('assessmentReminder', variables),
  
  // Helper function for custom template retrieval
  getTemplate: getEmailTemplate
};

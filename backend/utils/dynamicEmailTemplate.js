// Dynamic Email Template Utility
// Fetches email templates from database instead of hardcoded files

const EmailTemplate = require('../models/EmailTemplate');

/**
 * Get email template from database and replace variables
 * Automatically wraps content with base_email_layout if not already wrapped
 * @param {string} templateKey - The template key to fetch
 * @param {object} variables - Object with variable key-value pairs to replace
 * @returns {Promise<{subject: string, html: string}>} Email subject and HTML content
 */
async function getEmailTemplate(templateKey, variables = {}) {
  try {
    // Skip base layout wrapping for the base layout itself
    if (templateKey === 'base_email_layout') {
      const template = await EmailTemplate.findOne({ 
        templateKey, 
        isActive: true 
      });

      if (!template) {
        throw new Error(`Base email layout template not found`);
      }

      let html = template.htmlBody;
      Object.keys(variables).forEach(key => {
        const value = variables[key] !== undefined && variables[key] !== null ? variables[key] : '';
        const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
        html = html.replace(regex, value);
      });

      return { subject: template.subject, html };
    }

    // Fetch the requested template
    const template = await EmailTemplate.findOne({ 
      templateKey, 
      isActive: true 
    });

    if (!template) {
      console.error(`Email template '${templateKey}' not found in database`);
      throw new Error(`Email template '${templateKey}' not found. Please ensure templates are seeded.`);
    }

    let subject = template.subject;
    let content = template.htmlBody;

    // Replace all variables in subject and content
    Object.keys(variables).forEach(key => {
      const value = variables[key] !== undefined && variables[key] !== null ? variables[key] : '';
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    });

    // Check if content is already a full HTML layout (has base structure)
    // If it contains the SkillSwap Hub header, it's already wrapped
    if (content.includes('SkillSwap Hub</strong>') || content.includes('<div style="font-family: system-ui')) {
      // Already has full layout, return as-is
      return { subject, html: content };
    }

    // Otherwise, fetch base layout and wrap the content
    const baseLayout = await EmailTemplate.findOne({ 
      templateKey: 'base_email_layout', 
      isActive: true 
    });

    if (!baseLayout) {
      console.warn('Base email layout not found, returning unwrapped content');
      return { subject, html: content };
    }

    // Extract title from template name or use default
    const title = template.name || 'SkillSwap Hub Notification';

    // Wrap content with base layout
    let html = baseLayout.htmlBody;
    html = html.replace(/\$\{title\}/g, title);
    html = html.replace(/\$\{content\}/g, content);

    return { subject, html };
  } catch (error) {
    console.error(`Error fetching email template '${templateKey}':`, error);
    throw error;
  }
}

/**
 * Wrapper function that mimics the old emailTemplates.js structure
 * Returns an object with template functions for backward compatibility
 */
const EmailTemplates = {
  passwordReset: async (vars) => getEmailTemplate('passwordReset', vars),
  interviewRequestConfirmation: async (vars) => getEmailTemplate('interviewRequestConfirmation', vars),
  interviewAssigned: async (vars) => getEmailTemplate('interviewAssigned', vars),
  interviewScheduled: async (vars) => getEmailTemplate('interviewScheduled', vars),
  interviewScheduledInterviewer: async (vars) => getEmailTemplate('interviewScheduledInterviewer', vars),
  interviewSlotsProposed: async (vars) => getEmailTemplate('interviewSlotsProposed', vars),
  interviewAlternateSlotsProposed: async (vars) => getEmailTemplate('interviewAlternateSlotsProposed', vars),
  interviewAlternateRejected: async (vars) => getEmailTemplate('interviewAlternateRejected', vars),
  interviewRejected: async (vars) => getEmailTemplate('interviewRejected', vars),
  sessionRequested: async (vars) => getEmailTemplate('sessionRequested', vars),
  sessionApproved: async (vars) => getEmailTemplate('sessionApproved', vars),
  sessionRejected: async (vars) => getEmailTemplate('sessionRejected', vars),
  expertSessionInvitation: async (vars) => getEmailTemplate('expertSessionInvitation', vars),
  expertSessionReminder: async (vars) => getEmailTemplate('expertSessionReminder', vars),
  sessionLive: async (vars) => getEmailTemplate('sessionLive', vars),
  compulsoryAssessmentNotification: async (vars) => getEmailTemplate('compulsoryAssessmentNotification', vars),
  nonCompulsoryAssessmentNotification: async (vars) => getEmailTemplate('nonCompulsoryAssessmentNotification', vars),
  assessmentReminder: async (vars) => getEmailTemplate('assessmentReminder', vars),
};

module.exports = {
  getEmailTemplate,
  EmailTemplates
};

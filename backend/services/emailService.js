const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');
const { getEmailTemplate } = require('../utils/dynamicEmailTemplate');

/**
 * Replace template variables with actual values
 * @param {string} template - Template string with {{variables}}
 * @param {Object} data - Data object with variable values
 * @returns {string} - Processed template
 */
function replaceTemplateVariables(template, data) {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

/**
 * Send email with dynamic template (updated to use base template system)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.templateType - Type of email template
 * @param {Object} options.variables - Variables to replace in template
 * @param {Array} options.attachments - Email attachments
 * @returns {Promise<void>}
 */
async function sendTemplatedEmail({ to, templateType, variables, attachments = [] }) {
  try {
    // Map old template types to new template keys for intern system
    const templateKeyMap = {
      'intern_coordinator_welcome': 'intern_coordinator_welcome',
      'intern_joining': 'intern_joining',
      'intern_completion': 'intern_completion'
    };

    const templateKey = templateKeyMap[templateType];

    // If it's an intern template, use the new system with base template
    if (templateKey) {
      const { subject, html } = await getEmailTemplate(templateKey, variables);
      
      const transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST || process.env.SMTP_HOST,
        port: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587),
        secure: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.MAIL_USER || process.env.SMTP_USER,
          pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
        },
      });

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.MAIL_USER,
        to,
        subject,
        html,
        attachments,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to} using template: ${templateKey}`);
      return;
    }

    // Fallback for non-migrated templates
    const template = await EmailTemplate.findOne({ 
      type: templateType, 
      isActive: true 
    });

    if (!template) {
      throw new Error(`No active email template found for type: ${templateType}`);
    }

    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.body || template.htmlBody, variables);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER || process.env.MAIL_USER,
        pass: process.env.SMTP_PASS || process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER || process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send email using the newer EmailTemplate "templateKey" + htmlBody system
 * so that templates are fully manageable from the admin Email Templates UI.
 * Now uses getEmailTemplate utility which wraps content with base template.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.templateKey - Unique template key (matches admin UI)
 * @param {Object} options.variables - Variables for ${variable} placeholders
 * @param {Array} [options.attachments] - Optional attachments
 */
async function sendTemplateByKey({ to, templateKey, variables = {}, attachments = [] }) {
  try {
    // Use getEmailTemplate utility which handles base template wrapping
    const { subject, html } = await getEmailTemplate(templateKey, variables);

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || process.env.SMTP_HOST,
      port: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587),
      secure: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.MAIL_USER || process.env.SMTP_USER,
        pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER || process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email (templateKey='${templateKey}') sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending error (templateKey):', error);
    throw new Error(`Failed to send templated email '${templateKey}': ${error.message}`);
  }
}

/**
 * Send plain email without template
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {Array} options.attachments - Email attachments
 * @returns {Promise<void>}
 */
async function sendEmail({ to, subject, html, attachments = [] }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || process.env.SMTP_HOST,
      port: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587),
      secure: Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.MAIL_USER || process.env.SMTP_USER,
        pass: process.env.MAIL_PASS || process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.MAIL_USER || process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

module.exports = {
  sendTemplatedEmail,
  sendEmail,
   sendTemplateByKey,
  replaceTemplateVariables,
};

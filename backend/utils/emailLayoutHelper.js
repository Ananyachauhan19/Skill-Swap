// Base layout template for emails - can be referenced in email templates
// This provides the consistent branding and structure for all emails
// Now supports dynamic customization from admin panel

const EmailTemplate = require('../models/EmailTemplate');

// Default fallback layout if database template not found
const defaultLayout = (title, content) => `
  <div style="font-family: system-ui, Arial; max-width: 640px; margin:0 auto; padding:16px;">
    <div style="background:#0ea5e9; color:#fff; padding:12px 16px; border-radius:8px 8px 0 0;">
      <strong>SkillSwap Hub</strong>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding:16px; border-radius:0 0 8px 8px;">
      <h2 style="margin:0 0 12px; color:#0f172a;">${title}</h2>
      ${content}
      <div style="text-align:center; margin:24px 0;">
        <a href="https://skillswaphub.in" style="display:inline-block; background:#0ea5e9; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:500;">Go to Dashboard</a>
      </div>
      <p style="margin-top:16px; color:#334155;">Best regards,<br/>SkillSwap Hub Team</p>
      <p style="margin:16px 0 0; color:#334155;">If you have any questions, please contact our support team at <a href="mailto:info@skillswaphub.in" style="color:#2563eb; text-decoration:none;">info@skillswaphub.in</a>.</p>
      <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb"/>
      <p style="color:#64748b; font-size:12px;">This email was sent automatically by SkillSwap Hub. Please do not reply to this message.</p>
    </div>
  </div>`;

/**
 * Base email layout wrapper - now fetches from database for dynamic customization
 * @param {string} title - Main heading of the email
 * @param {string} content - HTML content to wrap
 * @returns {Promise<string>} Complete HTML email
 */
async function baseLayout(title, content) {
  try {
    const template = await EmailTemplate.findOne({ 
      templateKey: 'base_email_layout',
      isActive: true 
    });

    if (template && template.htmlBody) {
      // Use dynamic template from database
      return template.htmlBody
        .replace(/\$\{title\}/g, title)
        .replace(/\$\{content\}/g, content);
    }
  } catch (error) {
    console.error('Error fetching base email layout:', error);
  }

  // Fallback to default layout
  return defaultLayout(title, content);
}

module.exports = {
  baseLayout
};

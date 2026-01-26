const nodemailer = require('nodemailer');
const emailTemplates = require('./emailTemplatesDB');

function createTransport() {
  // Prefer legacy MAIL_* env vars, but allow newer SMTP_* as aliases
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST;
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587);
  const secure = port === 465;
  const user = process.env.MAIL_USER || process.env.SMTP_USER;
  const pass = process.env.MAIL_PASS || process.env.SMTP_PASS;

  if (!user) {
    throw new Error('Email not configured: set MAIL_USER/MAIL_PASS (optionally SMTP_* aliases)');
  }

  // Prefer explicit host config; otherwise fall back to Gmail service
  if (host) {
    return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
  }
  return nodemailer.createTransport({ service: 'gmail', auth: { user, pass } });
}

async function sendMail({ to, subject, html, text }) {
  const transporter = createTransport();
  try {
    await transporter.verify();
    console.info('[MAIL] SMTP verified. Sending email...', { to, subject });
  } catch (e) {
    console.error('[MAIL] SMTP verification failed:', e.message);
  }
  const from = process.env.MAIL_FROM || process.env.MAIL_USER || process.env.SMTP_FROM || process.env.SMTP_USER;
  const mailOptions = { from, to, subject, html, text };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.info('[MAIL] Sent', { messageId: info.messageId, to, subject, response: info.response });
    return info;
  } catch (err) {
    console.error('[MAIL] Send failed', { to, subject, error: err.message });
    throw err;
  }
}

exports.sendMail = sendMail;

exports.sendOtpEmail = async (to, otp) => {
  try {
    const { getEmailTemplate } = require('./dynamicEmailTemplate');
    const template = await getEmailTemplate('otpVerification', { otp });
    await sendMail({ to, subject: template.subject, html: template.html });
  } catch (error) {
    console.error('Error sending OTP email with template:', error);
    // Fallback to simple email if template fails
    const subject = 'Your OTP Code';
    const text = `Your OTP is: ${otp}. It is valid for 10 minutes.`;
    await sendMail({ to, subject, text });
  }
};

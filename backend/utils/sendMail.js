const nodemailer = require('nodemailer');
const emailTemplates = require('./emailTemplatesDB');

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = port === 465;
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!host && !user) {
    throw new Error('SMTP not configured: set SMTP_HOST/SMTP_USER/SMTP_PASS');
  }

  // Prefer explicit SMTP, fallback to service:gmail if only MAIL_* set
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
  const from = process.env.SMTP_FROM || process.env.MAIL_USER;
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

const nodemailer = require('nodemailer');

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
  const subject = 'Your OTP Code';
  const text = `Your OTP is: ${otp}. It is valid for 10 minutes.`;
  await sendMail({ to, subject, text });
};

exports.sendPasswordResetEmail = async (to, resetLink) => {
  const subject = 'Reset your Skill-Swap password';
  const html = `
    <div style="font-family: system-ui, Arial; max-width: 600px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to set a new password. This link expires in 30 minutes.</p>
      <p style="margin:24px 0">
        <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset Password</a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
  await sendMail({ to, subject, html });
};

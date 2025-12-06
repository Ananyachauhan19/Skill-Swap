// Centralized email templates for all mail bodies

function baseLayout(title, content) {
  return `
  <div style="font-family: system-ui, Arial; max-width: 640px; margin:0 auto; padding:16px;">
    <div style="background:#0ea5e9; color:#fff; padding:12px 16px; border-radius:8px 8px 0 0;">
      <strong>Skill‑Swap</strong>
    </div>
    <div style="border:1px solid #e5e7eb; border-top:none; padding:16px; border-radius:0 0 8px 8px;">
      <h2 style="margin:0 0 12px; color:#0f172a;">${title}</h2>
      ${content}
      <p style="margin:16px 0 0; color:#334155;">If you have any questions, please contact our support team at <a href="mailto:support@skillswaphub.in" style="color:#2563eb; text-decoration:none;">support@skillswaphub.in</a>.</p>
      <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb"/>
      <p style="color:#64748b; font-size:12px;">This email was sent automatically by Skill‑Swap. Please do not reply to this message.</p>
    </div>
  </div>`;
}

exports.passwordReset = ({ resetLink, fallbackLink }) => ({
  subject: 'Password Reset Instructions',
  html: baseLayout('Reset Your Password', `
    <p>We received a request to reset the password for your Skill‑Swap account. To proceed, please click the button below. For your security, this link will expire in 30 minutes.</p>
    <p style="margin:24px 0">
      <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Reset Password</a>
    </p
    <p>If you did not request a password reset, no further action is required.</p>
  `)
});

exports.interviewAssigned = ({ interviewerName, company, position, requesterName }) => ({
  subject: 'Interview Request Assigned',
  html: baseLayout('Interview Request Assigned', `
    <p>Dear ${interviewerName},</p>
    <p>An interview request has been assigned to you with the following details:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      <li>Candidate: <b>${requesterName}</b></li>
    </ul>
    <p>Please log in to your dashboard to review and schedule the interview at your earliest convenience.</p>
    <p style="margin-top:16px; color:#334155;">Thank you,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewScheduled = ({ requesterName, company, position, scheduledAt }) => ({
  subject: 'Interview Schedule Confirmation',
  html: baseLayout('Interview Scheduled', `
    <p>Dear ${requesterName},</p>
    <p>Your interview has been scheduled. Please find the details below:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      <li>Date & Time: <b>${scheduledAt}</b></li>
    </ul>
    <p>Kindly ensure your availability. If you need to reschedule, please contact the interviewer through the platform.</p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.sessionRequested = ({ tutorName, requesterName, subject, topic }) => ({
  subject: 'New One‑on‑One Session Request',
  html: baseLayout('New Session Request', `
    <p>Dear ${tutorName},</p>
    <p>You have received a new session request from <b>${requesterName}</b> with the following details:</p>
    <ul>
      <li>Subject: <b>${subject}</b></li>
      <li>Topic: <b>${topic}</b></li>
    </ul>
    <p>Please review the request and respond at your earliest convenience.</p>
    <p style="margin-top:16px; color:#334155;">Thank you,<br/>Skill‑Swap Team</p>
  `)
});

exports.sessionApproved = ({ requesterName, tutorName, subject, topic }) => ({
  subject: 'Session Request Approved',
  html: baseLayout('Session Approved', `
    <p>Dear ${requesterName},</p>
    <p>Your session request has been approved by <b>${tutorName}</b>.</p>
    <ul>
      <li>Subject: <b>${subject}</b></li>
      <li>Topic: <b>${topic}</b></li>
    </ul>
    <p>You will receive further updates regarding the scheduled time. Thank you for using Skill‑Swap.</p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.sessionRejected = ({ requesterName, tutorName, subject, topic }) => ({
  subject: 'Session Request Update',
  html: baseLayout('Session Request Declined', `
    <p>Dear ${requesterName},</p>
    <p>We regret to inform you that your session request was declined by <b>${tutorName}</b>.</p>
    <ul>
      <li>Subject: <b>${subject}</b></li>
      <li>Topic: <b>${topic}</b></li>
    </ul>
    <p>You may submit another request or explore other tutors available on the platform.</p>
    <p style="margin-top:16px; color:#334155;">Sincerely,<br/>Skill‑Swap Team</p>
  `)
});

exports.skillmateSessionCreated = ({ mateName, creatorName, subject, topic }) => ({
  subject: 'SkillMate Session Notification',
  html: baseLayout('New Session from Your SkillMate', `
    <p>Dear ${mateName},</p>
    <p>Your SkillMate, <b>${creatorName}</b>, has created a new session.</p>
    <ul>
      <li>Subject: <b>${subject}</b></li>
      <li>Topic: <b>${topic}</b></li>
    </ul>
    <p>You can join or request participation through your dashboard.</p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

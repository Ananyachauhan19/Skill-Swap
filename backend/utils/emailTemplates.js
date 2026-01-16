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
    </p>
    <p>If you did not request a password reset, no further action is required.</p>
  `)
});

exports.interviewRequestConfirmation = ({ requesterName, company, position }) => ({
  subject: 'Interview Request Submitted Successfully',
  html: baseLayout('Interview Request Received', `
    <p>Dear ${requesterName},</p>
    <p>Your mock interview request has been submitted successfully! We're connecting you with the right expert.</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
    </ul>
    <p>You will receive a notification once an expert accepts your request and schedules the interview.</p>
    <p>You can view your request status anytime by logging into your dashboard.</p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
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

exports.interviewScheduled = ({ requesterName, company, position, scheduledAt, interviewerName }) => ({
  subject: 'Interview Schedule Confirmation',
  html: baseLayout('Interview Scheduled', `
    <p>Dear ${requesterName},</p>
    <p>Your interview has been scheduled. Please find the details below:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      <li>Date & Time: <b>${scheduledAt}</b></li>
      ${interviewerName ? `<li>Interviewer: <b>${interviewerName}</b></li>` : ''}
    </ul>
    <p>Kindly ensure your availability. If you need to reschedule, please contact the interviewer through the platform.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Interview Details</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewScheduledInterviewer = ({ interviewerName, company, position, scheduledAt, candidateName }) => ({
  subject: 'Interview Schedule Confirmation',
  html: baseLayout('Interview Scheduled Successfully', `
    <p>Dear ${interviewerName},</p>
    <p>You have successfully scheduled the interview. Here are the details:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      <li>Date & Time: <b>${scheduledAt}</b></li>
      <li>Candidate: <b>${candidateName}</b></li>
    </ul>
    <p>The candidate has been notified and will be prepared for the session at the scheduled time.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Interview Details</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Thank you,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewRescheduled = ({ requesterName, company, position, scheduledAt, interviewerName }) => ({
  subject: 'Interview Rescheduled',
  html: baseLayout('Interview Rescheduled', `
    <p>Dear ${requesterName},</p>
    <p>Your interview has been rescheduled. Please find the updated details below:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      <li>Updated Date & Time: <b>${scheduledAt}</b></li>
      ${interviewerName ? `<li>Interviewer: <b>${interviewerName}</b></li>` : ''}
    </ul>
    <p>Please ensure your availability at the updated time.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Updated Interview Details</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewRescheduledInterviewer = ({ interviewerName, company, position, scheduledAt, candidateName }) => ({
  subject: 'Interview Rescheduled Confirmation',
  html: baseLayout('Interview Rescheduled Successfully', `
    <p>Dear ${interviewerName},</p>
    <p>You have successfully rescheduled the interview. Here are the updated details:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      <li>Updated Date & Time: <b>${scheduledAt}</b></li>
      <li>Candidate: <b>${candidateName}</b></li>
    </ul>
    <p>The candidate has been notified about the time change.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Interview Details</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Thank you,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewSlotsProposed = ({ requesterName, interviewerName, company, position, slots }) => ({
  subject: 'Interview Time Slots Proposed',
  html: baseLayout('Time Slots Available for Your Interview', `
    <p>Dear ${requesterName},</p>
    <p><b>${interviewerName}</b> has suggested time slots for your mock interview:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
    </ul>
    <p style="margin:16px 0;"><b>Available Time Slots:</b></p>
    <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #2563eb;">
      ${slots}
    </div>
    <p style="margin-top:16px;">Please review and select a time that works best for you.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Choose Time Slot</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewAlternateSlotsProposed = ({ interviewerName, candidateName, company, position, slots, reason }) => ({
  subject: 'Alternate Interview Time Slots Suggested',
  html: baseLayout('Candidate Suggested Alternate Time Slots', `
    <p>Dear ${interviewerName},</p>
    <p><b>${candidateName}</b> has suggested alternate time slots for the mock interview:</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
    </ul>
    <p style="margin:16px 0;"><b>Reason for alternate request:</b></p>
    <div style="background:#fff3cd;padding:12px;border-radius:6px;border-left:4px solid #ffc107;">
      ${reason}
    </div>
    <p style="margin:16px 0;"><b>Alternate Time Slots:</b></p>
    <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #2563eb;">
      ${slots}
    </div>
    <p style="margin-top:16px;">Please review and accept one of the alternate slots or ask the candidate to choose from your original suggestions.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Review Alternate Slots</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Thank you,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewAlternateRejected = ({ requesterName, interviewerName, company, position }) => ({
  subject: 'Alternate Time Slots Not Available',
  html: baseLayout('Please Choose from Original Time Slots', `
    <p>Dear ${requesterName},</p>
    <p><b>${interviewerName}</b> is unable to accommodate the alternate time slots you suggested.</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
    </ul>
    <p style="margin:16px 0;">Please choose from the original time slots suggested by the interviewer to proceed with scheduling your interview.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Original Time Slots</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewPostponed = ({ requesterName, interviewerName, company, position, originalTime, newTime, reason }) => ({
  subject: 'Interview Rescheduled',
  html: baseLayout('Interview Time Updated', `
    <p>Dear ${requesterName},</p>
    <p><b>${interviewerName}</b> has rescheduled your mock interview.</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      <li>Original Time: <b>${originalTime}</b></li>
      <li>New Time: <b>${newTime}</b></li>
      <li>Reason: <b>${reason}</b></li>
    </ul>
    <p style="margin:16px 0;">Your interview has been automatically rescheduled. Please make sure you're available at the new time.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests?tab=interview&view=received" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Interview Details</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.interviewRejected = ({ requesterName, company, position, reason }) => ({
  subject: 'Interview Request Update',
  html: baseLayout('Interview Request Declined', `
    <p>Dear ${requesterName},</p>
    <p>Your mock interview request has been declined.</p>
    <ul>
      <li>Company: <b>${company}</b></li>
      <li>Role: <b>${position}</b></li>
      ${reason ? `<li>Reason: <b>${reason}</b></li>` : ''}
    </ul>
    <p>You can submit a new request or choose a different interviewer.</p>
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

exports.expertSessionInvitation = ({ mateName, creatorName, subject, topic, date, time }) => ({
  subject: 'Expert Session Invitation from Your SkillMate',
  html: baseLayout('Expert Session Invitation', `
    <p>Dear ${mateName},</p>
    <p>Great news! Your SkillMate, <b>${creatorName}</b>, has invited you to an exclusive expert session.</p>
    <ul>
      <li>Subject: <b>${subject}</b></li>
      <li>Topic: <b>${topic}</b></li>
      <li>Date: <b>${date}</b></li>
      <li>Time: <b>${time}</b></li>
    </ul>
    <p>This is a personalized one-on-one session created specifically for you. Please log in to your dashboard to review the details and accept or decline the invitation.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Invitation</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.expertSessionReminder = ({ recipientName, otherPartyName, subject, topic, date, time }) => ({
  subject: 'Reminder: Your expert session starts in 5 minutes',
  html: baseLayout('Session Starting Soon', `
    <p>Hi ${recipientName},</p>
    <p>This is a reminder that your expert session with <b>${otherPartyName}</b> starts in about <b>5 minutes</b>.</p>
    <ul>
      <li>Subject: <b>${subject}</b></li>
      <li>Topic: <b>${topic}</b></li>
      <li>Date: <b>${date}</b></li>
      <li>Time: <b>${time}</b></li>
    </ul>
    <p>Please be ready on time. You can view the session details in your dashboard.</p>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/session-requests" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open Session Requests</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

exports.sessionLive = ({ recipientName, otherPartyName, subject, topic, joinLink }) => ({
  subject: 'Your session is live — join now',
  html: baseLayout('Session Is Live', `
    <p>Hi ${recipientName},</p>
    <p>Your session with <b>${otherPartyName}</b> is now live.</p>
    <ul>
      <li>Subject: <b>${subject || 'N/A'}</b></li>
      <li>Topic: <b>${topic || 'N/A'}</b></li>
    </ul>
    <p style="margin:24px 0">
      <a href="${joinLink}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">Open Join Page</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Team</p>
  `)
});

// ==================== ASSESSMENT NOTIFICATIONS ====================

exports.compulsoryAssessmentNotification = ({ studentName, assessmentTitle, description, startTime, endTime, duration, totalMarks }) => ({
  subject: '🔴 MANDATORY Assessment - Action Required',
  html: baseLayout('MANDATORY Assessment Notification', `
    <div style="background:#fee2e2; border-left:4px solid #dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">
      <p style="margin:0; color:#991b1b; font-weight:bold;">⚠️ THIS IS A COMPULSORY ASSESSMENT</p>
      <p style="margin:8px 0 0; color:#7f1d1d;">You MUST complete this assessment within the specified time window.</p>
    </div>
    <p>Dear ${studentName},</p>
    <p>A new mandatory assessment has been published for your semester. Please review the details below:</p>
    <ul>
      <li><b>Assessment Title:</b> ${assessmentTitle}</li>
      ${description ? `<li><b>Description:</b> ${description}</li>` : ''}
      <li><b>Duration:</b> ${duration} minutes</li>
      <li><b>Total Marks:</b> ${totalMarks}</li>
      <li><b>Available From:</b> ${startTime}</li>
      <li><b>Available Until:</b> ${endTime}</li>
    </ul>
    <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin:16px 0;">
      <p style="margin:0; color:#92400e; font-weight:bold;">⏰ Important Deadline</p>
      <p style="margin:8px 0 0; color:#78350f;">Failure to complete this assessment within the time window will be marked as "Not Attempted" in your records.</p>
    </div>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/student-assessments" style="background:#dc2626;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Take Assessment Now</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Assessment Team</p>
  `)
});

exports.nonCompulsoryAssessmentNotification = ({ studentName, assessmentTitle, description, startTime, endTime, duration, totalMarks }) => ({
  subject: '📝 New Assessment Available',
  html: baseLayout('New Assessment Available', `
    <div style="background:#dbeafe; border-left:4px solid #2563eb; padding:12px; border-radius:4px; margin-bottom:16px;">
      <p style="margin:0; color:#1e40af; font-weight:bold;">ℹ️ OPTIONAL ASSESSMENT</p>
      <p style="margin:8px 0 0; color:#1e3a8a;">This assessment is optional. You may attempt it to enhance your learning.</p>
    </div>
    <p>Dear ${studentName},</p>
    <p>A new optional assessment has been published for your semester. You may choose to attempt it during the available time window:</p>
    <ul>
      <li><b>Assessment Title:</b> ${assessmentTitle}</li>
      ${description ? `<li><b>Description:</b> ${description}</li>` : ''}
      <li><b>Duration:</b> ${duration} minutes</li>
      <li><b>Total Marks:</b> ${totalMarks}</li>
      <li><b>Available From:</b> ${startTime}</li>
      <li><b>Available Until:</b> ${endTime}</li>
    </ul>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/student-assessments" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;">View Assessment</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Assessment Team</p>
  `)
});

exports.assessmentReminder = ({ studentName, assessmentTitle, endTime, hoursRemaining }) => ({
  subject: '⏰ Reminder: Assessment Deadline Approaching',
  html: baseLayout('Assessment Deadline Reminder', `
    <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin-bottom:16px;">
      <p style="margin:0; color:#92400e; font-weight:bold;">⚠️ DEADLINE APPROACHING</p>
      <p style="margin:8px 0 0; color:#78350f;">Only ${hoursRemaining} hours remaining to complete this assessment!</p>
    </div>
    <p>Dear ${studentName},</p>
    <p>This is a reminder that the following mandatory assessment is ending soon:</p>
    <ul>
      <li><b>Assessment Title:</b> ${assessmentTitle}</li>
      <li><b>Deadline:</b> ${endTime}</li>
      <li><b>Time Remaining:</b> Approximately ${hoursRemaining} hours</li>
    </ul>
    <p style="margin:24px 0">
      <a href="https://skillswaphub.in/student-assessments" style="background:#dc2626;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Take Assessment Now</a>
    </p>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>Skill‑Swap Assessment Team</p>
  `)
});

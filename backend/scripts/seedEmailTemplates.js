const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Base layout function for template construction
function baseLayout(title, content) {
  return `
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
}

const emailTemplates = [
  {
    templateKey: 'passwordReset',
    name: 'Password Reset Instructions',
    description: 'Email sent when user requests a password reset',
    category: 'authentication',
    subject: 'Password Reset Instructions',
    htmlBody: baseLayout('Reset Your Password', `
    <p>We received a request to reset the password for your SkillSwap Hub account.</p>
    <p>To proceed, please use the link below. For your security, this link will expire in 30 minutes.</p>
    <p style="margin:16px 0; padding:12px; background:#f8fafc; border-radius:6px; word-break:break-all;">
      <a href="\${resetLink}" style="color:#2563eb; text-decoration:underline;">\${resetLink}</a>
    </p>
    <p>If you did not request a password reset, no further action is required.</p>
  `),
    variables: ['resetLink', 'fallbackLink']
  },
  {
    templateKey: 'interviewRequestConfirmation',
    name: 'Interview Request Submitted',
    description: 'Confirmation sent to requester after submitting interview request',
    category: 'interview',
    subject: 'Interview Request Submitted Successfully',
    htmlBody: baseLayout('Interview Request Received', `
    <p>Dear \${requesterName},</p>
    <p>Your mock interview request has been submitted successfully! We're connecting you with the right expert.</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
    </ul>
    <p>You will receive a notification once an expert accepts your request and schedules the interview.</p>
    <p>You can view your request status anytime by logging into your dashboard.</p>
  `),
    variables: ['requesterName', 'company', 'position']
  },
  {
    templateKey: 'interviewAssigned',
    name: 'Interview Request Assigned',
    description: 'Notification sent to interviewer when request is assigned',
    category: 'interview',
    subject: 'Interview Request Assigned',
    htmlBody: baseLayout('Interview Request Assigned', `
    <p>Dear \${interviewerName},</p>
    <p>An interview request has been assigned to you with the following details:</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
      <li>Candidate: <b>\${requesterName}</b></li>
    </ul>
    <p>Please log in to your dashboard to review and schedule the interview at your earliest convenience.</p>
  `),
    variables: ['interviewerName', 'company', 'position', 'requesterName']
  },
  {
    templateKey: 'interviewScheduled',
    name: 'Interview Scheduled (Candidate)',
    description: 'Confirmation sent to candidate when interview is scheduled',
    category: 'interview',
    subject: 'Interview Schedule Confirmation',
    htmlBody: baseLayout('Interview Scheduled', `
    <p>Dear \${requesterName},</p>
    <p>Your interview has been scheduled. Please find the details below:</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
      <li>Date & Time: <b>\${scheduledAt}</b></li>
      \${interviewerName ? '<li>Interviewer: <b>' + interviewerName + '</b></li>' : ''}
    </ul>
    <p>Kindly ensure your availability. If you need to reschedule, please contact the interviewer through the platform.</p>
  `),
    variables: ['requesterName', 'company', 'position', 'scheduledAt', 'interviewerName']
  },
  {
    templateKey: 'interviewScheduledInterviewer',
    name: 'Interview Scheduled (Interviewer)',
    description: 'Confirmation sent to interviewer when they schedule an interview',
    category: 'interview',
    subject: 'Interview Schedule Confirmation',
    htmlBody: baseLayout('Interview Scheduled Successfully', `
    <p>Dear \${interviewerName},</p>
    <p>You have successfully scheduled the interview. Here are the details:</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
      <li>Date & Time: <b>\${scheduledAt}</b></li>
      <li>Candidate: <b>\${candidateName}</b></li>
    </ul>
    <p>The candidate has been notified and will be prepared for the session at the scheduled time.</p>
  `),
    variables: ['interviewerName', 'company', 'position', 'scheduledAt', 'candidateName']
  },
  {
    templateKey: 'interviewRescheduled',
    name: 'Interview Rescheduled (Candidate)',
    description: 'Notification sent to candidate when interview is rescheduled',
    category: 'interview',
    subject: 'Interview Rescheduled',
    htmlBody: baseLayout('Interview Rescheduled', `
    <p>Dear \${requesterName},</p>
    <p>Your interview has been rescheduled. Please find the updated details below:</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
      <li>Updated Date & Time: <b>\${scheduledAt}</b></li>
      \${interviewerName ? '<li>Interviewer: <b>' + interviewerName + '</b></li>' : ''}
    </ul>
    <p>Please ensure your availability at the updated time.</p>
  `),
    variables: ['requesterName', 'company', 'position', 'scheduledAt', 'interviewerName']
  },
  {
    templateKey: 'interviewRescheduledInterviewer',
    name: 'Interview Rescheduled (Interviewer)',
    description: 'Confirmation sent to interviewer when they reschedule an interview',
    category: 'interview',
    subject: 'Interview Rescheduled Confirmation',
    htmlBody: baseLayout('Interview Rescheduled Successfully', `
    <p>Dear \${interviewerName},</p>
    <p>You have successfully rescheduled the interview. Here are the updated details:</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
      <li>Updated Date & Time: <b>\${scheduledAt}</b></li>
      <li>Candidate: <b>\${candidateName}</b></li>
    </ul>
    <p>The candidate has been notified about the time change.</p>
  `),
    variables: ['interviewerName', 'company', 'position', 'scheduledAt', 'candidateName']
  },
  {
    templateKey: 'interviewSlotsProposed',
    name: 'Interview Time Slots Proposed',
    description: 'Notification sent to candidate when interviewer proposes time slots',
    category: 'interview',
    subject: 'Interview Time Slots Proposed',
    htmlBody: baseLayout('Time Slots Available for Your Interview', `
    <p>Dear \${requesterName},</p>
    <p><b>\${interviewerName}</b> has suggested time slots for your mock interview:</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
    </ul>
    <p style="margin:16px 0;"><b>Available Time Slots:</b></p>
    <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #2563eb;">
      \${slots}
    </div>
    <p style="margin-top:16px;">Please review and select a time that works best for you.</p>
  `),
    variables: ['requesterName', 'interviewerName', 'company', 'position', 'slots']
  },
  {
    templateKey: 'interviewAlternateSlotsProposed',
    name: 'Alternate Interview Slots Proposed',
    description: 'Notification sent to interviewer when candidate proposes alternate slots',
    category: 'interview',
    subject: 'Alternate Interview Time Slots Suggested',
    htmlBody: baseLayout('Candidate Suggested Alternate Time Slots', `
    <p>Dear \${interviewerName},</p>
    <p><b>\${candidateName}</b> has suggested alternate time slots for the mock interview:</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
    </ul>
    <p style="margin:16px 0;"><b>Reason for alternate request:</b></p>
    <div style="background:#fff3cd;padding:12px;border-radius:6px;border-left:4px solid #ffc107;">
      \${reason}
    </div>
    <p style="margin:16px 0;"><b>Alternate Time Slots:</b></p>
    <div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #2563eb;">
      \${slots}
    </div>
    <p style="margin-top:16px;">Please review and accept one of the alternate slots or ask the candidate to choose from your original suggestions.</p>
  `),
    variables: ['interviewerName', 'candidateName', 'company', 'position', 'reason', 'slots']
  },
  {
    templateKey: 'interviewAlternateRejected',
    name: 'Alternate Slots Rejected',
    description: 'Notification sent to candidate when interviewer rejects alternate slots',
    category: 'interview',
    subject: 'Alternate Time Slots Not Available',
    htmlBody: baseLayout('Please Choose from Original Time Slots', `
    <p>Dear \${requesterName},</p>
    <p><b>\${interviewerName}</b> is unable to accommodate the alternate time slots you suggested.</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
    </ul>
    <p style="margin:16px 0;">Please choose from the original time slots suggested by the interviewer to proceed with scheduling your interview.</p>
  `),
    variables: ['requesterName', 'interviewerName', 'company', 'position']
  },
  {
    templateKey: 'interviewRejected',
    name: 'Interview Request Declined',
    description: 'Notification sent to candidate when interview request is rejected',
    category: 'interview',
    subject: 'Interview Request Update',
    htmlBody: baseLayout('Interview Request Declined', `
    <p>Dear \${requesterName},</p>
    <p>Your mock interview request has been declined.</p>
    <ul>
      <li>Company: <b>\${company}</b></li>
      <li>Role: <b>\${position}</b></li>
      \${reason ? '<li>Reason: <b>' + reason + '</b></li>' : ''}
    </ul>
    <p>You can submit a new request or choose a different interviewer.</p>
  `),
    variables: ['requesterName', 'company', 'position', 'reason']
  },
  {
    templateKey: 'sessionRequested',
    name: 'New Session Request',
    description: 'Notification sent to tutor when session is requested',
    category: 'session',
    subject: 'New One‑on‑One Session Request',
    htmlBody: baseLayout('New Session Request', `
    <p>Dear \${tutorName},</p>
    <p>You have received a new session request from <b>\${requesterName}</b> with the following details:</p>
    <ul>
      <li>Subject: <b>\${subject}</b></li>
      <li>Topic: <b>\${topic}</b></li>
    </ul>
    <p>Please review the request and respond at your earliest convenience.</p>
  `),
    variables: ['tutorName', 'requesterName', 'subject', 'topic']
  },
  {
    templateKey: 'sessionApproved',
    name: 'Session Request Approved',
    description: 'Notification sent to requester when session is approved',
    category: 'session',
    subject: 'Session Request Approved',
    htmlBody: baseLayout('Session Approved', `
    <p>Dear \${requesterName},</p>
    <p>Your session request has been approved by <b>\${tutorName}</b>.</p>
    <ul>
      <li>Subject: <b>\${subject}</b></li>
      <li>Topic: <b>\${topic}</b></li>
    </ul>
    <p>You will receive further updates regarding the scheduled time. Thank you for using SkillSwap Hub.</p>
  `),
    variables: ['requesterName', 'tutorName', 'subject', 'topic']
  },
  {
    templateKey: 'sessionRejected',
    name: 'Session Request Declined',
    description: 'Notification sent to requester when session is rejected',
    category: 'session',
    subject: 'Session Request Update',
    htmlBody: baseLayout('Session Request Declined', `
    <p>Dear \${requesterName},</p>
    <p>We regret to inform you that your session request was declined by <b>\${tutorName}</b>.</p>
    <ul>
      <li>Subject: <b>\${subject}</b></li>
      <li>Topic: <b>\${topic}</b></li>
    </ul>
    <p>You may submit another request or explore other tutors available on the platform.</p>
  `),
    variables: ['requesterName', 'tutorName', 'subject', 'topic']
  },
  {
    templateKey: 'skillmateSessionCreated',
    name: 'SkillMate Session Created',
    description: 'Notification sent to skillmate when session is created',
    category: 'session',
    subject: 'SkillMate Session Notification',
    htmlBody: baseLayout('New Session from Your SkillMate', `
    <p>Dear \${mateName},</p>
    <p>Your SkillMate, <b>\${creatorName}</b>, has created a new session.</p>
    <ul>
      <li>Subject: <b>\${subject}</b></li>
      <li>Topic: <b>\${topic}</b></li>
    </ul>
    <p>You can join or request participation through your dashboard.</p>
  `),
    variables: ['mateName', 'creatorName', 'subject', 'topic']
  },
  {
    templateKey: 'expertSessionInvitation',
    name: 'Expert Session Invitation',
    description: 'Invitation sent to skillmate for expert session',
    category: 'session',
    subject: 'Expert Session Invitation from Your SkillMate',
    htmlBody: baseLayout('Expert Session Invitation', `
    <p>Dear \${mateName},</p>
    <p>Great news! Your SkillMate, <b>\${creatorName}</b>, has invited you to an exclusive expert session.</p>
    <ul>
      <li>Subject: <b>\${subject}</b></li>
      <li>Topic: <b>\${topic}</b></li>
      <li>Date: <b>\${date}</b></li>
      <li>Time: <b>\${time}</b></li>
    </ul>
    <p>This is a personalized one-on-one session created specifically for you. Please log in to your dashboard to review the details and accept or decline the invitation.</p>
  `),
    variables: ['mateName', 'creatorName', 'subject', 'topic', 'date', 'time']
  },
  {
    templateKey: 'expertSessionReminder',
    name: 'Expert Session Reminder',
    description: 'Reminder sent 5 minutes before expert session starts',
    category: 'session',
    subject: 'Reminder: Your expert session starts in 5 minutes',
    htmlBody: baseLayout('Session Starting Soon', `
    <p>Hi \${recipientName},</p>
    <p>This is a reminder that your expert session with <b>\${otherPartyName}</b> starts in about <b>5 minutes</b>.</p>
    <ul>
      <li>Subject: <b>\${subject}</b></li>
      <li>Topic: <b>\${topic}</b></li>
      <li>Date: <b>\${date}</b></li>
      <li>Time: <b>\${time}</b></li>
    </ul>
    <p>Please be ready on time. You can view the session details in your dashboard.</p>
  `),
    variables: ['recipientName', 'otherPartyName', 'subject', 'topic', 'date', 'time']
  },
  {
    templateKey: 'sessionLive',
    name: 'Session Is Live',
    description: 'Notification when session becomes live',
    category: 'session',
    subject: 'Your session is live — join now',
    htmlBody: baseLayout('Session Is Live', `
    <p>Hi \${recipientName},</p>
    <p>Your session with <b>\${otherPartyName}</b> is now live.</p>
    <ul>
      <li>Subject: <b>\${subject}</b></li>
      <li>Topic: <b>\${topic}</b></li>
    </ul>
    <p style="margin:16px 0; padding:12px; background:#f8fafc; border-radius:6px; word-break:break-all;">
      <a href="\${joinLink}" style="color:#2563eb; text-decoration:underline;">Click here to join: \${joinLink}</a>
    </p>
  `),
    variables: ['recipientName', 'otherPartyName', 'subject', 'topic', 'joinLink']
  },
  {
    templateKey: 'compulsoryAssessmentNotification',
    name: 'Mandatory Assessment Notification',
    description: 'Notification for mandatory assessment publication',
    category: 'assessment',
    subject: '🔴 MANDATORY Assessment - Action Required',
    htmlBody: baseLayout('MANDATORY Assessment Notification', `
    <div style="background:#fee2e2; border-left:4px solid #dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">
      <p style="margin:0; color:#991b1b; font-weight:bold;">⚠️ THIS IS A COMPULSORY ASSESSMENT</p>
      <p style="margin:8px 0 0; color:#7f1d1d;">You MUST complete this assessment within the specified time window.</p>
    </div>
    <p>Dear \${studentName},</p>
    <p>A new mandatory assessment has been published for your semester. Please review the details below:</p>
    <ul>
      <li><b>Assessment Title:</b> \${assessmentTitle}</li>
      \${description ? '<li><b>Description:</b> ' + description + '</li>' : ''}
      <li><b>Duration:</b> \${duration} minutes</li>
      <li><b>Total Marks:</b> \${totalMarks}</li>
      <li><b>Available From:</b> \${startTime}</li>
      <li><b>Available Until:</b> \${endTime}</li>
    </ul>
    <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin:16px 0;">
      <p style="margin:0; color:#92400e; font-weight:bold;">⏰ Important Deadline</p>
      <p style="margin:8px 0 0; color:#78350f;">Failure to complete this assessment within the time window will be marked as "Not Attempted" in your records.</p>
    </div>
  `),
    variables: ['studentName', 'assessmentTitle', 'description', 'startTime', 'endTime', 'duration', 'totalMarks']
  },
  {
    templateKey: 'nonCompulsoryAssessmentNotification',
    name: 'Optional Assessment Notification',
    description: 'Notification for optional assessment publication',
    category: 'assessment',
    subject: '📝 New Assessment Available',
    htmlBody: baseLayout('New Assessment Available', `
    <div style="background:#dbeafe; border-left:4px solid #2563eb; padding:12px; border-radius:4px; margin-bottom:16px;">
      <p style="margin:0; color:#1e40af; font-weight:bold;">ℹ️ OPTIONAL ASSESSMENT</p>
      <p style="margin:8px 0 0; color:#1e3a8a;">This assessment is optional. You may attempt it to enhance your learning.</p>
    </div>
    <p>Dear \${studentName},</p>
    <p>A new optional assessment has been published for your semester. You may choose to attempt it during the available time window:</p>
    <ul>
      <li><b>Assessment Title:</b> \${assessmentTitle}</li>
      \${description ? '<li><b>Description:</b> ' + description + '</li>' : ''}
      <li><b>Duration:</b> \${duration} minutes</li>
      <li><b>Total Marks:</b> \${totalMarks}</li>
      <li><b>Available From:</b> \${startTime}</li>
      <li><b>Available Until:</b> \${endTime}</li>
    </ul>
  `),
    variables: ['studentName', 'assessmentTitle', 'description', 'startTime', 'endTime', 'duration', 'totalMarks']
  },
  {
    templateKey: 'assessmentReminder',
    name: 'Assessment Deadline Reminder',
    description: 'Reminder sent before assessment deadline',
    category: 'assessment',
    subject: '⏰ Reminder: Assessment Deadline Approaching',
    htmlBody: baseLayout('Assessment Deadline Reminder', `
    <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin-bottom:16px;">
      <p style="margin:0; color:#92400e; font-weight:bold;">⚠️ DEADLINE APPROACHING</p>
      <p style="margin:8px 0 0; color:#78350f;">Only \${hoursRemaining} hours remaining to complete this assessment!</p>
    </div>
    <p>Dear \${studentName},</p>
    <p>This is a reminder that the following mandatory assessment is ending soon:</p>
    <ul>
      <li><b>Assessment Title:</b> \${assessmentTitle}</li>
      <li><b>Deadline:</b> \${endTime}</li>
      <li><b>Time Remaining:</b> Approximately \${hoursRemaining} hours</li>
    </ul>
  `),
    variables: ['studentName', 'assessmentTitle', 'endTime', 'hoursRemaining']
  }
];

async function seedEmailTemplates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Insert or update templates
    for (const template of emailTemplates) {
      await EmailTemplate.findOneAndUpdate(
        { templateKey: template.templateKey },
        template,
        { upsert: true, new: true }
      );
      console.log(`✓ Seeded template: ${template.name}`);
    }

    console.log('\n✅ All email templates seeded successfully!');
    console.log(`Total templates: ${emailTemplates.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding email templates:', error);
    process.exit(1);
  }
}

// Run the seed function
seedEmailTemplates();

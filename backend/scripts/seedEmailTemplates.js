const mongoose = require('mongoose');
const EmailTemplate = require('../models/EmailTemplate');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// NOTE: Templates now store ONLY content, not the full layout
// The base_email_layout template is automatically applied by dynamicEmailTemplate.js
// To update header/footer/branding for ALL emails, edit the base_email_layout template in admin panel

const emailTemplates = [
  {
    templateKey: 'base_email_layout',
    name: 'Base Email Layout (Master Template)',
    description: 'Master layout template used as wrapper for all emails. Customize header, footer, and overall styling here.',
    category: 'general',
    subject: 'N/A (This is a layout template)',
    htmlBody: `<div style="font-family: system-ui, Arial; max-width: 640px; margin:0 auto; padding:16px;">
  <div style="background:#0ea5e9; color:#fff; padding:12px 16px; border-radius:8px 8px 0 0;">
    <strong>SkillSwap Hub</strong>
  </div>
  <div style="border:1px solid #e5e7eb; border-top:none; padding:16px; border-radius:0 0 8px 8px;">
    <h2 style="margin:0 0 12px; color:#0f172a;">\${title}</h2>
    \${content}
    <div style="text-align:center; margin:24px 0;">
      <a href="https://skillswaphub.in" style="display:inline-block; background:#0ea5e9; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:500;">Go to Dashboard</a>
    </div>
    <p style="margin-top:16px; color:#334155;">Best regards,<br/>SkillSwap Hub Team</p>
    <p style="margin:16px 0 0; color:#334155;">If you have any questions, please contact our support team at <a href="mailto:info@skillswaphub.in" style="color:#2563eb; text-decoration:none;">info@skillswaphub.in</a>.</p>
    <hr style="margin:24px 0; border:none; border-top:1px solid #e5e7eb"/>
    <p style="color:#64748b; font-size:12px;">This email was sent automatically by SkillSwap Hub. Please do not reply to this message.</p>
  </div>
</div>`,
    variables: ['title', 'content']
  },
  {
    templateKey: 'passwordReset',
    name: 'Reset Your Password',
    description: 'Email sent when user requests a password reset',
    category: 'authentication',
    subject: 'Password Reset Instructions',
    htmlBody: `<p>We received a request to reset the password for your SkillSwap Hub account.</p>
<p>To proceed, please use the link below. For your security, this link will expire in 30 minutes.</p>
<p style="margin:16px 0; padding:12px; background:#f8fafc; border-radius:6px; word-break:break-all;">
  <a href="\${resetLink}" style="color:#2563eb; text-decoration:underline;">\${resetLink}</a>
</p>
<p>If you did not request a password reset, no further action is required.</p>`,
    variables: ['resetLink', 'fallbackLink']
  },
  {
    templateKey: 'interviewRequestConfirmation',
    name: 'Interview Request Received',
    description: 'Confirmation sent to requester after submitting interview request',
    category: 'interview',
    subject: 'Interview Request Submitted Successfully',
    htmlBody: `<p>Dear \${requesterName},</p>
<p>Your mock interview request has been submitted successfully! We're connecting you with the right expert.</p>
<ul>
  <li>Company: <b>\${company}</b></li>
  <li>Role: <b>\${position}</b></li>
</ul>
<p>You will receive a notification once an expert accepts your request and schedules the interview.</p>
<p>You can view your request status anytime by logging into your dashboard.</p>`,
    variables: ['requesterName', 'company', 'position']
  },
  {
    templateKey: 'interviewRequested',
    name: 'New Interview Request',
    description: 'Notification sent to interviewer when a candidate directly requests them for an interview',
    category: 'interview',
    subject: 'New Interview Request from \${requesterName}',
    htmlBody: `<div style="background:#dbeafe; border-left:4px solid #2563eb; padding:12px; border-radius:4px; margin-bottom:16px;">
  <p style="margin:0; color:#1e40af; font-weight:bold;">📩 NEW INTERVIEW REQUEST</p>
</div>
<p>Dear \${interviewerName},</p>
<p><b>\${requesterName}</b> has requested you for a mock interview with the following details:</p>
<ul>
  <li><b>Company:</b> \${company}</li>
  <li><b>Position:</b> \${position}</li>
  <li><b>Candidate:</b> \${requesterName}</li>
</ul>
\${messageBlock}
<p>Please log in to your dashboard to review the candidate's profile and schedule the interview at your earliest convenience.</p>`,
    variables: ['interviewerName', 'requesterName', 'company', 'position', 'messageBlock']
  },
  {
    templateKey: 'interviewAssigned',
    name: 'Interview Request Assigned',
    description: 'Notification sent to interviewer when request is assigned by admin',
    category: 'interview',
    subject: 'Interview Request Assigned',
    htmlBody: `<p>Dear \${interviewerName},</p>
<p>An interview request has been assigned to you with the following details:</p>
<ul>
  <li>Company: <b>\${company}</b></li>
  <li>Role: <b>\${position}</b></li>
  <li>Candidate: <b>\${requesterName}</b></li>
</ul>
<p>Please log in to your dashboard to review and schedule the interview at your earliest convenience.</p>`,
    variables: ['interviewerName', 'company', 'position', 'requesterName']
  },
  {
    templateKey: 'interviewScheduled',
    name: 'Interview Scheduled (Candidate)',
    description: 'Confirmation sent to candidate when interview is scheduled',
    category: 'interview',
    subject: 'Interview Schedule Confirmation',
    htmlBody: `<p>Dear \${requesterName},</p>
<p>Your interview has been scheduled. Please find the details below:</p>
<ul>
  <li>Company: <b>\${company}</b></li>
  <li>Role: <b>\${position}</b></li>
  <li>Date & Time: <b>\${scheduledAt}</b></li>
  \${interviewerName ? '<li>Interviewer: <b>' + interviewerName + '</b></li>' : ''}
</ul>
<p>Kindly ensure your availability. If you need to reschedule, please contact the interviewer through the platform.</p>`,
    variables: ['requesterName', 'company', 'position', 'scheduledAt', 'interviewerName']
  },
  {
    templateKey: 'interviewScheduledInterviewer',
    name: 'Interview Scheduled Successfully',
    description: 'Confirmation sent to interviewer when they schedule an interview',
    category: 'interview',
    subject: 'Interview Schedule Confirmation',
    htmlBody: `<p>Dear \${interviewerName},</p>
<p>You have successfully scheduled the interview. Here are the details:</p>
<ul>
  <li>Company: <b>\${company}</b></li>
  <li>Role: <b>\${position}</b></li>
  <li>Date & Time: <b>\${scheduledAt}</b></li>
  <li>Candidate: <b>\${candidateName}</b></li>
</ul>
<p>The candidate has been notified and will be prepared for the session at the scheduled time.</p>`,
    variables: ['interviewerName', 'company', 'position', 'scheduledAt', 'candidateName']
  },
  {
    templateKey: 'interviewSlotsProposed',
    name: 'Time Slots Available for Your Interview',
    description: 'Notification sent to candidate when interviewer proposes time slots',
    category: 'interview',
    subject: 'Interview Time Slots Proposed',
    htmlBody: `<p>Dear \${requesterName},</p>
<p><b>\${interviewerName}</b> has suggested time slots for your mock interview:</p>
<ul>
  <li>Company: <b>\${company}</b></li>
  <li>Role: <b>\${position}</b></li>
</ul>
<p style="margin:16px 0;"><b>Available Time Slots:</b></p>
<div style="background:#f8fafc;padding:12px;border-radius:6px;border-left:4px solid #2563eb;">
  \${slots}
</div>
<p style="margin-top:16px;">Please review and select a time that works best for you.</p>`,
    variables: ['requesterName', 'interviewerName', 'company', 'position', 'slots']
  },
  {
    templateKey: 'interviewAlternateSlotsProposed',
    name: 'Candidate Suggested Alternate Time Slots',
    description: 'Notification sent to interviewer when candidate proposes alternate slots',
    category: 'interview',
    subject: 'Alternate Interview Time Slots Suggested',
    htmlBody: `<p>Dear \${interviewerName},</p>
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
<p style="margin-top:16px;">Please review and accept one of the alternate slots or ask the candidate to choose from your original suggestions.</p>`,
    variables: ['interviewerName', 'candidateName', 'company', 'position', 'reason', 'slots']
  },
  {
    templateKey: 'interviewAlternateRejected',
    name: 'Please Choose from Original Time Slots',
    description: 'Notification sent to candidate when interviewer rejects alternate slots',
    category: 'interview',
    subject: 'Alternate Time Slots Not Available',
    htmlBody: `<p>Dear \${requesterName},</p>
<p><b>\${interviewerName}</b> is unable to accommodate the alternate time slots you suggested.</p>
<ul>
  <li>Company: <b>\${company}</b></li>
  <li>Role: <b>\${position}</b></li>
</ul>
<p style="margin:16px 0;">Please choose from the original time slots suggested by the interviewer to proceed with scheduling your interview.</p>`,
    variables: ['requesterName', 'interviewerName', 'company', 'position']
  },
  {
    templateKey: 'interviewRejected',
    name: 'Interview Request Declined',
    description: 'Notification sent to candidate when interview request is rejected',
    category: 'interview',
    subject: 'Interview Request Update',
    htmlBody: `<p>Dear \${requesterName},</p>
<p>Your mock interview request has been declined.</p>
<ul>
  <li>Company: <b>\${company}</b></li>
  <li>Role: <b>\${position}</b></li>
  \${reason ? '<li>Reason: <b>' + reason + '</b></li>' : ''}
</ul>
<p>You can submit a new request or choose a different interviewer.</p>`,
    variables: ['requesterName', 'company', 'position', 'reason']
  },
  {
    templateKey: 'sessionRequested',
    name: 'New Session Request',
    description: 'Notification sent to tutor when session is requested',
    category: 'session',
    subject: 'New One‑on‑One Session Request',
    htmlBody: `<p>Dear \${tutorName},</p>
<p>You have received a new session request from <b>\${requesterName}</b> with the following details:</p>
<ul>
  <li>Subject: <b>\${subject}</b></li>
  <li>Topic: <b>\${topic}</b></li>
</ul>
<p>Please review the request and respond at your earliest convenience.</p>`,
    variables: ['tutorName', 'requesterName', 'subject', 'topic']
  },
  {
    templateKey: 'sessionApproved',
    name: 'Session Approved',
    description: 'Notification sent to requester when session is approved',
    category: 'session',
    subject: 'Session Request Approved',
    htmlBody: `<p>Dear \${requesterName},</p>
<p>Your session request has been approved by <b>\${tutorName}</b>.</p>
<ul>
  <li>Subject: <b>\${subject}</b></li>
  <li>Topic: <b>\${topic}</b></li>
</ul>
<p>You will receive further updates regarding the scheduled time. Thank you for using SkillSwap Hub.</p>`,
    variables: ['requesterName', 'tutorName', 'subject', 'topic']
  },
  {
    templateKey: 'sessionRejected',
    name: 'Session Request Declined',
    description: 'Notification sent to requester when session is rejected',
    category: 'session',
    subject: 'Session Request Update',
    htmlBody: `<p>Dear \${requesterName},</p>
<p>We regret to inform you that your session request was declined by <b>\${tutorName}</b>.</p>
<ul>
  <li>Subject: <b>\${subject}</b></li>
  <li>Topic: <b>\${topic}</b></li>
</ul>
<p>You may submit another request or explore other tutors available on the platform.</p>`,
    variables: ['requesterName', 'tutorName', 'subject', 'topic']
  },
  {
    templateKey: 'expertSessionInvitation',
    name: 'Expert Session Invitation',
    description: 'Invitation sent to skillmate for expert session',
    category: 'session',
    subject: 'Expert Session Invitation from Your SkillMate',
    htmlBody: `<p>Dear \${mateName},</p>
<p>Great news! Your SkillMate, <b>\${creatorName}</b>, has invited you to an exclusive expert session.</p>
<ul>
  <li>Subject: <b>\${subject}</b></li>
  <li>Topic: <b>\${topic}</b></li>
  <li>Date: <b>\${date}</b></li>
  <li>Time: <b>\${time}</b></li>
</ul>
<p>This is a personalized one-on-one session created specifically for you. Please log in to your dashboard to review the details and accept or decline the invitation.</p>`,
    variables: ['mateName', 'creatorName', 'subject', 'topic', 'date', 'time']
  },
  {
    templateKey: 'expertSessionReminder',
    name: 'Session Starting Soon',
    description: 'Reminder sent 5 minutes before expert session starts',
    category: 'session',
    subject: 'Reminder: Your expert session starts in 5 minutes',
    htmlBody: `<p>Hi \${recipientName},</p>
<p>This is a reminder that your expert session with <b>\${otherPartyName}</b> starts in about <b>5 minutes</b>.</p>
<ul>
  <li>Subject: <b>\${subject}</b></li>
  <li>Topic: <b>\${topic}</b></li>
  <li>Date: <b>\${date}</b></li>
  <li>Time: <b>\${time}</b></li>
</ul>
<p>Please be ready on time. You can view the session details in your dashboard.</p>`,
    variables: ['recipientName', 'otherPartyName', 'subject', 'topic', 'date', 'time']
  },
  {
    templateKey: 'sessionLive',
    name: 'Session Is Live',
    description: 'Notification when session becomes live',
    category: 'session',
    subject: 'Your session is live — join now',
    htmlBody: `<p>Hi \${recipientName},</p>
<p>Your session with <b>\${otherPartyName}</b> is now live.</p>
<ul>
  <li>Subject: <b>\${subject}</b></li>
  <li>Topic: <b>\${topic}</b></li>
</ul>
<p style="margin:16px 0; padding:12px; background:#f8fafc; border-radius:6px; word-break:break-all;">
  <a href="\${joinLink}" style="color:#2563eb; text-decoration:underline;">Click here to join: \${joinLink}</a>
</p>`,
    variables: ['recipientName', 'otherPartyName', 'subject', 'topic', 'joinLink']
  },
  {
    templateKey: 'compulsoryAssessmentNotification',
    name: 'MANDATORY Assessment Notification',
    description: 'Notification for mandatory assessment publication',
    category: 'assessment',
    subject: '🔴 MANDATORY Assessment - Action Required',
    htmlBody: `<div style="background:#fee2e2; border-left:4px solid #dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">
  <p style="margin:0; color:#991b1b; font-weight:bold;">⚠️ THIS IS A COMPULSORY ASSESSMENT</p>
  <p style="margin:8px 0 0; color:#7f1d1d;">You MUST complete this assessment within the specified time window.</p>
</div>
<p>Dear \${studentName},</p>
<p>A new mandatory assessment has been published for your semester. Please review the details below:</p>
<ul>
  <li><b>Assessment Title:</b> \${assessmentTitle}</li>
  \${descriptionRow}
  <li><b>Duration:</b> \${duration} minutes</li>
  <li><b>Total Marks:</b> \${totalMarks}</li>
  <li><b>Available From:</b> \${startTime}</li>
  <li><b>Available Until:</b> \${endTime}</li>
</ul>
<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin:16px 0;">
  <p style="margin:0; color:#92400e; font-weight:bold;">⏰ Important Deadline</p>
  <p style="margin:8px 0 0; color:#78350f;">Failure to complete this assessment within the time window will be marked as "Not Attempted" in your records.</p>
</div>`,
    variables: ['studentName', 'assessmentTitle', 'descriptionRow', 'startTime', 'endTime', 'duration', 'totalMarks']
  },
  {
    templateKey: 'nonCompulsoryAssessmentNotification',
    name: 'New Assessment Available',
    description: 'Notification for optional assessment publication',
    category: 'assessment',
    subject: '📝 New Assessment Available',
    htmlBody: `<div style="background:#dbeafe; border-left:4px solid #2563eb; padding:12px; border-radius:4px; margin-bottom:16px;">
  <p style="margin:0; color:#1e40af; font-weight:bold;">ℹ️ OPTIONAL ASSESSMENT</p>
  <p style="margin:8px 0 0; color:#1e3a8a;">This assessment is optional. You may attempt it to enhance your learning.</p>
</div>
<p>Dear \${studentName},</p>
<p>A new assessment has been published for your semester. You may choose to attempt it during the available time window:</p>
<ul>
  <li><b>Assessment Title:</b> \${assessmentTitle}</li>
  \${descriptionRow}
  <li><b>Duration:</b> \${duration} minutes</li>
  <li><b>Total Marks:</b> \${totalMarks}</li>
  <li><b>Available From:</b> \${startTime}</li>
  <li><b>Available Until:</b> \${endTime}</li>
</ul>`,
    variables: ['studentName', 'assessmentTitle', 'descriptionRow', 'startTime', 'endTime', 'duration', 'totalMarks']
  },
  {
    templateKey: 'assessmentReminder',
    name: 'Assessment Deadline Reminder',
    description: 'Reminder sent before assessment deadline',
    category: 'assessment',
    subject: '⏰ Reminder: Assessment Deadline Approaching',
    htmlBody: `<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin-bottom:16px;">
  <p style="margin:0; color:#92400e; font-weight:bold;">⚠️ DEADLINE APPROACHING</p>
  <p style="margin:8px 0 0; color:#78350f;">Only \${hoursRemaining} hours remaining to complete this assessment!</p>
</div>
<p>Dear \${studentName},</p>
<p>This is a reminder that the following mandatory assessment is ending soon:</p>
<ul>
  <li><b>Assessment Title:</b> \${assessmentTitle}</li>
  <li><b>Deadline:</b> \${endTime}</li>
  <li><b>Time Remaining:</b> Approximately \${hoursRemaining} hours</li>
</ul>`,
    variables: ['studentName', 'assessmentTitle', 'endTime', 'hoursRemaining']
  },
  {
    templateKey: 'help_request_notification',
    name: 'New Help Request',
    description: 'Email sent to support team when a user submits a help request',
    category: 'support',
    subject: 'New Help Request from \${userName}',
    htmlBody: `<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin-bottom:16px;">
  <p style="margin:0; color:#92400e; font-weight:bold;">📩 NEW SUPPORT REQUEST</p>
</div>
<p><strong>From:</strong> \${userName} (<a href="mailto:\${userEmail}" style="color:#2563eb; text-decoration:none;">\${userEmail}</a>)</p>
<p><strong>User ID:</strong> \${userId}</p>
<p><strong>Request ID:</strong> \${helpMessageId}</p>
<p><strong>Date:</strong> \${date}</p>
<hr style="margin:16px 0; border:none; border-top:1px solid #e5e7eb"/>
<h3 style="margin:12px 0; color:#0f172a;">Message:</h3>
<div style="background:#f8fafc; padding:12px; border-radius:6px; border-left:3px solid #0ea5e9;">
  <p style="margin:0; color:#334155;">\${message}</p>
</div>
<hr style="margin:16px 0; border:none; border-top:1px solid #e5e7eb"/>
<div style="text-align:center; margin:24px 0;">
  <a href="https://skillswaphub.in/admin/help-messages" style="display:inline-block; background:#0ea5e9; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:500;">View in Admin Panel</a>
</div>
<p style="color:#64748b; font-size:14px;"><em>Please reply to this help request from the Admin Panel.</em></p>`,
    variables: ['userName', 'userEmail', 'userId', 'message', 'date', 'helpMessageId']
  },
  {
    templateKey: 'help_request_reply',
    name: 'Support Team Response',
    description: 'Email sent to user when support team replies to their help request',
    category: 'support',
    subject: 'Re: Your SkillSwap Hub Help Request',
    htmlBody: `<p>Hello <strong>\${userName}</strong>,</p>
<p>Thank you for reaching out to us. We've reviewed your inquiry and here's our response:</p>
<hr style="margin:16px 0; border:none; border-top:1px solid #e5e7eb"/>
<h3 style="margin:12px 0; color:#0f172a;">Your Message:</h3>
<div style="background:#f8fafc; padding:12px; border-radius:6px; border-left:3px solid #64748b;">
  <p style="margin:0; color:#475569;">\${userMessage}</p>
</div>
<p style="margin-top:8px; font-size:12px; color:#94a3b8;"><em>Submitted on: \${submittedDate}</em></p>
<hr style="margin:16px 0; border:none; border-top:1px solid #e5e7eb"/>
<h3 style="margin:12px 0; color:#0f172a;">Our Response:</h3>
<div style="background:#e0f2fe; padding:12px; border-radius:6px; border-left:3px solid #0ea5e9;">
  <p style="margin:0; color:#0c4a6e;">\${adminReply}</p>
</div>
<p style="margin-top:8px; font-size:12px; color:#94a3b8;"><em>Replied on: \${repliedDate}</em></p>
<hr style="margin:16px 0; border:none; border-top:1px solid #e5e7eb"/>
<div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:12px; border-radius:4px; margin-top:16px;">
  <p style="margin:0; color:#1e40af;">💬 <strong>Need More Help?</strong></p>
  <p style="margin:8px 0 0; color:#1e3a8a;">If you have any further questions, feel free to submit another help request through your dashboard.</p>
</div>`,
    variables: ['userName', 'userMessage', 'adminReply', 'submittedDate', 'repliedDate']
  },
  {
    templateKey: 'otpVerification',
    name: 'Verify Your Email',
    description: 'OTP code sent for email verification during registration or login',
    category: 'authentication',
    subject: 'Your SkillSwap Hub Verification Code',
    htmlBody: `<div style="background:#dbeafe; border-left:4px solid #2563eb; padding:12px; border-radius:4px; margin-bottom:16px;">
  <p style="margin:0; color:#1e40af; font-weight:bold;">🔐 EMAIL VERIFICATION REQUIRED</p>
</div>
<p>Hello,</p>
<p>Thank you for using SkillSwap Hub. Please use the verification code below to complete your authentication:</p>
<div style="text-align:center; margin:32px 0;">
  <div style="display:inline-block; background:#f8fafc; border:2px solid #e5e7eb; padding:20px 40px; border-radius:8px;">
    <p style="margin:0; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Your OTP Code</p>
    <p style="margin:8px 0 0; font-size:32px; font-weight:bold; color:#0ea5e9; letter-spacing:8px; font-family:monospace;">\${otp}</p>
  </div>
</div>
<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin:16px 0;">
  <p style="margin:0; color:#92400e; font-weight:bold;">⏰ Valid for 10 minutes only</p>
  <p style="margin:8px 0 0; color:#78350f;">This code will expire after 10 minutes for your security.</p>
</div>
<p style="color:#64748b; font-size:14px;">If you didn't request this code, please ignore this email or contact our support team if you're concerned about your account security.</p>`,
    variables: ['otp']
  },
  {
    templateKey: 'campusWelcomeNewUser',
    name: 'Welcome to \${instituteName}!',
    description: 'Welcome email sent to new users onboarded to campus dashboard with login credentials',
    category: 'campus',
    subject: 'Welcome to \${instituteName} Campus Dashboard - SkillSwap Hub',
    htmlBody: `<p>Hello \${firstName},</p>
<p>You have been successfully onboarded to the <strong>\${instituteName}</strong> campus dashboard on SkillSwap Hub platform.</p>

<div style="background:#f8fafc; padding:16px; border-radius:6px; margin:16px 0; border-left:3px solid #0ea5e9;">
  <h3 style="margin:0 0 12px; color:#334155;">Your Login Credentials:</h3>
  <p style="margin:8px 0;"><strong>Username:</strong> \${username}</p>
  <p style="margin:8px 0;"><strong>Password:</strong> \${password}</p>
  <p style="margin:8px 0;"><strong>Student ID:</strong> \${studentId}</p>
</div>

<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px; border-radius:4px; margin:16px 0;">
  <p style="margin:0; color:#92400e; font-weight:bold;">⚠️ Important: Change Your Password</p>
  <p style="margin:8px 0 0; color:#78350f;">For security reasons, please change your password after your first login.</p>
</div>

<p>You can now access your campus dashboard, track your progress, and participate in various activities.</p>
\${courseInfo}`,
    variables: ['instituteName', 'firstName', 'username', 'password', 'studentId', 'courseInfo']
  },
  {
    templateKey: 'campusAddedExistingUser',
    name: 'Campus Dashboard Access Granted!',
    description: 'Notification sent to existing users when added to a campus dashboard',
    category: 'campus',
    subject: 'Added to \${instituteName} Campus Dashboard - SkillSwap Hub',
    htmlBody: `<p>Hello \${firstName},</p>
<p>Great news! You have been added to the <strong>\${instituteName}</strong> campus dashboard.</p>

<div style="background:#f8fafc; padding:16px; border-radius:6px; margin:16px 0; border-left:3px solid #0ea5e9;">
  <h3 style="margin:0 0 12px; color:#334155;">Your Campus Details:</h3>
  <p style="margin:8px 0;"><strong>Student ID:</strong> \${studentId}</p>
  <p style="margin:8px 0;"><strong>Institute:</strong> \${instituteName}</p>
  \${courseInfo}
</div>

<div style="background:#ecfdf5; padding:16px; border-radius:6px; margin:16px 0; border-left:4px solid #10b981;">
  <p style="margin:0; color:#065f46; font-weight:bold;">✓ What This Means For You:</p>
  <ul style="margin:8px 0 0; color:#047857; padding-left:20px;">
    <li>Access to campus-specific resources and materials</li>
    <li>Participate in campus events and activities</li>
    <li>Track your academic progress</li>
    <li>Connect with peers from your institute</li>
  </ul>
</div>

<p>Login to your dashboard to explore these new features!</p>`,
    variables: ['firstName', 'instituteName', 'studentId', 'courseInfo']
  },
  {
    templateKey: 'reportNotification',
    name: 'New \${reportType} Report',
    description: 'Email sent to admins when a new report is submitted',
    category: 'general',
    subject: 'New \${reportType} Report - SkillSwap Hub',
    htmlBody: `<div style="background:#fee2e2; border-left:4px solid #dc2626; padding:12px; border-radius:4px; margin-bottom:16px;">
  <p style="margin:0; color:#991b1b; font-weight:bold;">⚠️ NEW REPORT SUBMITTED</p>
</div>

<p><b>From:</b> \${reporterEmail}</p>
<p><b>Issues:</b> \${issues}</p>
<p><b>Details:</b> \${otherDetails}</p>

<hr style="margin:16px 0; border:none; border-top:1px solid #e5e7eb"/>

<div style="background:#f8fafc; padding:12px; border-radius:6px;">
  <h3 style="margin:0 0 12px; color:#0f172a;">Report Details:</h3>
  \${reportDetails}
</div>

<div style="text-align:center; margin:24px 0;">
  <a href="https://skillswaphub.in/admin/reports" style="display:inline-block; background:#dc2626; color:#fff; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:500;">View in Admin Panel</a>
</div>`,
    variables: ['reportType', 'reporterEmail', 'issues', 'otherDetails', 'reportDetails']
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

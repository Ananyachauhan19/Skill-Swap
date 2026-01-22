const InterviewRequest = require('../models/InterviewRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const InterviewerApplication = require('../models/InterviewerApplication');
const ApprovedInterviewer = require('../models/ApprovedInterviewer');
const EmployeeActivity = require('../models/EmployeeActivity');
const UserInterviewSnapshot = require('../models/UserInterviewSnapshot');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const supabase = require('../utils/supabaseClient');
const cloudinary = require('../utils/cloudinary');
const { sendMail } = require('../utils/sendMail');
const { getEmailTemplate } = require('../utils/dynamicEmailTemplate');
const { expireOverdueInterviews } = require('../cron/expireInterviews');

// Get single interview request by ID
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const request = await InterviewRequest.findById(id)
      .populate('requester', 'firstName lastName username email profilePic')
      .populate('assignedInterviewer', 'firstName lastName username email profilePic experience ratingAverage ratingCount');
    
    if (!request) {
      return res.status(404).json({ message: 'Interview request not found' });
    }
    
    // Check if user is part of this interview
    const isRequester = String(request.requester?._id) === String(userId);
    const isInterviewer = String(request.assignedInterviewer?._id) === String(userId);
    
    if (!isRequester && !isInterviewer) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Auto-schedule fallback check (lazy execution)
    await maybeAutoScheduleInterview(request, req.app);
    return res.json(request);
  } catch (err) {
    console.error('Error fetching interview request:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Helper: finalize schedule and broadcast notifications + snapshots
async function finalizeInterviewSchedule(reqDoc, app, scheduledAt, { autoScheduled = false } = {}) {
  const io = app && app.get ? app.get('io') : null;

  reqDoc.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  reqDoc.status = 'scheduled';
  reqDoc.negotiationStatus = 'finalized';
  reqDoc.autoScheduled = !!autoScheduled;
  await reqDoc.save();

  await reqDoc.populate([
    { path: 'requester', select: 'username firstName lastName email' },
    { path: 'assignedInterviewer', select: 'username firstName lastName username' },
  ]);

  const populated = reqDoc;

  const requesterId = populated.requester && (populated.requester._id || populated.requester);
  const interviewerObj = populated.assignedInterviewer || {};
  const interviewerId = interviewerObj._id || interviewerObj;

  const whenStr = populated.scheduledAt ? populated.scheduledAt.toString() : 'TBD';
  const typeForRequester = autoScheduled ? 'interview-auto-scheduled' : 'interview-scheduled';
  const msgForRequester = autoScheduled
    ? `Your interview has been automatically scheduled for ${whenStr}`
    : `Your interview has been scheduled for ${whenStr}`;

  // Notify requester
  try {
    if (requesterId) {
      const notification = await Notification.create({
        userId: requesterId,
        type: typeForRequester,
        message: msgForRequester,
        requestId: populated._id,
        requesterId: interviewerId,
        requesterName: `${interviewerObj.firstName || ''} ${interviewerObj.lastName || ''}`.trim() || interviewerObj.username || '',
        company: populated.company,
        position: populated.position,
        timestamp: Date.now(),
      });
      if (io) {
        io.to(requesterId.toString()).emit('notification', notification);
        // Emit events to update request counts
        io.to(requesterId.toString()).emit('interview-request-received');
        if (interviewerId) io.to(interviewerId.toString()).emit('interview-request-sent');
      }
    }
  } catch (e) {
    console.error('[Interview] failed to notify requester about schedule', e);
  }

  // Email requester (use same template for both manual and auto schedule)
  try {
    const requesterDoc = await User.findById(requesterId);
    if (requesterDoc?.email) {
      const tpl = await getEmailTemplate('interviewScheduled', {
        requesterName: requesterDoc.firstName || requesterDoc.username,
        company: populated.company,
        position: populated.position,
        scheduledAt: populated.scheduledAt ? populated.scheduledAt.toLocaleString() : 'TBD'
      });
      await sendMail({ to: requesterDoc.email, subject: tpl.subject, html: tpl.html });
    }
  } catch (e) {
    console.error('[Interview] failed to send schedule email to requester', e);
  }

  // Notify interviewer (confirmation or auto info)
  try {
    if (interviewerId) {
      const typeForInterviewer = autoScheduled
        ? 'interview-auto-scheduled-confirmation'
        : 'interview-scheduled-confirmation';
      const msgForInterviewer = autoScheduled
        ? `Interview was automatically scheduled for ${whenStr}`
        : `You scheduled the interview for ${whenStr}`;
      const notifInterviewer = await Notification.create({
        userId: interviewerId,
        type: typeForInterviewer,
        message: msgForInterviewer,
        requestId: populated._id,
        company: populated.company,
        position: populated.position,
        timestamp: Date.now(),
      });
      if (io) io.to(interviewerId.toString()).emit('notification', notifInterviewer);
    }
  } catch (e) {
    console.error('[Interview] failed to notify interviewer about schedule', e);
  }

  // Update ApprovedInterviewer upcoming count
  try {
    if (interviewerId) {
      await ApprovedInterviewer.findOneAndUpdate(
        { user: interviewerId },
        {
          $inc: { 'aggregates.upcomingInterviews': 1 },
          $push: {
            upcomingSessions: {
              requestId: populated._id,
              requester: requesterId,
              requesterName: `${populated.requester.firstName || ''} ${populated.requester.lastName || ''}`.trim() || populated.requester.username || '',
              company: populated.company || '',
              position: populated.position || '',
              scheduledAt: populated.scheduledAt,
              status: 'scheduled'
            }
          }
        },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error('[ApprovedInterviewer] failed to increment upcomingInterviews', e);
  }

  // Update Requester snapshot (upcoming)
  try {
    if (requesterId && interviewerId) {
      await UserInterviewSnapshot.findOneAndUpdate(
        { user: requesterId },
        {
          $inc: { 'aggregates.upcomingInterviews': 1 },
          $push: {
            upcomingSessions: {
              requestId: populated._id,
              interviewer: interviewerId,
              interviewerName: `${interviewerObj.firstName || ''} ${interviewerObj.lastName || ''}`.trim() || interviewerObj.username || '',
              company: populated.company || '',
              position: populated.position || '',
              scheduledAt: populated.scheduledAt,
              status: 'scheduled'
            }
          }
        },
        { upsert: true }
      );
    }
  } catch (e) {
    console.error('[UserInterviewSnapshot] failed to add upcoming session', e);
  }
}

// Helper: auto-schedule first interviewer slot after negotiationDeadline
async function maybeAutoScheduleInterview(reqDoc, app) {
  try {
    if (!reqDoc) return;
    if (reqDoc.status === 'scheduled' || reqDoc.status === 'completed' || reqDoc.status === 'cancelled' || reqDoc.status === 'rejected') {
      return;
    }
    if (!reqDoc.negotiationDeadline || !reqDoc.interviewerSuggestedSlots || reqDoc.interviewerSuggestedSlots.length === 0) {
      return;
    }
    const now = new Date();
    if (now < reqDoc.negotiationDeadline) return;

    // Already auto-scheduled or finalized
    if (reqDoc.negotiationStatus === 'finalized' || reqDoc.autoScheduled) return;

    const firstSlot = reqDoc.interviewerSuggestedSlots[0];
    if (!firstSlot || !firstSlot.start) return;

    await finalizeInterviewSchedule(reqDoc, app, firstSlot.start, { autoScheduled: true });
  } catch (e) {
    console.error('maybeAutoScheduleInterview error', e);
  }
}

// Multer memory storage for uploading resume
// Accept PDF, DOC, DOCX up to 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.doc', '.docx'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Resume must be PDF, DOC, or DOCX'));
    }
    cb(null, true);
  }
});

// Upload resume to Cloudinary for interview request
exports.uploadResume = [upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume file provided' });
    }

    const userId = req.user._id;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const timestamp = Date.now();
    const fileName = `resume_${userId}_${timestamp}`;
    const uploadFolder = process.env.CLOUDINARY_RESUME_FOLDER || 'SkillSwaphub/interview-resumes';

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: uploadFolder,
          public_id: fileName,
          resource_type: 'raw', // For PDF and DOC files
          format: ext.substring(1), // Remove the dot from extension
        },
        (error, result) => {
          if (error) {
            console.error('[Cloudinary] Resume upload failed:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    res.status(200).json({
      message: 'Resume uploaded successfully',
      resumeUrl: result.secure_url,
      resumeFileName: req.file.originalname,
      resumeUploadedAt: new Date()
    });
  } catch (err) {
    console.error('uploadResume error', err);
    res.status(500).json({ 
      message: 'Failed to upload resume',
      error: err.message 
    });
  }
}];

// Create a new interview request (by requester)
exports.submitRequest = async (req, res) => {
  try {
    const { company, position, message, resumeUrl, resumeFileName, resumeUploadedAt } = req.body;
    const requester = req.user._id;

    // Validate required resume fields
    if (!resumeUrl || !resumeFileName) {
      return res.status(400).json({ message: 'Resume upload is required to submit an interview request' });
    }

    const { assignedInterviewer } = req.body;
    const reqDoc = new InterviewRequest({
      requester,
      company,
      position,
      message: message || '',
      resumeUrl,
      resumeFileName,
      resumeUploadedAt: resumeUploadedAt || new Date(),
      // Status 'assigned' when user selects an interviewer, 'pending' when no interviewer (admin will assign later)
      status: assignedInterviewer ? 'assigned' : 'pending',
      assignedInterviewer: assignedInterviewer || null,
      assignedByAdmin: false, // User selected interviewer (if any), not admin
      // scheduledAt must only be set by the assigned interviewer via the schedule API
      scheduledAt: null,
    });

  await reqDoc.save();
    await reqDoc.populate('requester', 'firstName lastName username profilePic');

    const io = req.app.get('io');

    // Send confirmation email to requester ONLY if no interviewer was selected (pending status)
    // When interviewer is selected, only the interviewer gets notified
    if (!reqDoc.assignedInterviewer) {
      try {
        // Send email confirmation to candidate
        if (req.user.email) {
          const tpl = await getEmailTemplate('interviewRequestConfirmation', {
            requesterName: req.user.firstName || req.user.username,
            company,
            position
          });
          await sendMail({ to: req.user.email, subject: tpl.subject, html: tpl.html });
        }
      } catch (e) {
        console.error('Failed to send candidate confirmation email', e);
      }
    }

    // Email and notify interviewer if pre-assigned (user selected an interviewer)
    if (reqDoc.assignedInterviewer) {
      try {
        const interviewer = await User.findById(reqDoc.assignedInterviewer);
        if (interviewer) {
          // Send email to interviewer - use "interviewRequested" template for direct requests
          if (interviewer.email) {
            const messageBlock = message 
              ? `<div style="background:#f8fafc; padding:12px; border-radius:6px; margin:16px 0; border-left:3px solid #64748b;">
                  <p style="margin:0; color:#334155; font-size:14px;"><b>Message from candidate:</b></p>
                  <p style="margin:8px 0 0; color:#475569;">${message}</p>
                </div>`
              : '';
            
            const tpl = await getEmailTemplate('interviewRequested', {
              interviewerName: interviewer.firstName || interviewer.username,
              requesterName: `${req.user.firstName} ${req.user.lastName}`,
              company,
              position,
              messageBlock
            });
            await sendMail({ to: interviewer.email, subject: tpl.subject, html: tpl.html });
          }

          // Send in-app notification
          const notification = await Notification.create({
            userId: interviewer._id,
            type: 'interview-assigned',
            message: `${req.user.firstName} ${req.user.lastName} requested an interview at ${company} for ${position}`,
            requestId: reqDoc._id,
            requesterId: requester,
            requesterName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
            company,
            position,
            timestamp: Date.now(),
          });
          if (io && interviewer._id) io.to(interviewer._id.toString()).emit('notification', notification);
        }
      } catch (e) {
        console.error('Failed to send interviewer request email/notification', e);
      }
    }
    res.status(201).json({ message: 'Interview request submitted', request: reqDoc });
    // No contribution on submit to avoid multi-counting; count when completed (rated)
  } catch (err) {
    console.error('submitRequest error', err);
    res.status(500).json({ message: 'Failed to submit interview request' });
  }
};

// Get qualifications from CSV
exports.getQualifications = async (req, res) => {
  try {
    const csvUrl = process.env.GOOGLE_DEGREE_CSV_URL;
    if (!csvUrl) {
      // Fallback qualifications if CSV URL not configured
      return res.json({
        qualifications: ['BTech', 'MTech', 'BCA', 'MCA', 'BSc', 'MSc', 'MBA', 'PhD']
      });
    }

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch qualifications CSV');
    }

    const text = await response.text();
    const lines = text.split('\n').filter(l => l.trim());
    // CSV format: DEGREE_CODE,Full Name,Type,Category
    // We want the Full Name (second column)
    const qualList = lines.slice(1).map(line => {
      const columns = line.split(',');
      if (columns.length >= 2) {
        // Extract second column (Full Name) and remove quotes
        const fullName = columns[1].trim().replace(/^"|"$/g, '');
        return fullName;
      }
      return null;
    }).filter(Boolean);

    // Remove duplicates and sort
    const uniqueQuals = [...new Set(qualList)].sort();

    res.json({ qualifications: uniqueQuals });
  } catch (error) {
    console.error('Error fetching qualifications:', error);
    // Return fallback qualifications on error
    res.json({
      qualifications: ['BTech', 'MTech', 'BCA', 'MCA', 'BSc', 'MSc', 'MBA', 'PhD']
    });
  }
};

// Apply to become an interviewer (multipart for resume)
exports.applyInterviewer = [upload.single('resume'), async (req, res) => {
  try {
    // Debug logging for diagnosing 500 errors during apply
    try {
      console.info('[DEBUG] applyInterviewer called by user:', req.user && req.user._id ? req.user._id.toString() : req.user);
      console.info('[DEBUG] applyInterviewer body keys:', Object.keys(req.body || {}));
      console.info('[DEBUG] applyInterviewer file meta:', req.file ? { original: req.file.originalname, size: req.file.size } : null);
    } catch (logErr) {
      console.error('[DEBUG] failed to log applyInterviewer context', logErr);
    }
    const { name, company, position, experience, age, totalPastInterviews, qualification } = req.body;
    const userId = req.user._id;
    let resumePublicUrl = '';

    // Upload resume to Cloudinary if provided
    if (req.file) {
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const timestamp = Date.now();
        const fileName = `interviewer_resume_${userId}_${timestamp}`;
        const uploadFolder = process.env.CLOUDINARY_INTERVIEWER_RESUME_FOLDER || 'SkillSwaphub/interviewer-resumes';

        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: uploadFolder,
              public_id: fileName,
              resource_type: 'raw', // For PDF and DOC files
              format: ext.substring(1), // Remove the dot from extension
            },
            (error, result) => {
              if (error) {
                console.error('[Cloudinary] Interviewer resume upload failed:', error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          stream.end(req.file.buffer);
        });

        const result = await uploadPromise;
        resumePublicUrl = result.secure_url;
        console.log('[Cloudinary] Interviewer resume uploaded:', resumePublicUrl);
      } catch (uploadCatch) {
        console.error('[Cloudinary] Unexpected interviewer resume upload error', uploadCatch);
        return res.status(500).json({ message: 'Unexpected error uploading resume' });
      }
    }

    let appDoc = await InterviewerApplication.findOne({ user: userId });
    const isNew = !appDoc;
    if (!appDoc) {
      appDoc = new InterviewerApplication({ user: userId });
    }

    // Update fields
    appDoc.name = name || appDoc.name;
    appDoc.company = company || appDoc.company;
    appDoc.position = position || appDoc.position;
    appDoc.experience = experience || appDoc.experience;
    if (age) appDoc.age = Number(age);
    appDoc.totalPastInterviews = Number(totalPastInterviews) || appDoc.totalPastInterviews || 0;
    appDoc.qualification = qualification || appDoc.qualification;
    // If a new resume was uploaded, replace the URL
    if (resumePublicUrl) appDoc.resumeUrl = resumePublicUrl;
    // Reset status to pending when (re)submitting
    appDoc.status = 'pending';

    await appDoc.save();

    // Notify admin (both for new and updated submissions)
    const io = req.app.get('io');
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    let admin = null;
    if (adminEmail) admin = await User.findOne({ email: adminEmail });
    if (admin) {
      const notification = await Notification.create({
        userId: admin._id,
        type: 'interviewer-application',
        message: `${req.user.firstName} ${req.user.lastName} ${isNew ? 'applied' : 'updated their application'} to be an interviewer`,
        applicationId: appDoc._id,
        timestamp: Date.now(),
      });
      if (io) io.to(admin._id.toString()).emit('notification', notification);
    }

    res.status(isNew ? 201 : 200).json({ message: isNew ? 'Application submitted' : 'Application updated', application: appDoc });
  } catch (err) {
    console.error('applyInterviewer error', err);
    res.status(500).json({ message: 'Failed to submit application' });
  }
}];

// Admin: list applications with filtering, search, and category support.
// Query params:
//   status = all|pending|approved|rejected
//   search = free text (matches name/company/position/email/username)
//   category = all|interview-expert|tutor
//   startDate = YYYY-MM-DD (inclusive)
//   endDate = YYYY-MM-DD (inclusive, converted to next day for exclusive boundary)
// Returns unified list: interviewer applications (type='interview-expert') + tutor role users (type='tutor').
exports.listApplications = async (req, res) => {
  try {
    // Admin-only via email check OR authenticated employee (handled by route-level middleware)
    if (!req.employee) {
      const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
      if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const { status = 'all', search = '', category = 'all', startDate = '', endDate = '' } = req.query;
    const searchNorm = search.trim().toLowerCase();
    const statusFilter = ['pending','approved','rejected'].includes(status) ? status : null;
    const includeInterview = category === 'all' || category === 'interview-expert';
    const includeTutor = category === 'all' || category === 'tutor';

    // Build date range filter
    const dateRangeFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      if (!isNaN(start)) dateRangeFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      if (!isNaN(end)) dateRangeFilter.$lt = end;
    }

    let interviewApps = [];
    if (includeInterview) {
      const query = statusFilter ? { status: statusFilter } : {};
      if (Object.keys(dateRangeFilter).length > 0) {
        query.createdAt = dateRangeFilter;
      }
      interviewApps = await InterviewerApplication.find(query)
        .populate('user', 'username firstName lastName email role profilePic country education experience certificates')
        .sort({ createdAt: -1 });
      // client-side search filter
      if (searchNorm) {
        interviewApps = interviewApps.filter(a => {
          const fields = [
            a.name,
            a.company,
            a.position,
            a.user && a.user.email,
            a.user && a.user.username,
            a.qualification,
          ].filter(Boolean).map(v => v.toLowerCase());
          return fields.some(f => f.includes(searchNorm));
        });
      }
      interviewApps = interviewApps.map(a => ({ ...a.toObject(), type: 'interview-expert' }));
    }

    let tutorApps = [];
    if (includeTutor) {
      // Tutors derived from users with teaching capability roles
      let tutorUsers = await User.find({ role: { $in: ['teacher','both'] } }, 'username firstName lastName email role profilePic country education experience certificates createdAt');
      if (searchNorm) {
        tutorUsers = tutorUsers.filter(u => {
          const fields = [u.firstName, u.lastName, u.username, u.email].filter(Boolean).map(v => v.toLowerCase());
          return fields.some(f => f.includes(searchNorm));
        });
      }
      // Filter by date range (use createdAt or _id timestamp)
      if (Object.keys(dateRangeFilter).length > 0) {
        tutorUsers = tutorUsers.filter(u => {
          const uDate = u.createdAt ? new Date(u.createdAt) : u._id.getTimestamp();
          const inRange = (!dateRangeFilter.$gte || uDate >= dateRangeFilter.$gte) &&
                         (!dateRangeFilter.$lt || uDate < dateRangeFilter.$lt);
          return inRange;
        });
      }
      // Status filtering: treat tutors as approved; hide if statusFilter excludes approved
      if (statusFilter && statusFilter !== 'approved') tutorUsers = [];
      tutorApps = tutorUsers.map(u => ({
        _id: u._id,
        type: 'tutor',
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
        company: '',
        position: 'Tutor',
        qualification: '',
        experience: '',
        status: 'approved',
        resumeUrl: '',
        user: u,
        createdAt: u.createdAt || u._id.getTimestamp(),
      }));
    }

    // Merge and sort by createdAt (fallback to _id timestamp)
    const combined = [...interviewApps, ...tutorApps].sort((a,b) => {
      const ta = a.createdAt ? new Date(a.createdAt) : a._id.getTimestamp();
      const tb = b.createdAt ? new Date(b.createdAt) : b._id.getTimestamp();
      return tb - ta; // newest first
    });

    res.json({ applications: combined, meta: { count: combined.length } });
  } catch (err) {
    console.error('listApplications error', err);
    res.status(500).json({ message: 'Failed to list applications' });
  }
};

// Admin / employee approves an application
exports.approveApplication = async (req, res) => {
  try {
    if (!req.employee) {
      const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
      if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    const { id } = req.params;
    console.info('[DEBUG] approveApplication called by admin:', req.user && req.user._id ? req.user._id.toString() : req.user, 'appId:', id);
    const app = await InterviewerApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = 'approved';
    if (req.employee) {
      app.approvedByEmployee = req.employee._id;
      app.approvedActionTimestamp = new Date();
      app.rejectedByEmployee = undefined;
      app.rejectedActionTimestamp = undefined;
    }
    await app.save();

    // Log employee approval for interviewer application
    if (req.employee) {
      try {
        await EmployeeActivity.findOneAndUpdate(
          {
            employee: req.employee._id,
            applicationId: app._id,
            applicationType: 'interview',
          },
          {
            employee: req.employee._id,
            applicationId: app._id,
            applicationType: 'interview',
            roleType: req.employee.accessPermissions || 'interview',
            status: 'approved',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.error('[EmployeeActivity] Failed to log interviewer approve action:', err.message);
      }
    }

    // Mark user as interviewer by adding their expertise into profile.
    // We only update the Experience section, not "What I Can Teach".
    const user = await User.findById(app.user._id);
    if (user) {
      user.role = 'both';
      // Append interviewer experience entry
      user.experience = user.experience || [];
      const totalPast = typeof app.totalPastInterviews === 'number' ? app.totalPastInterviews : 0;
      let description = '';
      if (totalPast > 0) {
        description = totalPast === 1
          ? 'Has experience conducting 1 interview.'
          : `Has experience conducting ${totalPast} interviews.`;
      }
      user.experience.push({
        company: app.company || '',
        position: app.position || 'Interviewer',
        duration: app.experience || '',
        description,
      });
      await user.save();
    }

    // Notify applicant
    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        userId: app.user._id,
        type: 'interviewer-approved',
        message: `Your application to be an interviewer was approved`,
        applicationId: app._id,
        timestamp: Date.now(),
      });
      if (io) io.to(app.user._id.toString()).emit('notification', notification);
    } catch (notifErr) {
      console.error('[DEBUG] notification create failed in approveApplication', notifErr);
      // continue — don't block approval on notification
    }

    // Create/update ApprovedInterviewer snapshot
    try {
      const snapshot = await ApprovedInterviewer.findOneAndUpdate(
        { user: app.user._id },
        {
          user: app.user._id,
          profile: {
            name: app.name || `${app.user.firstName || ''} ${app.user.lastName || ''}`.trim() || app.user.username,
            company: app.company || '',
            position: app.position || '',
            qualification: app.qualification || '',
            resumeUrl: app.resumeUrl || '',
          },
          stats: {
            conductedInterviews: app.conductedInterviews || 0,
            averageRating: app.averageRating || 0,
            totalRatings: app.totalRatings || 0,
          },
        },
        { upsert: true, new: true }
      );
    } catch (snapErr) {
      console.error('[ApprovedInterviewer] snapshot create/update failed', snapErr);
    }

    res.json({ message: 'Application approved', application: app });
  } catch (err) {
    console.error('approveApplication error', err);
    res.status(500).json({ message: 'Failed to approve application' });
  }
};

// Admin / employee rejects an application
exports.rejectApplication = async (req, res) => {
  try {
    if (!req.employee) {
      const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
      if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }
    const { id } = req.params;
    console.info('[DEBUG] rejectApplication called by admin:', req.user && req.user._id ? req.user._id.toString() : req.user, 'appId:', id);
    const app = await InterviewerApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = 'rejected';
    if (req.employee) {
      app.rejectedByEmployee = req.employee._id;
      app.rejectedActionTimestamp = new Date();
      app.approvedByEmployee = undefined;
      app.approvedActionTimestamp = undefined;
    }
    await app.save();

    // Log employee rejection for interviewer application
    if (req.employee) {
      try {
        await EmployeeActivity.findOneAndUpdate(
          {
            employee: req.employee._id,
            applicationId: app._id,
            applicationType: 'interview',
          },
          {
            employee: req.employee._id,
            applicationId: app._id,
            applicationType: 'interview',
            roleType: req.employee.accessPermissions || 'interview',
            status: 'rejected',
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        console.error('[EmployeeActivity] Failed to log interviewer reject action:', err.message);
      }
    }

    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        userId: app.user._id,
        type: 'interviewer-rejected',
        message: `Your application to be an interviewer was rejected`,
        applicationId: app._id,
        timestamp: Date.now(),
      });
      if (io) io.to(app.user._id.toString()).emit('notification', notification);
    } catch (notifErr) {
      console.error('[DEBUG] notification create failed in rejectApplication', notifErr);
      // continue — don't block rejection on notification
    }

    res.json({ message: 'Application rejected', application: app });
  } catch (err) {
    console.error('rejectApplication error', err);
    res.status(500).json({ message: 'Failed to reject application' });
  }
};

// Public: get approved interviewers, optionally filter by company or position with fuzzy search
exports.getApprovedInterviewers = async (req, res) => {
  try {
    const { company, position } = req.query;
    
    // Get all approved interviewers first
    let apps = await InterviewerApplication.find({ status: 'approved' })
      .populate('user', 'username firstName lastName profilePic college');

    // If the logged-in user is also an approved interviewer, do not
    // include their own profile in the recommendation list.
    const currentUserId = req.user && req.user._id ? String(req.user._id) : null;
    if (currentUserId) {
      apps = apps.filter(a => {
        const interviewerUserId = a.user && a.user._id ? String(a.user._id) : null;
        return interviewerUserId !== currentUserId;
      });
    }
    
    // If no filters, return all
    if (!company && !position) {
      const result = apps.map(a => ({ 
        application: a, 
        user: a.user,
        stats: {
          conductedInterviews: a.conductedInterviews || 0,
          averageRating: a.averageRating || 0,
          totalRatings: a.totalRatings || 0
        }
      }));
      console.log('Returning all approved interviewers with stats:', result.length);
      return res.json(result);
    }
    
    // Use Fuse.js for fuzzy matching
    const Fuse = require('fuse.js');
    
    let matchedResults = [];
    
    // Strategy: Search separately for company and position, then merge with position priority
    // This ensures we match if EITHER field matches (OR logic instead of AND)
    
    if (position) {
      // PRIORITY 1: Position matching (higher weight, lower threshold for strict matching)
      const positionFuse = new Fuse(apps, {
        threshold: 0.3, // Stricter matching for positions
        distance: 100,
        keys: [
          { name: 'position', weight: 3 },      // Highest priority
          { name: 'qualification', weight: 1 }, // Related skills/qualifications
        ],
        includeScore: true
      });
      
      const positionResults = positionFuse.search(position);
      matchedResults = positionResults.map(r => ({
        ...r,
        matchType: 'position',
        priorityScore: r.score // Lower = better
      }));

      // Additional word-based matching for role keywords (e.g., developer/development)
      const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
      // Use robust stemming for generalization across many role variants
      let natural;
      try {
        natural = require('natural');
      } catch (_) {
        natural = null;
      }
      const porter = natural && natural.PorterStemmer;
      const stem = (w) => {
        const x = (w || '').toLowerCase();
        if (!x) return '';
        // Prefer Porter stemming when available; fallback to simple suffix trimming
        if (porter) return porter.stem(x);
        return x.replace(/(ing|ers?|ment|tion|ions|ed|ly)$/i, '');
      };
      const queryTokens = norm(position).split(' ').map(stem).filter(Boolean);
      const hasTokenMatch = (app) => {
        const text = [app.position, app.qualification, app.company].map(norm).join(' ');
        const tokens = text.split(' ').map(stem).filter(Boolean);
        const tokenSet = new Set(tokens);
        return queryTokens.some(t => tokenSet.has(t));
      };
      const tokenMatches = apps.filter(hasTokenMatch);
      // Merge token matches with existing matchedResults ensuring uniqueness and boosting priority
      tokenMatches.forEach(tm => {
        const existsIdx = matchedResults.findIndex(mr => mr.item._id.toString() === tm._id.toString());
        const entry = { item: tm, score: 0.15, matchType: 'position-word', priorityScore: 0.15 };
        if (existsIdx >= 0) {
          // Boost existing match
          matchedResults[existsIdx].matchType = matchedResults[existsIdx].matchType === 'position' ? 'position+word' : matchedResults[existsIdx].matchType;
          matchedResults[existsIdx].priorityScore = Math.min(matchedResults[existsIdx].priorityScore, 0.15);
        } else {
          matchedResults.push(entry);
        }
      });
    }
    
    if (company) {
      // PRIORITY 2: Company matching (secondary priority)
      const companyFuse = new Fuse(apps, {
        threshold: 0.4, // More lenient for company names
        distance: 100,
        keys: [
          { name: 'company', weight: 2 },
          { name: 'user.college', weight: 1 }, // University/college as fallback
        ],
        includeScore: true
      });
      
      const companyResults = companyFuse.search(company);
      
      // Merge company results, but penalize score to give position matches priority
      companyResults.forEach(cr => {
        // Check if already matched by position
        const existingIdx = matchedResults.findIndex(
          mr => mr.item._id.toString() === cr.item._id.toString()
        );
        
        if (existingIdx >= 0) {
          // Already matched by position - enhance the match
          matchedResults[existingIdx].matchType = 'both';
          matchedResults[existingIdx].priorityScore = 
            matchedResults[existingIdx].priorityScore * 0.5; // Boost score (lower is better)
        } else {
          // New match from company only - add with penalty
          matchedResults.push({
            ...cr,
            matchType: 'company',
            priorityScore: cr.score + 0.3 // Add penalty so position matches rank higher
          });
        }
      });
    }
    
    // Sort by priority score (lower = better match)
    // Order: both > position > company
    matchedResults.sort((a, b) => a.priorityScore - b.priorityScore);
    
    // Return matched interviewers with match information
    const result = matchedResults.map(r => ({ 
      application: r.item, 
      user: r.item.user,
      score: r.score,
      matchType: r.matchType, // 'position', 'company', or 'both'
      stats: {
        conductedInterviews: r.item.conductedInterviews || 0,
        averageRating: r.item.averageRating || 0,
        totalRatings: r.item.totalRatings || 0
      }
    }));
    console.log(`Returning ${result.length} matched interviewers with stats`);
    res.json(result);
    
  } catch (err) {
    console.error('getApprovedInterviewers error', err);
    res.status(500).json({ message: 'Failed to fetch interviewers' });
  }
};

// Public: return a list of past interviews (simple placeholder to satisfy frontend)
exports.getPastInterviews = async (req, res) => {
  try {
    // For now return empty array — can be populated from past sessions later
    res.json([]);
  } catch (err) {
    console.error('getPastInterviews error', err);
    res.status(500).json({ message: 'Failed to fetch past interviews' });
  }
};

// Public: return FAQ list for interviews
exports.getFaqs = async (req, res) => {
  try {
    const faqs = [
      { q: 'What is a mock interview?', a: 'A simulated interview with feedback.' },
      { q: 'How long is a session?', a: 'Typically 30-60 minutes.' }
    ];
    res.json({ faqs });
  } catch (err) {
    console.error('getFaqs error', err);
    res.status(500).json({ message: 'Failed to fetch FAQs' });
  }
};

// Get current logged-in user's interviewer application (if any)
exports.getMyApplication = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const app = await InterviewerApplication.findOne({ user: userId });
    res.json(app || null);
  } catch (err) {
    console.error('getMyApplication error', err);
    res.status(500).json({ message: 'Failed to fetch application' });
  }
};

// Get interviewer verification status (for status page)
exports.getInterviewerStatus = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const application = await InterviewerApplication.findOne({ user: userId });
    
    if (!application) {
      return res.status(404).json({ message: 'No application found' });
    }
    
    res.json({ application });
  } catch (err) {
    console.error('getInterviewerStatus error', err);
    res.status(500).json({ message: 'Failed to fetch status' });
  }
};

// Get requests for the logged-in user (returns { received, sent } for normal users, all for admin)
exports.getUserRequests = async (req, res) => {
  try {
    // Expire overdue interviews before fetching
    await expireOverdueInterviews();

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const isAdmin = req.user && req.user.email && req.user.email.toLowerCase() === adminEmail;

    if (isAdmin) {
      const all = await InterviewRequest.find().populate('requester', 'username firstName lastName profilePic email').populate('assignedInterviewer', 'username firstName lastName profilePic email experience ratingAverage ratingCount').sort({ createdAt: -1 });
      return res.json(all);
    }

    // Find requests where the user is requester or the assigned interviewer
    const docs = await InterviewRequest.find({
      $or: [{ requester: req.user._id }, { assignedInterviewer: req.user._id }]
    }).populate('requester', 'username firstName lastName profilePic email').populate('assignedInterviewer', 'username firstName lastName profilePic email experience ratingAverage ratingCount').sort({ createdAt: -1 });

    // Apply auto-schedule fallback lazily for all relevant docs
    for (const d of docs) {
      await maybeAutoScheduleInterview(d, req.app);
    }

    const sent = docs.filter(d => d.requester && d.requester._id.toString() === req.user._id.toString());
    const received = docs.filter(d => d.assignedInterviewer && d.assignedInterviewer._id.toString() === req.user._id.toString());

    res.json({ received, sent });
  } catch (err) {
    console.error('getUserRequests error', err);
    res.status(500).json({ message: 'Failed to fetch interview requests' });
  }
};

// Admin: get all requests (for admin UI) - show only requests where admin assigned or needs to assign
exports.getAllRequests = async (req, res) => {
  try {
    // Expire overdue interviews before fetching
    await expireOverdueInterviews();

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Show requests where:
    // 1. No interviewer assigned yet (status='pending', assignedInterviewer=null) OR
    // 2. Interviewer was assigned by admin (assignedByAdmin=true)
    const all = await InterviewRequest.find({
      $or: [
        { status: 'pending', assignedInterviewer: null }, // Needs admin assignment
        { assignedByAdmin: true } // Was assigned by admin
      ]
    })
      .populate('requester', 'username firstName lastName profilePic email')
      .populate('assignedInterviewer', 'username firstName lastName profilePic email experience ratingAverage ratingCount')
      .sort({ createdAt: -1 });
    res.json(all);
  } catch (err) {
    console.error('getAllRequests error', err);
    res.status(500).json({ message: 'Failed to fetch all interview requests' });
  }
};

// Admin assigns an interviewer by username
exports.assignInterviewer = async (req, res) => {
  try {
    const { requestId, interviewerUsername } = req.body;
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    const interviewer = await User.findOne({ username: interviewerUsername });
    if (!interviewer) return res.status(404).json({ message: 'Interviewer username not found' });

    reqDoc.assignedInterviewer = interviewer._id;
    reqDoc.assignedByAdmin = true; // Mark as admin-assigned
    // Change status to 'assigned' - interviewer must schedule to confirm
    reqDoc.status = 'assigned';
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName profilePic');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName profilePic experience ratingAverage ratingCount');

    // Notify interviewer
    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: interviewer._id,
      type: 'interview-assigned',
      message: `You have been assigned an interview request at ${reqDoc.company} for ${reqDoc.position}`,
      requestId: reqDoc._id,
      requesterId: reqDoc.requester,
      requesterName: `${reqDoc.requester.firstName || ''} ${reqDoc.requester.lastName || ''}`,
      company: reqDoc.company,
      position: reqDoc.position,
      timestamp: Date.now(),
    });

    if (io) io.to(interviewer._id.toString()).emit('notification', notification);

    // Send email to interviewer
    try {
      if (interviewer.email) {
        const tpl = await getEmailTemplate('interviewAssigned', {
          interviewerName: interviewer.firstName || interviewer.username,
          company: reqDoc.company,
          position: reqDoc.position,
          requesterName: `${reqDoc.requester.firstName || ''} ${reqDoc.requester.lastName || ''}`.trim() || reqDoc.requester.username
        });
        await sendMail({ to: interviewer.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send assignment email to interviewer', e);
    }

    res.json({ message: 'Interviewer assigned', request: reqDoc });
  } catch (err) {
    console.error('assignInterviewer error', err);
    res.status(500).json({ message: 'Failed to assign interviewer' });
  }
};

// Admin: search for approved interviewers by username or name (for autocomplete)
exports.searchInterviewers = async (req, res) => {
  try {
    const { query } = req.query;
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    // Find approved interviewers whose username or name matches the query
    const approvedApps = await InterviewerApplication.find({ status: 'approved' })
      .populate('user', 'username firstName lastName profilePic');

    // Filter by query (case-insensitive search on username, firstName, lastName)
    const searchTerm = query.toLowerCase().trim();
    const matches = approvedApps.filter(app => {
      const user = app.user;
      if (!user) return false;
      const username = (user.username || '').toLowerCase();
      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      
      return username.includes(searchTerm) || 
             firstName.includes(searchTerm) || 
             lastName.includes(searchTerm) ||
             fullName.includes(searchTerm);
    });

    // Return only the necessary fields
    const results = matches.slice(0, 10).map(app => ({
      userId: app.user._id,
      username: app.user.username,
      firstName: app.user.firstName,
      lastName: app.user.lastName,
      profilePic: app.user.profilePic,
      company: app.company,
      position: app.position,
    }));

    res.json(results);
  } catch (err) {
    console.error('searchInterviewers error', err);
    res.status(500).json({ message: 'Failed to search interviewers' });
  }
};

// Interviewer suggests 1–2 time slots (only once)
exports.suggestInterviewerSlots = async (req, res) => {
  try {
    const { requestId, slots } = req.body;
    if (!Array.isArray(slots) || slots.length === 0 || slots.length > 2) {
      return res.status(400).json({ message: 'Provide 1 or 2 time slots' });
    }

    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    // Only assigned interviewer can suggest
    if (!reqDoc.assignedInterviewer || reqDoc.assignedInterviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to suggest slots for this interview' });
    }

    // Can suggest only once and only while pending/assigned
    if (reqDoc.interviewerSuggestedSlots && reqDoc.interviewerSuggestedSlots.length > 0) {
      return res.status(400).json({ message: 'Time slots already suggested for this request' });
    }
    if (!['pending', 'assigned'].includes(reqDoc.status)) {
      return res.status(400).json({ message: 'Cannot suggest slots for this interview in its current state' });
    }

    const now = new Date();
    const normalizedSlots = slots.map((s) => {
      const start = new Date(s.start);
      return {
        start,
        end: start,
      };
    });

    if (normalizedSlots.some((s) => isNaN(s.start) || s.start < now)) {
      return res.status(400).json({ message: 'Cannot select a time before the current time' });
    }

    reqDoc.interviewerSuggestedSlots = normalizedSlots;
    reqDoc.interviewerSuggestedAt = now;
    reqDoc.negotiationStatus = 'awaiting_requester';
    // 12-hour auto-schedule deadline from first suggestion
    reqDoc.negotiationDeadline = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    reqDoc.alternateSlotsRejected = false;
    await reqDoc.save();

    // Notify requester that slots were suggested
    const populated = await reqDoc.populate('requester', 'username firstName lastName email');
    await populated.populate('assignedInterviewer', 'username firstName lastName');
    
    const io = req.app.get('io');
    const interviewerName = `${populated.assignedInterviewer.firstName || ''} ${populated.assignedInterviewer.lastName || ''}`.trim() || populated.assignedInterviewer.username;
    
    if (populated.requester) {
      // Create notification
      const notification = await Notification.create({
        userId: populated.requester._id,
        type: 'interview-slots-suggested',
        message: `${interviewerName} has suggested time slots for your mock interview at ${populated.company}.`,
        requestId: populated._id,
        requesterId: populated.assignedInterviewer._id,
        requesterName: interviewerName,
        company: populated.company,
        position: populated.position,
        timestamp: Date.now(),
      });
      
      if (io) {
        io.to(populated.requester._id.toString()).emit('notification', notification);
        // Emit toaster event
        io.to(populated.requester._id.toString()).emit('interview-time-update', {
          type: 'slots-suggested',
          requestId: populated._id,
          company: populated.company,
          position: populated.position,
          slots: normalizedSlots,
          message: `${interviewerName} has suggested ${normalizedSlots.length} time slot${normalizedSlots.length > 1 ? 's' : ''} for your interview.`,
        });
      }
      
      // Send email to candidate
      try {
        if (populated.requester.email) {
          const slotsText = normalizedSlots.map((s, i) => `Option ${i + 1}: ${new Date(s.start).toLocaleString()}`).join('<br/>');
          const tpl = await getEmailTemplate('interviewSlotsProposed', {
            requesterName: populated.requester.firstName || populated.requester.username,
            interviewerName,
            company: populated.company,
            position: populated.position,
            slots: slotsText
          });
          await sendMail({ to: populated.requester.email, subject: tpl.subject, html: tpl.html });
          console.log(`[Interview] Time slots email sent to candidate: ${populated.requester.email}`);
        }
      } catch (e) {
        console.error('Failed to send slots suggestion email', e);
      }
    }

    res.json({ message: 'Time slots suggested', request: reqDoc });
  } catch (err) {
    console.error('suggestInterviewerSlots error', err);
    res.status(500).json({ message: 'Failed to suggest time slots' });
  }
};

// Requester accepts one of the interviewer-suggested slots
exports.requesterAcceptInterviewerSlot = async (req, res) => {
  try {
    const { requestId, slotIndex } = req.body;

    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    if (!reqDoc.requester || reqDoc.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept slots for this interview' });
    }

    if (reqDoc.status === 'scheduled' || reqDoc.status === 'completed' || reqDoc.status === 'cancelled' || reqDoc.status === 'rejected') {
      return res.status(400).json({ message: 'Interview already finalized' });
    }

    if (!reqDoc.interviewerSuggestedSlots || reqDoc.interviewerSuggestedSlots.length === 0) {
      return res.status(400).json({ message: 'No interviewer slots available to accept' });
    }

    if (reqDoc.negotiationStatus !== 'awaiting_requester') {
      return res.status(400).json({ message: 'Not awaiting requester choice at this time' });
    }

    if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex >= reqDoc.interviewerSuggestedSlots.length) {
      return res.status(400).json({ message: 'Invalid slot index' });
    }

    const chosen = reqDoc.interviewerSuggestedSlots[slotIndex];
    await finalizeInterviewSchedule(reqDoc, req.app, chosen.start, { autoScheduled: false });

    res.json({ message: 'Interview scheduled', request: reqDoc });
  } catch (err) {
    console.error('requesterAcceptInterviewerSlot error', err);
    res.status(500).json({ message: 'Failed to accept time slot' });
  }
};

// Requester suggests 1–2 alternate slots (only once)
exports.requesterSuggestAlternateSlots = async (req, res) => {
  try {
    const { requestId, slots, reason } = req.body;

    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    if (!reqDoc.requester || reqDoc.requester.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to suggest alternate slots for this interview' });
    }

    if (reqDoc.status === 'scheduled' || reqDoc.status === 'completed' || reqDoc.status === 'cancelled' || reqDoc.status === 'rejected') {
      return res.status(400).json({ message: 'Interview already finalized' });
    }

    if (!reqDoc.interviewerSuggestedSlots || reqDoc.interviewerSuggestedSlots.length === 0) {
      return res.status(400).json({ message: 'Interviewer has not suggested any slots yet' });
    }

    if (reqDoc.negotiationStatus !== 'awaiting_requester') {
      return res.status(400).json({ message: 'Alternate slots can only be suggested when awaiting requester response' });
    }

    if (reqDoc.requesterAlternateSlots && reqDoc.requesterAlternateSlots.length > 0) {
      return res.status(400).json({ message: 'Alternate slots already suggested' });
    }

    if (!Array.isArray(slots) || slots.length === 0 || slots.length > 2) {
      return res.status(400).json({ message: 'Provide 1 or 2 alternate time slots' });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({ message: 'Reason for unavailability is required' });
    }

    const now = new Date();
    const normalizedSlots = slots.map((s) => {
      const start = new Date(s.start);
      return {
        start,
        end: start,
      };
    });
    if (normalizedSlots.some((s) => isNaN(s.start) || s.start < now)) {
      return res.status(400).json({ message: 'Cannot select a time before the current time' });
    }

    reqDoc.requesterAlternateSlots = normalizedSlots;
    reqDoc.requesterAlternateReason = reason.trim();
    reqDoc.requesterSuggestedAt = new Date();
    reqDoc.negotiationStatus = 'awaiting_interviewer';
    await reqDoc.save();

    // Notify interviewer about alternate proposal
    const populated = await reqDoc.populate('assignedInterviewer', 'username firstName lastName email');
    await populated.populate('requester', 'username firstName lastName');
    
    const io = req.app.get('io');
    const candidateName = `${populated.requester.firstName || ''} ${populated.requester.lastName || ''}`.trim() || populated.requester.username;
    
    if (populated.assignedInterviewer) {
      // Create notification
      const notification = await Notification.create({
        userId: populated.assignedInterviewer._id,
        type: 'interview-alternate-suggested',
        message: `${candidateName} has suggested alternate time slots for the mock interview at ${populated.company}.`,
        requestId: populated._id,
        requesterId: populated.requester._id,
        requesterName: candidateName,
        company: populated.company,
        position: populated.position,
        timestamp: Date.now(),
      });
      
      if (io) {
        io.to(populated.assignedInterviewer._id.toString()).emit('notification', notification);
        // Emit toaster event
        io.to(populated.assignedInterviewer._id.toString()).emit('interview-time-update', {
          type: 'alternate-slots-suggested',
          requestId: populated._id,
          company: populated.company,
          position: populated.position,
          slots: normalizedSlots,
          reason: reason.trim(),
          message: `${candidateName} has suggested ${normalizedSlots.length} alternate time slot${normalizedSlots.length > 1 ? 's' : ''}.`,
        });
      }
      
      // Send email to interviewer
      try {
        if (populated.assignedInterviewer.email) {
          const slotsText = normalizedSlots.map((s, i) => `Option ${i + 1}: ${new Date(s.start).toLocaleString()}`).join('<br/>');
          const tpl = await getEmailTemplate('interviewAlternateSlotsProposed', {
            interviewerName: populated.assignedInterviewer.firstName || populated.assignedInterviewer.username,
            candidateName,
            company: populated.company,
            position: populated.position,
            slots: slotsText,
            reason: reason.trim()
          });
          await sendMail({ to: populated.assignedInterviewer.email, subject: tpl.subject, html: tpl.html });
          console.log(`[Interview] Alternate slots email sent to interviewer: ${populated.assignedInterviewer.email}`);
        }
      } catch (e) {
        console.error('Failed to send alternate slots email', e);
      }
    }

    res.json({ message: 'Alternate slots submitted', request: reqDoc });
  } catch (err) {
    console.error('requesterSuggestAlternateSlots error', err);
    res.status(500).json({ message: 'Failed to submit alternate slots' });
  }
};

// Interviewer accepts one of the requester’s alternate slots
exports.interviewerAcceptAlternateSlot = async (req, res) => {
  try {
    const { requestId, slotIndex } = req.body;

    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    if (!reqDoc.assignedInterviewer || reqDoc.assignedInterviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept alternate slots for this interview' });
    }

    if (reqDoc.status === 'scheduled' || reqDoc.status === 'completed' || reqDoc.status === 'cancelled' || reqDoc.status === 'rejected') {
      return res.status(400).json({ message: 'Interview already finalized' });
    }

    if (!reqDoc.requesterAlternateSlots || reqDoc.requesterAlternateSlots.length === 0) {
      return res.status(400).json({ message: 'No alternate slots to accept' });
    }

    if (reqDoc.negotiationStatus !== 'awaiting_interviewer') {
      return res.status(400).json({ message: 'Not awaiting interviewer response to alternates' });
    }

    if (typeof slotIndex !== 'number' || slotIndex < 0 || slotIndex >= reqDoc.requesterAlternateSlots.length) {
      return res.status(400).json({ message: 'Invalid slot index' });
    }

    const chosen = reqDoc.requesterAlternateSlots[slotIndex];
    await finalizeInterviewSchedule(reqDoc, req.app, chosen.start, { autoScheduled: false });

    res.json({ message: 'Interview scheduled', request: reqDoc });
  } catch (err) {
    console.error('interviewerAcceptAlternateSlot error', err);
    res.status(500).json({ message: 'Failed to accept alternate slot' });
  }
};

// Interviewer rejects both requester alternate slots; requester must choose from original only
exports.interviewerRejectAlternateSlots = async (req, res) => {
  try {
    const { requestId } = req.body;

    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    if (!reqDoc.assignedInterviewer || reqDoc.assignedInterviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject alternate slots for this interview' });
    }

    if (reqDoc.status === 'scheduled' || reqDoc.status === 'completed' || reqDoc.status === 'cancelled' || reqDoc.status === 'rejected') {
      return res.status(400).json({ message: 'Interview already finalized' });
    }

    if (!reqDoc.requesterAlternateSlots || reqDoc.requesterAlternateSlots.length === 0) {
      return res.status(400).json({ message: 'No alternate slots to reject' });
    }

    if (reqDoc.negotiationStatus !== 'awaiting_interviewer') {
      return res.status(400).json({ message: 'Not awaiting interviewer response to alternates' });
    }

    // Mark alternates as rejected and move back to awaiting requester to choose from original slots only
    reqDoc.alternateSlotsRejected = true;
    reqDoc.negotiationStatus = 'awaiting_requester';
    await reqDoc.save();

    const populated = await reqDoc.populate('requester', 'username firstName lastName email');
    await populated.populate('assignedInterviewer', 'username firstName lastName');

    const io = req.app.get('io');
    const requesterName = populated.requester?.firstName || populated.requester?.username || 'Candidate';
    const interviewerName = populated.assignedInterviewer?.firstName || populated.assignedInterviewer?.username || 'Interviewer';
    if (populated.requester) {
      const notification = await Notification.create({
        userId: populated.requester._id,
        type: 'interview-alternate-rejected',
        message: `${interviewerName} is unable to accommodate your alternate time slots for ${populated.company}. Please choose from the original suggestions.`,
        requestId: populated._id,
        company: populated.company,
        position: populated.position,
        timestamp: Date.now(),
      });
      if (io) {
        io.to(populated.requester._id.toString()).emit('notification', notification);
        io.to(populated.requester._id.toString()).emit('interview-time-update', {
          type: 'alternate-rejected',
          requestId: populated._id,
          company: populated.company,
          position: populated.position,
          message: `Please choose from ${interviewerName}'s original time slots.`,
        });
      }

      // Send email to candidate
      try {
        if (populated.requester.email) {
          const tpl = await getEmailTemplate('interviewAlternateRejected', {
            requesterName,
            interviewerName,
            company: populated.company,
            position: populated.position,
          });
          await sendMail({ to: populated.requester.email, subject: tpl.subject, html: tpl.html });
          console.log(`[Interview] Alternate rejection email sent to candidate: ${populated.requester.email}`);
        }
      } catch (e) {
        console.error('Failed to send alternate rejection email', e);
      }
    }

    res.json({ message: 'Alternate slots rejected', request: reqDoc });
  } catch (err) {
    console.error('interviewerRejectAlternateSlots error', err);
    res.status(500).json({ message: 'Failed to reject alternate slots' });
  }
};

// Assigned interviewer approves the interview request (quick schedule)
exports.approveAssignedInterview = async (req, res) => {
  try {
    const { requestId } = req.body;
    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });
    // Only assigned interviewer can approve
    if (!reqDoc.assignedInterviewer || String(reqDoc.assignedInterviewer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to approve this interview' });
    }
    // Mark as scheduled now
    reqDoc.status = 'scheduled';
    if (!reqDoc.scheduledAt) reqDoc.scheduledAt = new Date();
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName');

    // Notify requester
    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        userId: reqDoc.requester._id,
        type: 'interview-approved',
        message: `Your interview request has been approved and scheduled`,
        requestId: reqDoc._id,
        requesterId: reqDoc.assignedInterviewer,
        requesterName: `${reqDoc.assignedInterviewer.firstName || ''} ${reqDoc.assignedInterviewer.lastName || ''}`,
        company: reqDoc.company,
        position: reqDoc.position,
        timestamp: Date.now(),
      });
      if (io) io.to(reqDoc.requester._id.toString()).emit('notification', notification);
    } catch (e) { console.error('[approveAssignedInterview] notify requester failed', e); }

    // Also send an email to the requester (candidate)
    try {
      const requester = await User.findById(reqDoc.requester);
      if (requester?.email) {
        const tpl = await getEmailTemplate('interviewScheduled', {
          requesterName: requester.firstName || requester.username,
          company: reqDoc.company,
          position: reqDoc.position,
          scheduledAt: reqDoc.scheduledAt ? reqDoc.scheduledAt.toLocaleString() : 'TBD'
        });
        await sendMail({ to: requester.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send interview approval email', e);
    }

    // Also notify interviewer
    try {
      const notifInterviewer = await Notification.create({
        userId: reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer,
        type: 'interview-approved-confirmation',
        message: `You approved the interview. Participants can now join`,
        requestId: reqDoc._id,
        company: reqDoc.company,
        position: reqDoc.position,
        timestamp: Date.now(),
      });
      if (io) io.to((reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer).toString()).emit('notification', notifInterviewer);
    } catch (e) { console.error('[approveAssignedInterview] notify interviewer failed', e); }

    // Update snapshots for interviewer and requester (upcoming)
    try {
      const assignedId = reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer;
      await ApprovedInterviewer.findOneAndUpdate(
        { user: assignedId },
        {
          $inc: { 'aggregates.upcomingInterviews': 1 },
          $push: {
            upcomingSessions: {
              requestId: reqDoc._id,
              requester: reqDoc.requester._id || reqDoc.requester,
              requesterName: `${reqDoc.requester.firstName || ''} ${reqDoc.requester.lastName || ''}`.trim() || reqDoc.requester.username || '',
              company: reqDoc.company || '',
              position: reqDoc.position || '',
              scheduledAt: reqDoc.scheduledAt,
              status: 'scheduled'
            }
          }
        },
        { upsert: true }
      );
    } catch (e) { console.error('[approveAssignedInterview] interviewer snapshot failed', e); }

    try {
      const requesterId = reqDoc.requester._id || reqDoc.requester;
      const interviewerObj = reqDoc.assignedInterviewer || {};
      await UserInterviewSnapshot.findOneAndUpdate(
        { user: requesterId },
        {
          $inc: { 'aggregates.upcomingInterviews': 1 },
          $push: {
            upcomingSessions: {
              requestId: reqDoc._id,
              interviewer: interviewerObj._id || interviewerObj,
              interviewerName: `${interviewerObj.firstName || ''} ${interviewerObj.lastName || ''}`.trim() || interviewerObj.username || '',
              company: reqDoc.company || '',
              position: reqDoc.position || '',
              scheduledAt: reqDoc.scheduledAt,
              status: 'scheduled'
            }
          }
        },
        { upsert: true }
      );
    } catch (e) { console.error('[approveAssignedInterview] requester snapshot failed', e); }

    return res.json({ message: 'Interview approved and scheduled', request: reqDoc });
  } catch (err) {
    console.error('approveAssignedInterview error', err);
    res.status(500).json({ message: 'Failed to approve interview' });
  }
};

// Assigned interviewer rejects the interview request
exports.rejectAssignedInterview = async (req, res) => {
  try {
    const { requestId, reason } = req.body;
    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });
    if (!reqDoc.assignedInterviewer || String(reqDoc.assignedInterviewer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to reject this interview' });
    }
    reqDoc.status = 'rejected';
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName');

    const io = req.app.get('io');
    try {
      const notification = await Notification.create({
        userId: reqDoc.requester._id,
        type: 'interview-rejected',
        message: `Your interview request was rejected${reason ? `: ${reason}` : ''}`,
        requestId: reqDoc._id,
        company: reqDoc.company,
        position: reqDoc.position,
        timestamp: Date.now(),
      });
      if (io) io.to(reqDoc.requester._id.toString()).emit('notification', notification);
    } catch (e) { console.error('[rejectAssignedInterview] notify requester failed', e); }

    // Also send an email to the requester (candidate)
    try {
      const requester = await User.findById(reqDoc.requester);
      if (requester?.email) {
        const tpl = await getEmailTemplate('interviewRejected', {
          requesterName: requester.firstName || requester.username,
          company: reqDoc.company,
          position: reqDoc.position,
          reason: reason || ''
        });
        await sendMail({ to: requester.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send interview rejection email', e);
    }

    return res.json({ message: 'Interview request rejected', request: reqDoc });
  } catch (err) {
    console.error('rejectAssignedInterview error', err);
    res.status(500).json({ message: 'Failed to reject interview' });
  }
};

// Interviewer schedules date/time for assigned request
exports.scheduleInterview = async (req, res) => {
  try {
    const { requestId, scheduledAt } = req.body; // scheduledAt should be ISO date string
    console.info(`[DEBUG] scheduleInterview called by user ${req.user && req.user._id ? req.user._id.toString() : 'unknown'} for request ${requestId} with scheduledAt=${scheduledAt}`);
    // ensure logs directory exists and append a persistent record
    try {
      const logsDir = path.join(__dirname, '..', 'logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
      const line = `${new Date().toISOString()} | user=${req.user && req.user._id ? req.user._id.toString() : 'unknown'} | request=${requestId} | scheduledAt=${scheduledAt}${os.EOL}`;
      fs.appendFileSync(path.join(logsDir, 'schedule.log'), line);
    } catch (logErr) {
      console.error('[DEBUG] failed to write schedule.log', logErr);
    }
    const reqDoc = await InterviewRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Interview request not found' });

    // Only assigned interviewer can schedule
    if (!reqDoc.assignedInterviewer || reqDoc.assignedInterviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to schedule this interview' });
    }

    reqDoc.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    reqDoc.status = 'scheduled';
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName email');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName email');

    // Notify requester (candidate) with socket event
    const io = req.app.get('io');
    const notificationMessage = `Your interview for ${reqDoc.position} at ${reqDoc.company} has been scheduled for ${reqDoc.scheduledAt ? new Date(reqDoc.scheduledAt).toLocaleString() : 'TBD'}`;
    
    const notification = await Notification.create({
      userId: reqDoc.requester._id,
      type: 'interview-scheduled',
      message: notificationMessage,
      requestId: reqDoc._id,
      requesterId: reqDoc.assignedInterviewer._id,
      requesterName: `${reqDoc.assignedInterviewer.firstName || ''} ${reqDoc.assignedInterviewer.lastName || ''}`.trim() || reqDoc.assignedInterviewer.username,
      company: reqDoc.company,
      position: reqDoc.position,
      timestamp: Date.now(),
    });

    if (io) {
      io.to(reqDoc.requester._id.toString()).emit('notification', notification);
      // Emit toast event for real-time popup
      io.to(reqDoc.requester._id.toString()).emit('interview-time-update', {
        type: 'schedule',
        requestId: reqDoc._id,
        company: reqDoc.company,
        position: reqDoc.position,
        scheduledAt: reqDoc.scheduledAt,
        message: notificationMessage,
      });
    }

    // Send email to candidate (requester)
    try {
      if (reqDoc.requester?.email) {
        const tpl = await getEmailTemplate('interviewScheduled', {
          requesterName: reqDoc.requester.firstName || reqDoc.requester.username,
          company: reqDoc.company,
          position: reqDoc.position,
          scheduledAt: reqDoc.scheduledAt ? new Date(reqDoc.scheduledAt).toLocaleString() : 'TBD',
          interviewerName: `${reqDoc.assignedInterviewer.firstName || ''} ${reqDoc.assignedInterviewer.lastName || ''}`.trim() || reqDoc.assignedInterviewer.username
        });
        await sendMail({ to: reqDoc.requester.email, subject: tpl.subject, html: tpl.html });
        console.log(`[Interview] Schedule email sent to candidate: ${reqDoc.requester.email}`);
      }
    } catch (e) {
      console.error('Failed to send interview schedule email to candidate', e);
    }

    // Notify and email the interviewer (confirmation)
    try {
      const interviewerMessage = `You have scheduled the interview for ${reqDoc.position} at ${reqDoc.company} for ${reqDoc.scheduledAt ? new Date(reqDoc.scheduledAt).toLocaleString() : 'TBD'}`;
      
      const notifInterviewer = await Notification.create({
        userId: reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer,
        type: 'interview-scheduled-confirmation',
        message: interviewerMessage,
        requestId: reqDoc._id,
        requesterId: reqDoc.requester._id,
        requesterName: `${reqDoc.requester.firstName || ''} ${reqDoc.requester.lastName || ''}`.trim() || reqDoc.requester.username,
        company: reqDoc.company,
        position: reqDoc.position,
        timestamp: Date.now(),
      });
      
      if (io && reqDoc.assignedInterviewer) {
        io.to((reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer).toString()).emit('notification', notifInterviewer);
        // Emit toast event for interviewer
        io.to((reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer).toString()).emit('interview-time-update', {
          type: 'schedule-confirmation',
          requestId: reqDoc._id,
          company: reqDoc.company,
          position: reqDoc.position,
          scheduledAt: reqDoc.scheduledAt,
          message: interviewerMessage,
        });
      }
      
      // Send email to interviewer
      if (reqDoc.assignedInterviewer?.email) {
        const interviewerEmailTpl = await getEmailTemplate('interviewScheduledInterviewer', {
          interviewerName: reqDoc.assignedInterviewer.firstName || reqDoc.assignedInterviewer.username,
          company: reqDoc.company,
          position: reqDoc.position,
          scheduledAt: reqDoc.scheduledAt ? new Date(reqDoc.scheduledAt).toLocaleString() : 'TBD',
          candidateName: `${reqDoc.requester.firstName || ''} ${reqDoc.requester.lastName || ''}`.trim() || reqDoc.requester.username
        });
        await sendMail({ to: reqDoc.assignedInterviewer.email, subject: interviewerEmailTpl.subject, html: interviewerEmailTpl.html });
        console.log(`[Interview] Schedule confirmation email sent to interviewer: ${reqDoc.assignedInterviewer.email}`);
      }
    } catch (e) {
      console.error('[Interview] Failed to send interviewer confirmation notification/email', e);
    }

    // Emit socket events to update request counts on all devices
    if (io) {
      io.to(reqDoc.requester._id.toString()).emit('request-count-updated');
      if (reqDoc.assignedInterviewer) {
        io.to((reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer).toString()).emit('request-count-updated');
      }
    }

    res.json({ message: 'Interview scheduled', request: reqDoc });
  } catch (err) {
    console.error('scheduleInterview error', err);
    res.status(500).json({ message: 'Failed to schedule interview' });
  }
};

// Get scheduled interviews for user or interviewer (either role)
exports.getScheduledForUserOrInterviewer = async (req, res) => {
  try {
    const userId = req.user._id;
    const scheduled = await InterviewRequest.find({
      $or: [{ requester: userId }, { assignedInterviewer: userId }],
      status: 'scheduled'
    }).populate('requester', 'username firstName lastName')
      .populate('assignedInterviewer', 'username firstName lastName')
      .sort({ scheduledAt: 1 });

    // Fetch interviewer stats for each scheduled interview
    const scheduledWithStats = await Promise.all(scheduled.map(async (interview) => {
      const interviewObj = interview.toObject();

      // Get interviewer stats and application details if assignedInterviewer exists
      if (interview.assignedInterviewer) {
        const assignedUserId = interview.assignedInterviewer._id || interview.assignedInterviewer;
        const interviewerApp = await InterviewerApplication.findOne({ user: assignedUserId });

        if (interviewerApp) {
          interviewObj.interviewerStats = {
            conductedInterviews: interviewerApp.conductedInterviews || 0,
            averageRating: interviewerApp.averageRating || 0,
            totalRatings: interviewerApp.totalRatings || 0
          };
          interviewObj.interviewerApp = {
            company: interviewerApp.company || '',
            position: interviewerApp.position || interviewerApp.qualification || '',
          };
        }
      }

      return interviewObj;
    }));

    res.json(scheduledWithStats);
  } catch (err) {
    console.error('getScheduledForUserOrInterviewer error', err);
    res.status(500).json({ message: 'Failed to fetch scheduled interviews' });
  }
};

// Rate an interviewer after completed interview
exports.rateInterviewer = async (req, res) => {
  try {
    const { requestId, rating, feedback } = req.body;
    const userId = req.user._id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find the interview request
    const request = await InterviewRequest.findById(requestId)
      .populate('assignedInterviewer');

    if (!request) {
      return res.status(404).json({ message: 'Interview request not found' });
    }

    // Verify user is the requester
    if (request.requester.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the requester can rate the interview' });
    }

    // Check if already rated
    if (request.rating) {
      return res.status(400).json({ message: 'Interview already rated' });
    }

    // Update interview request with rating
    request.rating = rating;
    request.feedback = feedback || '';
    request.ratedAt = new Date();
    request.status = 'completed';
    await request.save();

    // Update interviewer's average rating
    if (request.assignedInterviewer) {
      const interviewerApp = await InterviewerApplication.findOne({ 
        user: request.assignedInterviewer._id || request.assignedInterviewer 
      });

      if (interviewerApp) {
        const currentTotal = interviewerApp.averageRating * interviewerApp.totalRatings;
        interviewerApp.totalRatings += 1;
        interviewerApp.averageRating = (currentTotal + rating) / interviewerApp.totalRatings;
        interviewerApp.conductedInterviews += 1;
        await interviewerApp.save();
      }

      // Create notification for interviewer
      try {
        const notification = await Notification.create({
          userId: request.assignedInterviewer._id || request.assignedInterviewer,
          type: 'interview-rated',
          message: `You received a ${rating}-star rating for your interview`,
          requestId: request._id,
          timestamp: Date.now(),
        });
        
        const io = req.app.get('io');
        if (io) {
          io.to((request.assignedInterviewer._id || request.assignedInterviewer).toString())
            .emit('notification', notification);
        }
      } catch (e) {
        console.error('Failed to create rating notification', e);
      }
    }

    res.json({ 
      message: 'Rating submitted successfully', 
      request,
      updatedRating: {
        rating: request.rating,
        feedback: request.feedback
      }
    });
    // Contribution:
    //  - SESSION_RATED for the requester (student)
    //  - INTERVIEW_COMPLETED for the interviewer only (hosted interview)
    // These use ContributionEvent for idempotency, so if the socket
    // end-call handler has already recorded INTERVIEW_COMPLETED for
    // the interviewer, these calls will safely no-op on duplicates.
    try {
      const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
      const io = req.app.get('io');
      const interviewerId = request.assignedInterviewer && (request.assignedInterviewer._id || request.assignedInterviewer);

      const tasks = [
        trackActivity({
          userId,
          activityType: ACTIVITY_TYPES.SESSION_RATED,
          activityId: request._id.toString(),
          io,
        }),
      ];

      if (interviewerId) {
        tasks.push(
          trackActivity({
            userId: interviewerId,
            activityType: ACTIVITY_TYPES.INTERVIEW_COMPLETED,
            activityId: request._id.toString(),
            io,
          })
        );
      }

      await Promise.all(tasks);
    } catch (_) {}

    // Update ApprovedInterviewer stats and aggregates
    try {
      if (request.assignedInterviewer) {
        const assignedId = request.assignedInterviewer._id || request.assignedInterviewer;
        // decrement upcoming, increment past; update rating stats
        await ApprovedInterviewer.findOneAndUpdate(
          { user: assignedId },
          {
            $inc: {
              'aggregates.upcomingInterviews': request.scheduledAt ? -1 : 0,
              'aggregates.pastInterviews': 1,
              'stats.totalRatings': 1,
              'stats.conductedInterviews': 1,
            },
            $pull: { upcomingSessions: { requestId: request._id } },
            $push: {
              pastSessions: {
                requestId: request._id,
                requester: request.requester,
                requesterName: '',
                company: request.company || '',
                position: request.position || '',
                scheduledAt: request.scheduledAt,
                completedAt: new Date(),
                rating: request.rating || 0,
                feedback: request.feedback || '',
                status: 'completed'
              }
            }
          }
        );
        // Recompute average rating
        const snap = await ApprovedInterviewer.findOne({ user: assignedId });
        if (snap) {
          const total = (snap.stats.averageRating || 0) * (snap.stats.totalRatings || 0);
          const newTotalRatings = (snap.stats.totalRatings || 0);
          const newAvg = newTotalRatings > 0 ? (total + request.rating) / (newTotalRatings) : request.rating;
          snap.stats.averageRating = newAvg;
          await snap.save();
        }
      }
    } catch (e) {
      console.error('[ApprovedInterviewer] failed to update snapshot on rating', e);
    }

    // Update Requester snapshot (move upcoming -> past)
    try {
      const requesterId = request.requester._id || request.requester;
      await UserInterviewSnapshot.findOneAndUpdate(
        { user: requesterId },
        {
          $inc: {
            'aggregates.upcomingInterviews': request.scheduledAt ? -1 : 0,
            'aggregates.pastInterviews': 1,
          },
          $pull: { upcomingSessions: { requestId: request._id } },
          $push: {
            pastSessions: {
              requestId: request._id,
              interviewer: request.assignedInterviewer?._id || request.assignedInterviewer,
              interviewerName: '',
              company: request.company || '',
              position: request.position || '',
              scheduledAt: request.scheduledAt,
              completedAt: new Date(),
              rating: request.rating || 0,
              feedback: request.feedback || '',
              status: 'completed'
            }
          }
        },
        { upsert: true }
      );
    } catch (e) {
      console.error('[UserInterviewSnapshot] failed to move session to past', e);
    }
  } catch (err) {
    console.error('rateInterviewer error', err);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
};

// Get user's interview history (for stats and past interviews)
exports.getMyInterviews = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all interviews where user is either requester or interviewer
    const interviews = await InterviewRequest.find({
      $or: [{ requester: userId }, { assignedInterviewer: userId }]
    })
    .populate('requester', 'username firstName lastName profilePic')
    .populate('assignedInterviewer', 'username firstName lastName profilePic')
    .sort({ createdAt: -1 });

    // Fetch interviewer stats and application details for each interview
    const interviewsWithStats = await Promise.all(interviews.map(async (interview) => {
      const interviewObj = interview.toObject();
      
      // Get interviewer stats and application details if assignedInterviewer exists
      if (interview.assignedInterviewer) {
        const assignedUserId = interview.assignedInterviewer._id || interview.assignedInterviewer;
        const interviewerApp = await InterviewerApplication.findOne({ user: assignedUserId });
        
        if (interviewerApp) {
          interviewObj.interviewerStats = {
            conductedInterviews: interviewerApp.conductedInterviews || 0,
            averageRating: interviewerApp.averageRating || 0,
            totalRatings: interviewerApp.totalRatings || 0
          };
          interviewObj.interviewerApp = {
            company: interviewerApp.company || '',
            position: interviewerApp.position || interviewerApp.qualification || '',
          };
        }
      }
      
      return interviewObj;
    }));

    res.json(interviewsWithStats);
  } catch (err) {
    console.error('getMyInterviews error', err);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
};

// Get interview statistics for dashboard
exports.getInterviewStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all interviews for the user
    const allInterviews = await InterviewRequest.find({
      $or: [{ requester: userId }, { assignedInterviewer: userId }]
    });

    // Count interviews by status (as requester/participant)
    const myRequests = allInterviews.filter(i => String(i.requester) === String(userId));
    const totalRequested = myRequests.length;
    const totalCompletedAsRequester = myRequests.filter(i => i.status === 'completed').length;
    const totalScheduled = myRequests.filter(i => i.status === 'scheduled').length;
    const totalPending = myRequests.filter(i => i.status === 'pending').length;

    // Count interviews conducted as interviewer
    const asConductor = allInterviews.filter(i => String(i.assignedInterviewer) === String(userId));
    const totalConducted = asConductor.length;
    const totalCompletedAsConductor = asConductor.filter(i => i.status === 'completed').length;

    // Total interviews (both as participant and interviewer)
    const totalInterviews = totalRequested + totalConducted;
    const totalCompleted = totalCompletedAsRequester + totalCompletedAsConductor;

    // Calculate success rate based on all interviews
    const successRate = totalInterviews > 0 ? Math.round((totalCompleted / totalInterviews) * 100) : 0;

    // If user is an interviewer, get their stats
    const interviewerApp = await InterviewerApplication.findOne({ user: userId });
    let asInterviewer = null;
    let totalHosted = 0;
    
    if (interviewerApp && interviewerApp.status === 'approved') {
      asInterviewer = {
        totalConducted: totalCompletedAsConductor,
        averageRating: interviewerApp.averageRating || 0,
        totalRatings: interviewerApp.totalRatings || 0,
        conductedInterviews: interviewerApp.conductedInterviews || 0
      };
      // Hosted interviews = interviews this user actually conducted (completed)
      totalHosted = interviewerApp.conductedInterviews || 0;
    }

    // If user is not an approved interviewer, they should not have any hosted interviews
    if (!asInterviewer) {
      totalHosted = 0;
    }

    res.json({
      // For StatsSection component - includes both participant and interviewer interviews
      totalInterviews,
      successRate,
      // For the public stats widget, "Interviews Hosted" should only count
      // interviews where this user acted as interviewer and the session was completed.
      totalExperts: totalHosted,
      // Detailed breakdown
      asRequester: {
        totalRequested,
        totalCompleted: totalCompletedAsRequester,
        totalScheduled,
        totalPending
      },
      asInterviewer
    });
  } catch (err) {
    console.error('getInterviewStats error', err);
    res.status(500).json({ message: 'Failed to fetch interview stats' });
  }
};

// Get global top performers (top interviewers and top candidates) - OPTIMIZED
exports.getTopPerformers = async (req, res) => {
  try {
    // OPTIMIZATION: Use aggregation pipeline for faster processing
    // Fetch only completed interviews for interviewers (more relevant)
    const completedInterviews = await InterviewRequest.find({ 
      status: 'completed',
      assignedInterviewer: { $exists: true, $ne: null }
    })
      .select('assignedInterviewer rating company position')
      .populate('assignedInterviewer', 'firstName lastName username profilePic')
      .lean();

    // Fetch all requests for candidates count
    const allRequests = await InterviewRequest.find({ requester: { $exists: true, $ne: null } })
      .select('requester company position')
      .populate('requester', 'firstName lastName username profilePic')
      .lean();

    // Count interviews conducted by each interviewer (completed only)
    // Track company & position for each interviewer
    const interviewerMap = new Map();
    for (const interview of completedInterviews) {
      if (interview.assignedInterviewer) {
        const interviewerId = String(interview.assignedInterviewer._id);
        if (!interviewerMap.has(interviewerId)) {
          interviewerMap.set(interviewerId, {
            user: interview.assignedInterviewer,
            count: 0,
            totalRating: 0,
            ratingCount: 0,
            companyCount: {},
            positionCount: {}
          });
        }
        const data = interviewerMap.get(interviewerId);
        data.count += 1;
        
        // Track company frequency
        if (interview.company) {
          data.companyCount[interview.company] = (data.companyCount[interview.company] || 0) + 1;
        }
        
        // Track position frequency
        if (interview.position) {
          data.positionCount[interview.position] = (data.positionCount[interview.position] || 0) + 1;
        }
        
        if (interview.rating && interview.rating > 0) {
          data.totalRating += interview.rating;
          data.ratingCount += 1;
        }
      }
    }

    // Count for candidates (all requests)
    // Track position for each candidate
    const candidateMap = new Map();
    for (const request of allRequests) {
      if (request.requester) {
        const candidateId = String(request.requester._id);
        if (!candidateMap.has(candidateId)) {
          candidateMap.set(candidateId, {
            user: request.requester,
            count: 0,
            positionCount: {}
          });
        }
        const data = candidateMap.get(candidateId);
        data.count += 1;
        
        // Track position frequency for candidates
        if (request.position) {
          data.positionCount[request.position] = (data.positionCount[request.position] || 0) + 1;
        }
      }
    }

    // Helper function to get most frequent value
    const getMostFrequent = (countObj) => {
      if (!countObj || Object.keys(countObj).length === 0) return null;
      return Object.entries(countObj).sort((a, b) => b[1] - a[1])[0][0];
    };

    // Convert to arrays and calculate averages - limit to top 3 for performance
    const topInterviewers = Array.from(interviewerMap.values())
      .map(item => ({
        user: item.user,
        count: item.count,
        avgRating: item.ratingCount > 0 ? Math.round((item.totalRating / item.ratingCount) * 10) / 10 : 0,
        company: getMostFrequent(item.companyCount) || 'Not specified',
        position: getMostFrequent(item.positionCount) || 'Not specified'
      }))
      .sort((a, b) => {
        // Sort by count first, then by rating
        if (b.count !== a.count) return b.count - a.count;
        return b.avgRating - a.avgRating;
      })
      .slice(0, 3); // Only return top 3

    const topCandidates = Array.from(candidateMap.values())
      .map(item => ({
        user: item.user,
        count: item.count,
        position: getMostFrequent(item.positionCount) || 'Not specified',
        avgRating: 0 // Candidates don't have ratings
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Only return top 3

    // Cache response header for 5 minutes to reduce DB load
    res.set('Cache-Control', 'public, max-age=300');
    
    res.json({
      topInterviewers,
      topCandidates
    });
  } catch (err) {
    console.error('getTopPerformers error', err);
    res.status(500).json({ message: 'Failed to fetch top performers' });
  }
};

// Get all feedback for a specific interviewer
exports.getInterviewerFeedback = async (req, res) => {
  try {
    const { interviewerId } = req.params;
    
    if (!interviewerId) {
      return res.status(400).json({ message: 'Interviewer ID is required' });
    }

    // Get all completed interviews for this interviewer with ratings
    const feedbacks = await InterviewRequest.find({
      assignedInterviewer: interviewerId,
      status: 'completed',
      rating: { $exists: true, $ne: null }
    })
    .populate('requester', 'firstName lastName username profilePic')
    .sort({ updatedAt: -1 })
    .lean();

    // Calculate rating distribution
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    let totalRating = 0;
    let ratingCount = 0;

    feedbacks.forEach(interview => {
      if (interview.rating) {
        ratingDistribution[interview.rating]++;
        totalRating += interview.rating;
        ratingCount++;
      }
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    res.json({
      feedbacks,
      ratingDistribution,
      averageRating,
      totalCount: ratingCount
    });
  } catch (err) {
    console.error('getInterviewerFeedback error', err);
    res.status(500).json({ message: 'Failed to fetch interviewer feedback' });
  }
};

module.exports = exports;

// Admin: delete interviewer and cascade remove related documents
exports.deleteInterviewerAndCascade = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });

    // Delete ApprovedInterviewer snapshot
    await ApprovedInterviewer.deleteOne({ user: userId });
    // Delete InterviewerApplication
    await InterviewerApplication.deleteOne({ user: userId });
    // Nullify assignedInterviewer in pending/scheduled requests; optionally delete if desired
    await InterviewRequest.updateMany(
      { assignedInterviewer: userId, status: { $in: ['pending','scheduled'] } },
      { $set: { assignedInterviewer: null, status: 'pending' } }
    );
    // For completed requests, keep history but they will no longer link to that interviewer

    // Finally delete the User if you want full removal (optional)
    if (req.body.removeUser === true) {
      await User.deleteOne({ _id: userId });
    }

    res.json({ message: 'Interviewer data deleted and requests detached' });
  } catch (err) {
    console.error('deleteInterviewerAndCascade error', err);
    res.status(500).json({ message: 'Failed to delete interviewer' });
  }
};

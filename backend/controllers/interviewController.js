const InterviewRequest = require('../models/InterviewRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const InterviewerApplication = require('../models/InterviewerApplication');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const supabase = require('../utils/supabaseClient');
const { sendMail } = require('../utils/sendMail');
const T = require('../utils/emailTemplates');

// Get single interview request by ID
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const request = await InterviewRequest.findById(id)
      .populate('requester', 'firstName lastName username email')
      .populate('assignedInterviewer', 'firstName lastName username email');
    
    if (!request) {
      return res.status(404).json({ message: 'Interview request not found' });
    }
    
    // Check if user is part of this interview
    const isRequester = String(request.requester?._id) === String(userId);
    const isInterviewer = String(request.assignedInterviewer?._id) === String(userId);
    
    if (!isRequester && !isInterviewer) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    return res.json(request);
  } catch (err) {
    console.error('Error fetching interview request:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Multer memory storage for uploading resume directly to Supabase
// Accept only PDF up to 2MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') return cb(new Error('Resume must be a PDF'));
    cb(null, true);
  }
});

// Create a new interview request (by requester)
exports.submitRequest = async (req, res) => {
  try {
    const { company, position, message } = req.body;
    const requester = req.user._id;

    const { assignedInterviewer } = req.body;
    const reqDoc = new InterviewRequest({
      requester,
      company,
      position,
      message: message || '',
      // Status stays 'pending' even when user selects an interviewer - interviewer must schedule to confirm
      status: 'pending',
      assignedInterviewer: assignedInterviewer || null,
      // scheduledAt must only be set by the assigned interviewer via the schedule API
      scheduledAt: null,
    });

  await reqDoc.save();
    await reqDoc.populate('requester', 'firstName lastName username profilePic');

    // Notify admins
    const io = req.app.get('io');
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    let admin = null;
    if (adminEmail) admin = await User.findOne({ email: adminEmail });

    if (admin) {
      const notification = await Notification.create({
        userId: admin._id,
        type: 'interview-requested',
        message: `${req.user.firstName} ${req.user.lastName} requested an interview at ${company} for ${position}`,
        requestId: reqDoc._id,
        requesterId: requester,
        requesterName: `${req.user.firstName} ${req.user.lastName}`,
        company,
        position,
        timestamp: Date.now(),
      });

      if (io && admin._id) io.to(admin._id.toString()).emit('notification', notification);
    }

    // Email interviewer if pre-assigned
    if (reqDoc.assignedInterviewer) {
      try {
        const interviewer = await User.findById(reqDoc.assignedInterviewer);
        if (interviewer?.email) {
          const tpl = T.interviewAssigned({
            interviewerName: interviewer.firstName || interviewer.username,
            company,
            position,
            requesterName: `${req.user.firstName} ${req.user.lastName}`
          });
          await sendMail({ to: interviewer.email, subject: tpl.subject, html: tpl.html });
        }
      } catch (e) {
        console.error('Failed to send interviewer assignment email', e);
      }
    }
    res.status(201).json({ message: 'Interview request submitted', request: reqDoc });
    // No contribution on submit to avoid multi-counting; count when completed (rated)
  } catch (err) {
    console.error('submitRequest error', err);
    res.status(500).json({ message: 'Failed to submit interview request' });
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
    const { name, company, position, experience, totalPastInterviews, qualification } = req.body;
    const userId = req.user._id;
    let resumePublicUrl = '';

    // Upload resume to Supabase storage if provided
    if (req.file) {
      try {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const fileName = `${userId}-${Date.now()}${ext}`;
        const bucket = process.env.SUPABASE_INTERVIEWER_RESUMES_BUCKET || 'interviewer-resumes';

        const { error: uploadErr } = await supabase.storage
          .from(bucket)
          .upload(fileName, req.file.buffer, {
            contentType: 'application/pdf',
            upsert: false,
          });
        if (uploadErr) {
          console.error('[Supabase] Resume upload failed:', uploadErr);
          return res.status(500).json({ message: 'Failed to upload resume', detail: uploadErr.message, bucket });
        }
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
        resumePublicUrl = pub.publicUrl;
      } catch (uploadCatch) {
        console.error('[Supabase] Unexpected resume upload error', uploadCatch);
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
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
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

// Admin approves an application
exports.approveApplication = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    console.info('[DEBUG] approveApplication called by admin:', req.user && req.user._id ? req.user._id.toString() : req.user, 'appId:', id);
    const app = await InterviewerApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = 'approved';
    await app.save();

    // Mark user as interviewer by adding their expertise into profile (simple approach)
    const user = await User.findById(app.user._id);
    if (user) {
      user.role = 'both';
      // append to experience and skillsToTeach
      user.experience = user.experience || [];
      user.experience.push({ company: app.company || '', position: 'Interviewer', duration: app.experience || '', description: app.qualification || '' });
      user.skillsToTeach = user.skillsToTeach || [];
      user.skillsToTeach.push({ subject: app.company || '', topic: app.qualification || '' });
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

    res.json({ message: 'Application approved', application: app });
  } catch (err) {
    console.error('approveApplication error', err);
    res.status(500).json({ message: 'Failed to approve application' });
  }
};

// Admin rejects an application
exports.rejectApplication = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    console.info('[DEBUG] rejectApplication called by admin:', req.user && req.user._id ? req.user._id.toString() : req.user, 'appId:', id);
    const app = await InterviewerApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    app.status = 'rejected';
    await app.save();

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
    const apps = await InterviewerApplication.find({ status: 'approved' })
      .populate('user', 'username firstName lastName profilePic college');
    
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

// Get requests for the logged-in user (returns { received, sent } for normal users, all for admin)
exports.getUserRequests = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const isAdmin = req.user && req.user.email && req.user.email.toLowerCase() === adminEmail;

    if (isAdmin) {
      const all = await InterviewRequest.find().populate('requester', 'username firstName lastName').populate('assignedInterviewer', 'username firstName lastName').sort({ createdAt: -1 });
      return res.json(all);
    }

    // Find requests where the user is requester or the assigned interviewer
    const docs = await InterviewRequest.find({
      $or: [{ requester: req.user._id }, { assignedInterviewer: req.user._id }]
    }).populate('requester', 'username firstName lastName').populate('assignedInterviewer', 'username firstName lastName').sort({ createdAt: -1 });

    const sent = docs.filter(d => d.requester && d.requester._id.toString() === req.user._id.toString());
    const received = docs.filter(d => d.assignedInterviewer && d.assignedInterviewer._id.toString() === req.user._id.toString());

    res.json({ received, sent });
  } catch (err) {
    console.error('getUserRequests error', err);
    res.status(500).json({ message: 'Failed to fetch interview requests' });
  }
};

// Admin: get all requests (for admin UI)
exports.getAllRequests = async (req, res) => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (!(req.user && req.user.email && req.user.email.toLowerCase() === adminEmail)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const all = await InterviewRequest.find().populate('requester', 'username firstName lastName').populate('assignedInterviewer', 'username firstName lastName').sort({ createdAt: -1 });
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
    // Keep status as 'pending' - interviewer must schedule to confirm
    reqDoc.status = 'pending';
    await reqDoc.save();

    await reqDoc.populate('requester', 'username firstName lastName');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName');

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

    res.json({ message: 'Interviewer assigned', request: reqDoc });
  } catch (err) {
    console.error('assignInterviewer error', err);
    res.status(500).json({ message: 'Failed to assign interviewer' });
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

    await reqDoc.populate('requester', 'username firstName lastName');
    await reqDoc.populate('assignedInterviewer', 'username firstName lastName');

    // Notify requester (user)
    const io = req.app.get('io');
    const notification = await Notification.create({
      userId: reqDoc.requester._id,
      type: 'interview-scheduled',
      message: `Your interview has been scheduled for ${reqDoc.scheduledAt ? reqDoc.scheduledAt.toString() : 'TBD'}`,
      requestId: reqDoc._id,
      requesterId: reqDoc.assignedInterviewer,
      requesterName: `${reqDoc.assignedInterviewer.firstName || ''} ${reqDoc.assignedInterviewer.lastName || ''}`,
      company: reqDoc.company,
      position: reqDoc.position,
      timestamp: Date.now(),
    });

    if (io) io.to(reqDoc.requester._id.toString()).emit('notification', notification);

    // Also send email to requester
    try {
      const requester = await User.findById(reqDoc.requester);
      if (requester?.email) {
        const tpl = T.interviewScheduled({
          requesterName: requester.firstName || requester.username,
          company: reqDoc.company,
          position: reqDoc.position,
          scheduledAt: reqDoc.scheduledAt ? reqDoc.scheduledAt.toLocaleString() : 'TBD'
        });
        await sendMail({ to: requester.email, subject: tpl.subject, html: tpl.html });
      }
    } catch (e) {
      console.error('Failed to send interview schedule email', e);
    }

    // Also notify the assigned interviewer (confirmation)
    try {
      const notifInterviewer = await Notification.create({
        userId: reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer,
        type: 'interview-scheduled-confirmation',
        message: `You scheduled the interview for ${reqDoc.scheduledAt ? reqDoc.scheduledAt.toString() : 'TBD'}`,
        requestId: reqDoc._id,
        company: reqDoc.company,
        position: reqDoc.position,
        timestamp: Date.now(),
      });
      if (io && reqDoc.assignedInterviewer) io.to((reqDoc.assignedInterviewer._id || reqDoc.assignedInterviewer).toString()).emit('notification', notifInterviewer);
    } catch (e) {
      console.error('[DEBUG] failed to create interviewer confirmation notification', e);
    }

    res.json({ message: 'Interview scheduled', request: reqDoc });
    // No contribution on schedule to avoid multi-counting
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
    // Contribution: count once for both users when interview is marked completed via rating (idempotent)
    try {
      const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
      const io = req.app.get('io');
      const interviewerId = request.assignedInterviewer && (request.assignedInterviewer._id || request.assignedInterviewer);
      
      await Promise.all([
        // Track interview completion for requester
        trackActivity({
          userId,
          activityType: ACTIVITY_TYPES.INTERVIEW_COMPLETED,
          activityId: request._id.toString(),
          io
        }),
        // Track interview completion for interviewer
        interviewerId ? trackActivity({
          userId: interviewerId,
          activityType: ACTIVITY_TYPES.INTERVIEW_COMPLETED,
          activityId: request._id.toString(),
          io
        }) : Promise.resolve(),
        // Track session rating
        trackActivity({
          userId,
          activityType: ACTIVITY_TYPES.SESSION_RATED,
          activityId: request._id.toString(),
          io
        })
      ]);
    } catch (_) {}
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

    // Count unique experts (when user was a participant)
    const uniqueExperts = new Set();
    myRequests.forEach(i => {
      if (i.assignedInterviewer) {
        uniqueExperts.add(String(i.assignedInterviewer));
      }
    });

    // If user is an interviewer, get their stats
    const interviewerApp = await InterviewerApplication.findOne({ user: userId });
    let asInterviewer = null;
    
    if (interviewerApp && interviewerApp.status === 'approved') {
      asInterviewer = {
        totalConducted: totalCompletedAsConductor,
        averageRating: interviewerApp.averageRating || 0,
        totalRatings: interviewerApp.totalRatings || 0,
        conductedInterviews: interviewerApp.conductedInterviews || 0
      };
    }

    res.json({
      // For StatsSection component - includes both participant and interviewer interviews
      totalInterviews,
      successRate,
      totalExperts: uniqueExperts.size,
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

module.exports = exports;

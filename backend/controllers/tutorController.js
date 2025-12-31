const multer = require('multer');
const path = require('path');
const TutorApplication = require('../models/TutorApplication');
const User = require('../models/User');
const EmployeeActivity = require('../models/EmployeeActivity');
const supabase = require('../utils/supabaseClient');

// Helper: check whether a tutor application is within an employee's
// allowed class/subject scope. If either allowedClasses or
// allowedSubjects is empty, that dimension is treated as "all".
const isApplicationAllowedForEmployee = (employee, app) => {
  if (!employee) return true; // admin routes

  const allowedClasses = Array.isArray(employee.allowedClasses)
    ? employee.allowedClasses
    : [];
  const allowedSubjects = Array.isArray(employee.allowedSubjects)
    ? employee.allowedSubjects
    : [];

  const allowAllClasses = allowedClasses.length === 0;
  const allowAllSubjects = allowedSubjects.length === 0;

  if (allowAllClasses && allowAllSubjects) return true;

  const skills = Array.isArray(app.skills) ? app.skills : [];
  return skills.some((s) => {
    const clsOk = allowAllClasses || allowedClasses.includes(s.class);
    const subjOk = allowAllSubjects || allowedSubjects.includes(s.subject);
    return clsOk && subjOk;
  });
};

// Lightweight logger for employee tutor-approval actions
const logEmployeeTutorAction = async ({ employee, application, status }) => {
  if (!employee || !application) return;

  try {
    const firstSkill = Array.isArray(application.skills) && application.skills.length > 0
      ? application.skills[0]
      : null;

    await EmployeeActivity.findOneAndUpdate(
      {
        employee: employee._id,
        applicationId: application._id,
        applicationType: 'tutor',
      },
      {
        employee: employee._id,
        applicationId: application._id,
        applicationType: 'tutor',
        roleType: employee.accessPermissions || 'tutor',
        class: firstSkill ? firstSkill.class : undefined,
        subject: firstSkill ? firstSkill.subject : undefined,
        status,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error('[EmployeeActivity] Failed to log tutor action:', err.message);
  }
};

// Multer memory storage (we upload directly to Supabase; no local persistence needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max for video
});

// Single route handler middleware to parse two files: marksheet (PDF) & video
exports.uploadFields = upload.fields([
  { name: 'marksheet', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// Optional upload for skills-update flow (marksheet/video may be omitted)
exports.uploadOptionalFields = upload.fields([
  { name: 'marksheet', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]);

// Get available courses from CSV
exports.getCourses = async (req, res) => {
  try {
    const csvUrl = process.env.GOOGLE_DEGREE_CSV_URL;
    if (!csvUrl) {
      // Fallback courses if CSV URL not configured
      return res.json({
        courses: ['BCA', 'BSc CS', 'BCom', 'BA', 'BTech', 'MTech', 'MCA', 'MBA', 'BBA', 'BSc Maths', 'Other']
      });
    }

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch courses CSV');
    }

    const text = await response.text();
    const lines = text.split('\n').filter(l => l.trim());
    // Skip header row and parse courses
    // CSV format: DEGREE_CODE,Full Name,Type,Category
    // We only want the Full Name (second column)
    const courseList = lines.slice(1).map(line => {
      const columns = line.split(',');
      if (columns.length >= 2) {
        // Extract second column (Full Name) and remove quotes
        const fullName = columns[1].trim().replace(/^"|"$/g, '');
        return fullName;
      }
      return null;
    }).filter(Boolean);

    // Remove duplicates and sort
    const uniqueCourses = [...new Set(courseList)].sort();

    // Add "Other" option at the end
    res.json({ courses: [...uniqueCourses, 'Other'] });
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Return fallback courses on error
    res.json({
      courses: ['BCA', 'BSc CS', 'BCom', 'BA', 'BTech', 'MTech', 'MCA', 'MBA', 'BBA', 'BSc Maths', 'Other']
    });
  }
};

// Create / update application (idempotent per user)
exports.apply = async (req, res) => {
  try {
    const userId = req.user.id;
    const { educationLevel, educationData: educationDataStr, skills } = req.body;

    if (!educationLevel || !['school', 'college', 'graduate', 'competitive_exam'].includes(educationLevel)) {
      return res.status(400).json({ message: 'Invalid education level' });
    }

    let educationData;
    try {
      educationData = typeof educationDataStr === 'string' ? JSON.parse(educationDataStr) : educationDataStr;
    } catch (e) {
      return res.status(400).json({ message: 'Invalid education data format' });
    }

    // Validate education data based on level
    if (educationLevel === 'school') {
      if (!educationData.class || !educationData.institution) {
        return res.status(400).json({ message: 'Class and institution are required for school' });
      }
    } else if (educationLevel === 'college' || educationLevel === 'graduate') {
      if (!Array.isArray(educationData.courses) || educationData.courses.length === 0) {
        return res.status(400).json({ message: 'At least one course is required' });
      }
    } else if (educationLevel === 'competitive_exam') {
      if (!educationData.isPursuingDegree || !educationData.examName) {
        return res.status(400).json({ message: 'Exam details are required' });
      }
    }

    let parsedSkills;
    try {
      parsedSkills = typeof skills === 'string' ? JSON.parse(skills) : skills;
    } catch (e) {
      return res.status(400).json({ message: 'Invalid skills format (expected JSON array)' });
    }
    if (!Array.isArray(parsedSkills) || parsedSkills.length === 0) {
      return res.status(400).json({ message: 'At least one skill is required' });
    }
    for (const s of parsedSkills) {
      if (!s.class || !s.subject || !s.topic) {
        return res.status(400).json({ message: 'Each skill requires class, subject and topic' });
      }
      // Allow 'ALL' as a valid topic to indicate all topics in the subject
    }

    // Files
    const marksheetFile = req.files?.marksheet?.[0];
    const videoFile = req.files?.video?.[0];

    if (!marksheetFile || !videoFile) {
      return res.status(400).json({ message: 'Marksheet PDF and video file are required' });
    }

    if (marksheetFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Marksheet must be a PDF' });
    }
    if (marksheetFile.size > 1024 * 1024) {
      return res.status(400).json({ message: 'Marksheet must be <= 1MB' });
    }

    // Upload to Supabase storage buckets
    const marksheetPath = `marksheets/${userId}-${Date.now()}-${marksheetFile.originalname}`;
    const videoExt = path.extname(videoFile.originalname) || '.mp4';
    const videoPath = `tutor-videos/${userId}-${Date.now()}${videoExt}`;

    const { error: mErr } = await supabase.storage
      .from('marksheets')
      .upload(marksheetPath, marksheetFile.buffer, {
        contentType: marksheetFile.mimetype,
        upsert: false,
      });
    if (mErr) {
      console.error('[Supabase] Marksheet upload error:', mErr);
      return res.status(500).json({ message: 'Failed to upload marksheet' });
    }

    const { error: vErr } = await supabase.storage
      .from('tutor-videos')
      .upload(videoPath, videoFile.buffer, {
        contentType: videoFile.mimetype,
        upsert: false,
      });
    if (vErr) {
      console.error('[Supabase] Video upload error:', vErr);
      return res.status(500).json({ message: 'Failed to upload video' });
    }

    const marksheetUrl = supabase.storage.from('marksheets').getPublicUrl(marksheetPath).data.publicUrl;
    const videoUrl = supabase.storage.from('tutor-videos').getPublicUrl(videoPath).data.publicUrl;

    let application = await TutorApplication.findOne({ user: userId });
    if (application) {
      application.skills = parsedSkills;
      application.applicationType = 'initial';
      application.educationLevel = educationLevel;
      application.educationData = educationData;
      application.marksheetUrl = marksheetUrl;
      application.videoUrl = videoUrl;
      application.status = 'pending';
      application.approvedAt = undefined;
      application.rejectionReason = undefined;
      // Bump submittedAt so re-registrations appear as latest pending applications
      application.submittedAt = new Date();
      await application.save();
    } else {
      application = await TutorApplication.create({
        user: userId,
        skills: parsedSkills,
        applicationType: 'initial',
        educationLevel,
        educationData,
        marksheetUrl,
        videoUrl,
      });
      await User.findByIdAndUpdate(userId, { tutorApplicationId: application._id });
    }

    // Track tutor application submission
    try {
      const { trackActivity, ACTIVITY_TYPES } = require('../utils/contributions');
      const io = req.app?.get('io');
      await trackActivity({
        userId,
        activityType: ACTIVITY_TYPES.TUTOR_APPLICATION_SUBMITTED,
        activityId: application._id.toString(),
        io
      });
    } catch (_) {}

    return res.status(201).json({ message: 'Application submitted', application });
  } catch (e) {
    console.error('[Tutor] Apply error:', e);
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

exports.status = async (req, res) => {
  try {
    const app = await TutorApplication.findOne({ user: req.user.id });
    if (!app) return res.status(404).json({ message: 'No application found' });

    const user = await User.findById(req.user.id);
    return res.status(200).json({ application: app, isTutor: !!(user && user.isTutor) });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Get verified tutor skills (skills from approved TutorApplication)
exports.getVerifiedSkills = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    // Check if user is a tutor
    if (!user || !user.isTutor) {
      return res.status(200).json({ skills: [], isTutor: false });
    }

    // Find the approved application
    const app = await TutorApplication.findOne({ user: userId, status: 'approved' });
    if (!app || !app.skills) {
      return res.status(200).json({ skills: [], isTutor: true });
    }

    // Return the approved skills
    return res.status(200).json({ 
      skills: app.skills, 
      isTutor: true,
      skillsToTeach: user.skillsToTeach || [] // Also include user's skillsToTeach for backward compatibility
    });
  } catch (e) {
    console.error('[Tutor] getVerifiedSkills error:', e);
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Prefill defaults for apply/tutor form using last verified/approved or latest pending application
exports.prefillApplyDefaults = async (req, res) => {
  try {
    const userId = req.user.id;
    // Prefer approved application; else fall back to most recent application
    let app = await TutorApplication.findOne({ user: userId, status: 'approved' });
    if (!app) {
      app = await TutorApplication.findOne({ user: userId });
    }
    if (!app) {
      return res.status(200).json({ educationLevel: '', institutionName: '', classOrYear: '' });
    }
    return res.status(200).json({
      educationLevel: app.educationLevel || '',
      institutionName: app.institutionName || '',
      classOrYear: app.classOrYear || '',
    });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Admin / employee list all applications
exports.list = async (req, res) => {
  try {
    // Include tutor activation fields (no countdown anymore, activation is immediate)
    const apps = await TutorApplication.find().populate(
      'user',
      'username email firstName lastName isTutor skillsToTeach profilePic',
    );

    // For employees, restrict visibility based on allowedClasses/allowedSubjects.
    if (req.employee) {
      const filtered = apps.filter((app) => isApplicationAllowedForEmployee(req.employee, app));
      return res.status(200).json(filtered);
    }

    // Admins see all applications
    return res.status(200).json(apps);
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Admin / employee approve
exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await TutorApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.status === 'approved') return res.status(400).json({ message: 'Already approved' });

    // Enforce employee tutor-scope permissions
    if (req.employee && !isApplicationAllowedForEmployee(req.employee, app)) {
      return res.status(403).json({ message: 'Not authorized to approve this tutor application' });
    }

    app.status = 'approved';
    app.approvedAt = new Date();
    if (req.employee) {
      app.approvedByEmployee = req.employee._id;
      app.approvedActionTimestamp = new Date();
      app.rejectedByEmployee = undefined;
      app.rejectedActionTimestamp = undefined;
    }
    await app.save();

    // Log employee approval
    if (req.employee) {
      await logEmployeeTutorAction({ employee: req.employee, application: app, status: 'approved' });
    }

    // Activate tutor features immediately upon approval
    const userDoc = await User.findById(app.user._id);
    if (!userDoc) {
      return res.status(404).json({ message: 'Linked user not found' });
    }
    // Merge application skills into user.skillsToTeach (avoid duplicates by subject+topic)
    const existing = userDoc.skillsToTeach || [];
    const incoming = app.skills || [];
    const mapKey = s => `${(s.class||'').toLowerCase()}::${(s.subject||'').toLowerCase()}::${(s.topic||'').toLowerCase()}`;
    const existingSet = new Set(existing.map(mapKey));
    const merged = [...existing];
    for (const s of incoming) {
      if (!existingSet.has(mapKey(s))) {
        merged.push({ class: s.class, subject: s.subject, topic: s.topic });
        existingSet.add(mapKey(s));
      }
    }
    userDoc.skillsToTeach = merged;
    userDoc.tutorActivationAt = undefined;
    userDoc.isTutor = true; // unlock immediately
    userDoc.tutorApplicationId = app._id;
    
    // Update role: if learner, change to teacher; if already teacher/both, keep as-is
    if (userDoc.role === 'learner') {
      userDoc.role = 'teacher';
    }
    
    await userDoc.save();

    return res.status(200).json({ message: 'Approved. Tutor functions unlocked immediately.', application: app });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Admin / employee reject
exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const app = await TutorApplication.findById(id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    // Enforce employee tutor-scope permissions
    if (req.employee && !isApplicationAllowedForEmployee(req.employee, app)) {
      return res.status(403).json({ message: 'Not authorized to reject this tutor application' });
    }

    app.status = 'rejected';
    app.rejectionReason = reason || 'Not specified';
    if (req.employee) {
      app.rejectedByEmployee = req.employee._id;
      app.rejectedActionTimestamp = new Date();
      app.approvedByEmployee = undefined;
      app.approvedActionTimestamp = undefined;
    }
    await app.save();

    // Log employee rejection
    if (req.employee) {
      await logEmployeeTutorAction({ employee: req.employee, application: app, status: 'rejected' });
    }

    await User.findByIdAndUpdate(app.user, { tutorActivationAt: undefined, isTutor: false });

    return res.status(200).json({ message: 'Rejected', application: app });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// User-initiated revert: clear any pending skills-update so a fresh edit can start
exports.revertPendingUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const app = await TutorApplication.findOne({ user: userId });
    if (!app) return res.status(404).json({ message: 'No application found' });
    if (app.status === 'pending' && app.applicationType === 'skills-update') {
      app.status = 'reverted';
      await app.save();
      return res.status(200).json({ message: 'Pending skills update reverted' });
    }
    return res.status(200).json({ message: 'No pending skills update to revert' });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Middleware no longer needed for timed activation; keep as no-op to avoid breaking imports
exports.ensureTutorActivation = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    // Immediate activation handled at approval time
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Guard for tutor-only endpoints
exports.requireActiveTutor = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });
    // Allow all roles except explicit 'learner'
    if (user.role && user.role.toLowerCase() === 'learner') {
      return res.status(403).json({ message: 'Tutor functions are not available for learners.' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Request a skills update (no files) — stores in TutorApplication as pending
exports.requestSkillsUpdate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillsToTeach } = req.body;

    if (!Array.isArray(skillsToTeach) || skillsToTeach.length === 0) {
      return res.status(400).json({ message: 'Provide at least one skill to update.' });
    }
    for (const s of skillsToTeach) {
      if (!s.class || !s.subject || !s.topic) {
        return res.status(400).json({ message: 'Each skill requires class, subject and topic' });
      }
    }

    let application = await TutorApplication.findOne({ user: userId });
    if (!application) {
      application = await TutorApplication.create({ user: userId, skills: skillsToTeach, applicationType: 'skills-update' });
    } else {
      // Preserve previously verified education/institution/class info by default
      application.skills = skillsToTeach;
      application.applicationType = 'skills-update';
    }

    // Handle optional new uploads (marksheet/pdf and video). If provided, replace URLs; else keep old.
    const marksheetFile = req.files?.marksheet?.[0];
    const videoFile = req.files?.video?.[0];

    if (marksheetFile) {
      if (marksheetFile.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Marksheet must be a PDF' });
      }
      if (marksheetFile.size > 1024 * 1024) {
        return res.status(400).json({ message: 'Marksheet must be <= 1MB' });
      }
      const marksheetPath = `marksheets/${userId}-${Date.now()}-${marksheetFile.originalname}`;
      const { error: mErr } = await supabase.storage
        .from('marksheets')
        .upload(marksheetPath, marksheetFile.buffer, {
          contentType: marksheetFile.mimetype,
          upsert: false,
        });
      if (mErr) {
        console.error('[Supabase] Marksheet upload error:', mErr);
        return res.status(500).json({ message: 'Failed to upload marksheet' });
      }
      const url = supabase.storage.from('marksheets').getPublicUrl(marksheetPath).data.publicUrl;
      application.marksheetUrl = application.marksheetUrl || url; // keep legacy field for compatibility
      application.marksheetUrls = Array.isArray(application.marksheetUrls) ? application.marksheetUrls : [];
      application.marksheetUrls.push(url);
    }

    if (videoFile) {
      const videoExt = path.extname(videoFile.originalname) || '.mp4';
      const videoPath = `tutor-videos/${userId}-${Date.now()}${videoExt}`;
      const { error: vErr } = await supabase.storage
        .from('tutor-videos')
        .upload(videoPath, videoFile.buffer, {
          contentType: videoFile.mimetype,
          upsert: false,
        });
      if (vErr) {
        console.error('[Supabase] Video upload error:', vErr);
        return res.status(500).json({ message: 'Failed to upload video' });
      }
      const url = supabase.storage.from('tutor-videos').getPublicUrl(videoPath).data.publicUrl;
      application.videoUrl = application.videoUrl || url; // keep legacy field for compatibility
      application.videoUrls = Array.isArray(application.videoUrls) ? application.videoUrls : [];
      application.videoUrls.push(url);
    }
    application.status = 'pending';
    application.approvedAt = undefined;
    application.rejectionReason = undefined;
    await application.save();

    await User.findByIdAndUpdate(userId, { tutorApplicationId: application._id });

    return res.status(200).json({ message: 'Skills update request submitted', application });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

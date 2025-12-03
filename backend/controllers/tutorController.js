const multer = require('multer');
const path = require('path');
const TutorApplication = require('../models/TutorApplication');
const User = require('../models/User');
const supabase = require('../utils/supabaseClient');

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

// Create / update application (idempotent per user)
exports.apply = async (req, res) => {
  try {
    const userId = req.user.id;
    const { educationLevel, institutionName, classOrYear, skills } = req.body;

    if (!educationLevel || !['school', 'college'].includes(educationLevel)) {
      return res.status(400).json({ message: 'Invalid education level' });
    }
    if (!institutionName || !classOrYear) {
      return res.status(400).json({ message: 'Institution and class/year are required' });
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
      application.educationLevel = educationLevel;
      application.institutionName = institutionName;
      application.classOrYear = classOrYear;
      application.marksheetUrl = marksheetUrl;
      application.videoUrl = videoUrl;
      application.status = 'pending';
      application.approvedAt = undefined;
      application.rejectionReason = undefined;
      await application.save();
    } else {
      application = await TutorApplication.create({
        user: userId,
        skills: parsedSkills,
        educationLevel,
        institutionName,
        classOrYear,
        marksheetUrl,
        videoUrl,
      });
      await User.findByIdAndUpdate(userId, { tutorApplicationId: application._id });
    }

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

    let activationRemainingMs = 0;
    const user = await User.findById(req.user.id);
    // Provide countdown BEFORE activation (isTutor false) and 0 after activation becomes true
    if (user && user.tutorActivationAt) {
      const diff = user.tutorActivationAt.getTime() - Date.now();
      if (!user.isTutor) {
        if (diff <= 0) {
          // Gracefully finalize activation if middleware not yet invoked
          user.isTutor = true;
          await user.save();
          activationRemainingMs = 0;
        } else {
          activationRemainingMs = diff; // positive remaining time
        }
      } else {
        activationRemainingMs = 0; // already active
      }
    }

    return res.status(200).json({ application: app, isTutor: !!(user && user.isTutor), activationRemainingMs });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Admin list all applications
exports.list = async (req, res) => {
  try {
    // Include tutor activation fields so admin can see countdown
    const apps = await TutorApplication.find().populate('user', 'username email firstName lastName tutorActivationAt isTutor');
    return res.status(200).json(apps);
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const { id } = req.params;
    const app = await TutorApplication.findById(id).populate('user');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (app.status === 'approved') return res.status(400).json({ message: 'Already approved' });

    app.status = 'approved';
    app.approvedAt = new Date();
    await app.save();

    // Set user activation 5 mins later
    const activationAt = new Date(Date.now() + 5 * 60 * 1000);
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
    userDoc.tutorActivationAt = activationAt;
    userDoc.isTutor = false; // remains locked until activation time
    userDoc.tutorApplicationId = app._id;
    await userDoc.save();

    return res.status(200).json({ message: 'Approved. Tutor functions unlock after 5 mins.', application: app });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const app = await TutorApplication.findById(id);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    app.status = 'rejected';
    app.rejectionReason = reason || 'Not specified';
    await app.save();

    await User.findByIdAndUpdate(app.user, { tutorActivationAt: undefined, isTutor: false });

    return res.status(200).json({ message: 'Rejected', application: app });
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Middleware to finalize activation if time passed
exports.ensureTutorActivation = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    if (user.tutorActivationAt && !user.isTutor && Date.now() >= user.tutorActivationAt.getTime()) {
      user.isTutor = true;
      await user.save();
    }

    next();
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

// Guard for tutor-only endpoints
exports.requireActiveTutor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isTutor) return res.status(403).json({ message: 'Tutor functions locked or not approved yet.' });
    next();
  } catch (e) {
    return res.status(500).json({ message: 'Server error', details: e.message });
  }
};

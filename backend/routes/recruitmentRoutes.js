const express = require('express');
const router = express.Router();
const RecruitmentApplication = require('../models/RecruitmentApplication');
const Employee = require('../models/Employee');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const supabase = require('../utils/supabaseClient');
const multer = require('multer');
const bcrypt = require('bcryptjs');

// Configure multer for file uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Supabase bucket for recruitment PDFs
const RECRUITMENT_PDF_BUCKET = process.env.SUPABASE_RECRUITMENT_PDFS_BUCKET || 'recruitment-pdfs';

// Submit recruitment application (authenticated users only)
router.post('/submit', requireAuth, upload.fields([
  { name: 'degreeCertificate', maxCount: 1 },
  { name: 'proofOfExperience', maxCount: 1 }
]), async (req, res) => {
  try {
    const { age, currentRole, institutionName, yearsOfExperience, selectedClasses, selectedSubjects, phone: phoneFromBody } = req.body;
    
    // Validation
    const phone = req.user.phone || phoneFromBody;

    if (!age || !currentRole || !institutionName || !yearsOfExperience || !selectedClasses || !selectedSubjects || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.files?.degreeCertificate || !req.files?.proofOfExperience) {
      return res.status(400).json({ message: 'Both degree certificate and proof of experience PDFs are required' });
    }

    // Check if user already has a pending application
    const existingApplication = await RecruitmentApplication.findOne({ 
      user: req.user.id, 
      status: 'pending' 
    });
    
    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending recruitment application' });
    }

    // Parse arrays if they come as JSON strings
    const classesArray = typeof selectedClasses === 'string' ? JSON.parse(selectedClasses) : selectedClasses;
    const subjectsArray = typeof selectedSubjects === 'string' ? JSON.parse(selectedSubjects) : selectedSubjects;

    // Upload PDFs to Supabase Storage
    const degreeCertBuffer = req.files.degreeCertificate[0].buffer;
    const proofBuffer = req.files.proofOfExperience[0].buffer;

    const timestamp = Date.now();
    const degreePath = `degrees/${req.user.id}-${timestamp}.pdf`;
    const proofPath = `proofs/${req.user.id}-${timestamp}.pdf`;

    const { error: degreeErr } = await supabase.storage
      .from(RECRUITMENT_PDF_BUCKET)
      .upload(degreePath, degreeCertBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });
    if (degreeErr) {
      console.error('Supabase upload error (degree certificate):', degreeErr.message);
      throw new Error('Failed to upload degree certificate PDF');
    }

    const { error: proofErr } = await supabase.storage
      .from(RECRUITMENT_PDF_BUCKET)
      .upload(proofPath, proofBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });
    if (proofErr) {
      console.error('Supabase upload error (proof of experience):', proofErr.message);
      throw new Error('Failed to upload proof of experience PDF');
    }

    const { data: degreePub } = supabase.storage
      .from(RECRUITMENT_PDF_BUCKET)
      .getPublicUrl(degreePath);
    const { data: proofPub } = supabase.storage
      .from(RECRUITMENT_PDF_BUCKET)
      .getPublicUrl(proofPath);

    // Create application
    const application = await RecruitmentApplication.create({
      user: req.user.id,
      name: req.user.firstName && req.user.lastName 
        ? `${req.user.firstName} ${req.user.lastName}`.trim() 
        : req.user.username,
      email: req.user.email,
      phone,
      age: parseInt(age),
      currentRole,
      institutionName,
      yearsOfExperience: parseFloat(yearsOfExperience),
      degreeCertificateUrl: degreePub.publicUrl,
      proofOfExperienceUrl: proofPub.publicUrl,
      selectedClasses: classesArray,
      selectedSubjects: subjectsArray,
      status: 'pending',
    });

    return res.status(201).json({ 
      message: 'Recruitment application submitted successfully',
      application 
    });
  } catch (error) {
    console.error('Recruitment application submission error:', error);
    return res.status(500).json({ 
      message: error.message || 'Failed to submit recruitment application' 
    });
  }
});

// Get user's own recruitment applications
router.get('/my-applications', requireAuth, async (req, res) => {
  try {
    const applications = await RecruitmentApplication.find({ user: req.user.id })
      .sort({ submittedAt: -1 })
      .lean();
    
    return res.json(applications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Admin: Get all recruitment applications
router.get('/admin/applications', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    
    const applications = await RecruitmentApplication.find(filter)
      .populate('user', 'username email firstName lastName profilePic')
      .populate('reviewedBy', 'username email')
      .populate('createdEmployee', 'employeeId name email')
      .sort({ submittedAt: -1 })
      .lean();
    
    return res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Admin: Approve application and create employee
router.post('/admin/applications/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    
    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required' });
    }

    const application = await RecruitmentApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application has already been reviewed' });
    }

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    // Create employee with tutor-only permissions
    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await Employee.create({
      name: application.name,
      employeeId,
      email: application.email,
      phone: application.phone,
      passwordHash,
      accessPermissions: 'tutor', // Tutor approvals only
      allowedClasses: application.selectedClasses,
      allowedSubjects: application.selectedSubjects,
      isDisabled: false,
      // Force employees created via recruitment to change password on first login
      mustChangePassword: true,
    });

    // Update application
    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    application.assignedEmployeeId = employeeId;
    application.createdEmployee = employee._id;
    await application.save();

    return res.json({ 
      message: 'Application approved and employee created successfully',
      application,
      employee 
    });
  } catch (error) {
    console.error('Error approving application:', error);
    return res.status(500).json({ 
      message: error.message || 'Failed to approve application' 
    });
  }
});

// Admin: Reject application
router.post('/admin/applications/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    
    if (!rejectionReason || !rejectionReason.trim()) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const application = await RecruitmentApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ message: 'Application has already been reviewed' });
    }

    application.status = 'rejected';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    application.rejectionReason = rejectionReason;
    await application.save();

    return res.json({ 
      message: 'Application rejected successfully',
      application 
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    return res.status(500).json({ message: 'Failed to reject application' });
  }
});

module.exports = router;

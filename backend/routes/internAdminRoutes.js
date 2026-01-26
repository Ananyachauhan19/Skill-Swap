const express = require('express');
const bcrypt = require('bcryptjs');
const InternEmployee = require('../models/InternEmployee');
const InternEmployeeActivity = require('../models/InternEmployeeActivity');
const Intern = require('../models/Intern');
const CertificateTemplate = require('../models/CertificateTemplate');
const { generatePDF } = require('../services/pdfService');
const { generateQRCodeDataURL } = require('../services/qrService');
const { sendTemplatedEmail, replaceTemplateVariables, sendTemplateByKey } = require('../services/emailService');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Admin: Create intern coordinator
router.post('/admin/intern-employees', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email already exists
    const existing = await InternEmployee.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create intern coordinator
    const internEmployee = await InternEmployee.create({
      name,
      email: email.toLowerCase(),
      role,
      passwordHash,
    });

    let emailSent = false;

    // Send credentials via email using DB-managed template
    try {
      // Prefer configured FRONTEND_URL, otherwise default to local dev URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      await sendTemplateByKey({
        to: email,
        templateKey: 'intern_coordinator_welcome',
        variables: {
          name,
          email,
          password,
          role,
          loginUrl: `${frontendUrl}/login`,
        },
      });
      emailSent = true;
    } catch (emailError) {
      // Do not block coordinator creation if email template is missing or send fails
      console.error('Failed to send intern coordinator credentials email:', emailError.message || emailError);
    }

    res.status(201).json({
      message: 'Intern coordinator created successfully',
      internEmployee: {
        _id: internEmployee._id,
        name: internEmployee.name,
        email: internEmployee.email,
        role: internEmployee.role,
      },
      emailSent,
    });
  } catch (error) {
    console.error('Create intern coordinator error:', error);
    res.status(500).json({ message: 'Failed to create intern coordinator' });
  }
});

// Admin: Get all intern coordinators
router.get('/admin/intern-employees', requireAuth, requireAdmin, async (req, res) => {
  try {
    const employees = await InternEmployee.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Get intern coordinators error:', error);
    res.status(500).json({ message: 'Failed to fetch intern coordinators' });
  }
});

// Admin: Delete intern coordinator
router.delete('/admin/intern-employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const employee = await InternEmployee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Intern coordinator not found' });
    }
    res.json({ message: 'Intern coordinator deleted successfully' });
  } catch (error) {
    console.error('Delete intern coordinator error:', error);
    res.status(500).json({ message: 'Failed to delete intern coordinator' });
  }
});

// Admin: Get certificate templates
router.get('/admin/certificate-templates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { type, search, isActive } = req.query;
    
    let query = {};
    if (type && type !== 'all') query.type = type;
    if (isActive !== undefined && isActive !== '') query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } }
      ];
    }
    
    const templates = await CertificateTemplate.find(query).sort({ createdAt: -1 });
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Get certificate templates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch certificate templates' });
  }
});

// Admin: Create certificate template
router.post('/admin/certificate-templates', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { type, name, htmlContent, isActive } = req.body;

    if (!type || !name || !htmlContent) {
      return res.status(400).json({ success: false, message: 'Type, name, and HTML content are required' });
    }

    const template = await CertificateTemplate.create({
      type,
      name,
      htmlContent,
      isActive: isActive || false,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, template });
  } catch (error) {
    console.error('Create certificate template error:', error);
    res.status(500).json({ success: false, message: 'Failed to create certificate template' });
  }
});

// Admin: Update certificate template
router.put('/admin/certificate-templates/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, htmlContent, isActive } = req.body;

    const template = await CertificateTemplate.findByIdAndUpdate(
      req.params.id,
      { name, htmlContent, isActive },
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error('Update certificate template error:', error);
    res.status(500).json({ success: false, message: 'Failed to update certificate template' });
  }
});

// Admin: Delete certificate template
router.delete('/admin/certificate-templates/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const template = await CertificateTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.json({ success: true, message: 'Certificate template deleted successfully' });
  } catch (error) {
    console.error('Delete certificate template error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete certificate template' });
  }
});

// Admin: Get all interns
router.get('/admin/interns', requireAuth, requireAdmin, async (req, res) => {
  try {
    const interns = await Intern.find()
      .populate('employeeOwnerId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(interns);
  } catch (error) {
    console.error('Get interns error:', error);
    res.status(500).json({ message: 'Failed to fetch interns' });
  }
});

// Admin: Get intern coordinator details with activity logs
router.get('/admin/intern-employees/:id/details', requireAuth, requireAdmin, async (req, res) => {
  try {
    const employee = await InternEmployee.findById(req.params.id).select('-passwordHash');
    if (!employee) {
      return res.status(404).json({ message: 'Intern coordinator not found' });
    }

    const activities = await InternEmployeeActivity.find({
      internEmployeeId: req.params.id,
    })
      .sort({ timestamp: -1 })
      .limit(50);

    const totalInterns = await Intern.countDocuments({
      employeeOwnerId: req.params.id,
    });

    const activeInterns = await Intern.countDocuments({
      employeeOwnerId: req.params.id,
      status: 'active',
    });

    const completedInterns = await Intern.countDocuments({
      employeeOwnerId: req.params.id,
      status: 'completed',
    });

    res.json({
      employee,
      activities,
      kpi: {
        totalInterns,
        activeInterns,
        completedInterns,
      },
    });
  } catch (error) {
    console.error('Get intern coordinator details error:', error);
    res.status(500).json({ message: 'Failed to fetch intern coordinator details' });
  }
});

// Admin: Update intern coordinator
router.put('/admin/intern-employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;

    const employee = await InternEmployee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Intern coordinator not found' });
    }

    if (name) employee.name = name;
    if (email) employee.email = email.toLowerCase();
    if (role) employee.role = role;
    if (typeof isActive === 'boolean') employee.isActive = isActive;

    await employee.save();

    res.json({
      message: 'Intern coordinator updated successfully',
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        isActive: employee.isActive,
      },
    });
  } catch (error) {
    console.error('Update intern coordinator error:', error);
    res.status(500).json({ message: 'Failed to update intern coordinator' });
  }
});

// Admin: Reset intern coordinator password
router.post('/admin/intern-employees/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const employee = await InternEmployee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Intern coordinator not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    employee.passwordHash = passwordHash;
    employee.mustChangePassword = true;
    await employee.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;

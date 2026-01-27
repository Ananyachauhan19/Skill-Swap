const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const InternEmployee = require('../models/InternEmployee');
const Intern = require('../models/Intern');
const InternEmployeeActivity = require('../models/InternEmployeeActivity');
const CertificateTemplate = require('../models/CertificateTemplate');
const { generatePDF } = require('../services/pdfService');
const { generateQRCodeDataURL } = require('../services/qrService');
const { sendTemplatedEmail, replaceTemplateVariables } = require('../services/emailService');

const router = express.Router();

// Middleware to verify intern coordinator JWT
const requireInternEmployee = async (req, res, next) => {
  try {
    const token = req.cookies?.internEmployeeToken;
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await InternEmployee.findById(decoded.employeeId);
    
    if (!employee || !employee.isActive) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.internEmployee = employee;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Intern Coordinator Login
router.post('/intern-coordinator/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const employee = await InternEmployee.findOne({ email: email.toLowerCase() });
    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!employee.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Update last login
    employee.lastLoginAt = new Date();
    await employee.save();

    // Generate JWT
    const token = jwt.sign(
      { employeeId: employee._id, role: employee.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('internEmployeeToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      mustChangePassword: employee.mustChangePassword,
      employee: {
        _id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        mustChangePassword: employee.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Intern coordinator login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Logout
router.post('/intern-coordinator/logout', (req, res) => {
  res.clearCookie('internEmployeeToken');
  res.json({ message: 'Logout successful' });
});

// Get current coordinator
router.get('/intern-coordinator/me', requireInternEmployee, async (req, res) => {
  res.json({
    _id: req.internEmployee._id,
    name: req.internEmployee.name,
    email: req.internEmployee.email,
    role: req.internEmployee.role,
    mustChangePassword: req.internEmployee.mustChangePassword,
  });
});

// Change password (for first login or password reset)
router.post('/intern-coordinator/change-password', requireInternEmployee, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const employee = await InternEmployee.findById(req.internEmployee._id);
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, employee.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Update password and clear mustChangePassword flag
    employee.passwordHash = newPasswordHash;
    employee.mustChangePassword = false;
    await employee.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Generate unique intern employee ID
function generateInternEmployeeId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `SSH-${randomNum}`;
}

// Coordinator: Create intern with position, duration, joining date
router.post('/intern-coordinator/interns', requireInternEmployee, async (req, res) => {
  try {
    const { name, email, role, position, joiningDate, internshipDuration } = req.body;

    if (!name || !email || !position || !joiningDate || !internshipDuration) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Generate unique intern employee ID
    let internEmployeeId;
    let isUnique = false;
    while (!isUnique) {
      internEmployeeId = generateInternEmployeeId();
      const existing = await Intern.findOne({ internEmployeeId });
      if (!existing) isUnique = true;
    }

    // Create intern
    const intern = await Intern.create({
      name,
      email: email.toLowerCase(),
      role,
      position,
      joiningDate: new Date(joiningDate),
      internshipDuration: Number(internshipDuration),
      internEmployeeId,
      employeeOwnerId: req.internEmployee._id,
      status: 'active',
    });

    // Fetch joining letter template
    const template = await CertificateTemplate.findOne({
      type: 'joining_letter',
      isActive: true,
    });

    if (!template) {
      console.warn('No active joining letter template found');
      // Continue without template instead of failing
    }

    let pdfFilename;
    let pdfPath;
    
    if (template) {
      try {
        // Generate QR code
        const qrURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/joiningcertificate/${internEmployeeId}`;
        const qrDataURL = await generateQRCodeDataURL(qrURL);

        // Replace variables in template
        const variables = {
          name: intern.name,
          role: intern.role,
          joiningDate: new Date(intern.joiningDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          duration: `${intern.internshipDuration} days`,
          internEmployeeId: intern.internEmployeeId,
          qrCode: qrDataURL,
        };

        const htmlContent = replaceTemplateVariables(template.htmlContent, variables);

        // Generate PDF
        pdfFilename = `joining_${internEmployeeId}_${Date.now()}.pdf`;
        pdfPath = await generatePDF(htmlContent, pdfFilename);

        // Update intern with certificate path
        intern.joiningCertificatePath = `/certificates/${pdfFilename}`;
        await intern.save();

        // Send joining email
        try {
          await sendTemplatedEmail({
            to: intern.email,
            templateType: 'intern_joining',
            variables: {
              ...variables,
              certificateLink: qrURL,
            },
            attachments: [
              {
                filename: 'Joining_Letter.pdf',
                path: pdfPath,
              },
            ],
          });
        } catch (emailError) {
          console.error('Failed to send joining email:', emailError);
          // Continue even if email fails
        }
      } catch (certError) {
        console.error('Failed to generate certificate/send email:', certError);
        // Continue even if certificate generation fails
      }
    }

    // Log activity
    await InternEmployeeActivity.create({
      internEmployeeId: req.internEmployee._id,
      activityType: 'intern_added',
      internId: intern._id,
      internName: intern.name,
      internEmployeeCode: intern.internEmployeeId,
      details: {
        role: intern.role,
        email: intern.email,
      },
    });

    res.status(201).json({
      message: 'Intern created successfully',
      intern,
    });
  } catch (error) {
    console.error('Create intern error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    res.status(500).json({ message: 'Failed to create intern', error: error.message });
  }
});

// Get all interns for logged-in coordinator
router.get('/intern-coordinator/interns', requireInternEmployee, async (req, res) => {
  try {
    const interns = await Intern.find({ employeeOwnerId: req.internEmployee._id })
      .sort({ createdAt: -1 });
    res.json(interns);
  } catch (error) {
    console.error('Get interns error:', error);
    res.status(500).json({ message: 'Failed to fetch interns' });
  }
});

// Get single intern
router.get('/intern-employee/interns/:id', requireInternEmployee, async (req, res) => {
  try {
    const intern = await Intern.findOne({
      _id: req.params.id,
      employeeOwnerId: req.internEmployee._id,
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    res.json(intern);
  } catch (error) {
    console.error('Get intern error:', error);
    res.status(500).json({ message: 'Failed to fetch intern' });
  }
});

// Update intern
router.put('/intern-coordinator/interns/:id', requireInternEmployee, async (req, res) => {
  try {
    const { name, email, role, position, joiningDate, internshipDuration } = req.body;

    const intern = await Intern.findOne({
      _id: req.params.id,
      employeeOwnerId: req.internEmployee._id,
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    // Track what fields were actually changed
    const updatedFields = [];
    const oldValues = {};
    const newValues = {};

    if (name && name !== intern.name) {
      updatedFields.push('name');
      oldValues.name = intern.name;
      newValues.name = name;
      intern.name = name;
    }
    
    if (email && email.toLowerCase() !== intern.email) {
      updatedFields.push('email');
      oldValues.email = intern.email;
      newValues.email = email.toLowerCase();
      intern.email = email.toLowerCase();
    }
    
    // Update both position and role fields
    const newPosition = position || role;
    if (newPosition && newPosition !== intern.position) {
      updatedFields.push('position');
      oldValues.position = intern.position;
      newValues.position = newPosition;
      intern.position = newPosition;
      intern.role = newPosition; // Keep role in sync
    }
    
    if (joiningDate) {
      const newDate = new Date(joiningDate).toISOString().split('T')[0];
      const oldDate = new Date(intern.joiningDate).toISOString().split('T')[0];
      if (newDate !== oldDate) {
        updatedFields.push('joiningDate');
        oldValues.joiningDate = oldDate;
        newValues.joiningDate = newDate;
        intern.joiningDate = joiningDate;
      }
    }
    
    if (internshipDuration && Number(internshipDuration) !== intern.internshipDuration) {
      updatedFields.push('internshipDuration');
      oldValues.internshipDuration = intern.internshipDuration;
      newValues.internshipDuration = Number(internshipDuration);
      intern.internshipDuration = Number(internshipDuration);
    }

    await intern.save();

    // Regenerate certificates if certificate-related fields were updated
    const certificateFields = ['name', 'position', 'joiningDate', 'internshipDuration'];
    const shouldRegenerateCertificates = updatedFields.some(field => certificateFields.includes(field));

    if (shouldRegenerateCertificates) {
      try {
        // Regenerate Joining Letter
        const joiningTemplate = await CertificateTemplate.findOne({
          type: 'joining_letter',
          isActive: true,
        });

        if (joiningTemplate) {
          const qrURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/joiningcertificate/${intern.internEmployeeId}`;
          const qrDataURL = await generateQRCodeDataURL(qrURL);

          const joiningVariables = {
            name: intern.name,
            role: intern.position || intern.role,
            joiningDate: new Date(intern.joiningDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            duration: `${intern.internshipDuration} days`,
            internEmployeeId: intern.internEmployeeId,
            qrCode: qrDataURL,
          };

          const joiningHtml = replaceTemplateVariables(joiningTemplate.htmlContent, joiningVariables);
          const joiningPdfFilename = `joining_${intern.internEmployeeId}_${Date.now()}.pdf`;
          await generatePDF(joiningHtml, joiningPdfFilename);
          intern.joiningCertificatePath = `/certificates/${joiningPdfFilename}`;
        }

        // Regenerate Completion Certificate if intern is completed
        if (intern.status === 'completed' && intern.completionCertificatePath) {
          const completionTemplate = await CertificateTemplate.findOne({
            type: 'completion_certificate',
            isActive: true,
          });

          if (completionTemplate) {
            const completionQrURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/completioncertificate/${intern.internEmployeeId}`;
            const completionQrDataURL = await generateQRCodeDataURL(completionQrURL);

            const completionVariables = {
              name: intern.name,
              role: intern.position || intern.role,
              joiningDate: new Date(intern.joiningDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              completionDate: new Date(intern.completionDate || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              duration: `${intern.internshipDuration} days`,
              internEmployeeId: intern.internEmployeeId,
              qrCode: completionQrDataURL,
            };

            const completionHtml = replaceTemplateVariables(completionTemplate.htmlContent, completionVariables);
            const completionPdfFilename = `completion_${intern.internEmployeeId}_${Date.now()}.pdf`;
            await generatePDF(completionHtml, completionPdfFilename);
            intern.completionCertificatePath = `/certificates/${completionPdfFilename}`;
          }
        }

        await intern.save();
      } catch (certError) {
        console.error('Failed to regenerate certificates:', certError);
        // Continue even if certificate regeneration fails
      }
    }

    // Log activity with only changed fields
    await InternEmployeeActivity.create({
      internEmployeeId: req.internEmployee._id,
      activityType: 'intern_edited',
      internId: intern._id,
      internName: intern.name,
      internEmployeeCode: intern.internEmployeeId,
      details: {
        updated: updatedFields.join(', '),
        changes: updatedFields.map(field => ({
          field,
          oldValue: oldValues[field],
          newValue: newValues[field],
        })),
        certificatesRegenerated: shouldRegenerateCertificates,
      },
    });

    res.json({
      message: 'Intern updated successfully',
      intern,
      certificatesRegenerated: shouldRegenerateCertificates,
    });
  } catch (error) {
    console.error('Update intern error:', error);
    res.status(500).json({ message: 'Failed to update intern' });
  }
});

// Delete intern
router.delete('/intern-coordinator/interns/:id', requireInternEmployee, async (req, res) => {
  try {
    const intern = await Intern.findOne({
      _id: req.params.id,
      employeeOwnerId: req.internEmployee._id,
    });

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    const internName = intern.name;
    const internCode = intern.internEmployeeId;

    await Intern.deleteOne({ _id: req.params.id });

    // Log activity
    await InternEmployeeActivity.create({
      internEmployeeId: req.internEmployee._id,
      activityType: 'intern_deleted',
      internName,
      internEmployeeCode: internCode,
    });

    res.json({ message: 'Intern deleted successfully' });
  } catch (error) {
    console.error('Delete intern error:', error);
    res.status(500).json({ message: 'Failed to delete intern' });
  }
});

// Get activity logs for logged-in coordinator
router.get('/intern-coordinator/activity-logs', requireInternEmployee, async (req, res) => {
  try {
    const activities = await InternEmployeeActivity.find({
      internEmployeeId: req.internEmployee._id,
    })
      .sort({ timestamp: -1 })
      .limit(50);

    const totalInterns = await Intern.countDocuments({
      employeeOwnerId: req.internEmployee._id,
    });

    const activeInterns = await Intern.countDocuments({
      employeeOwnerId: req.internEmployee._id,
      status: 'active',
    });

    const completedInterns = await Intern.countDocuments({
      employeeOwnerId: req.internEmployee._id,
      status: 'completed',
    });

    res.json({
      activities,
      kpi: {
        totalInterns,
        activeInterns,
        completedInterns,
      },
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

module.exports = router;

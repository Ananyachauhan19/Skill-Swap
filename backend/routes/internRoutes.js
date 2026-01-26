const express = require('express');
const Intern = require('../models/Intern');
const CertificateTemplate = require('../models/CertificateTemplate');
const { generateQRCodeDataURL } = require('../services/qrService');
const { replaceTemplateVariables } = require('../services/emailService');

const router = express.Router();

// Public: Verify joining certificate by QR
router.get('/public/joiningcertificate/:internEmployeeId', async (req, res) => {
  try {
    const intern = await Intern.findOne({ 
      internEmployeeId: req.params.internEmployeeId 
    }).populate('employeeOwnerId', 'name role');

    if (!intern) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Fetch the joining letter template
    const template = await CertificateTemplate.findOne({
      type: 'joining_letter',
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({ message: 'Certificate template not found' });
    }

    // Generate QR code
    const qrURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/joiningcertificate/${intern.internEmployeeId}`;
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

    res.json({
      valid: true,
      htmlContent,
      intern: {
        name: intern.name,
        role: intern.role,
        joiningDate: intern.joiningDate,
        internshipDuration: intern.internshipDuration,
        internEmployeeId: intern.internEmployeeId,
        status: intern.status,
      },
    });
  } catch (error) {
    console.error('Verify joining certificate error:', error);
    res.status(500).json({ message: 'Failed to verify certificate' });
  }
});

// Public: Verify completion certificate by QR
router.get('/public/completioncertificate/:internEmployeeId', async (req, res) => {
  try {
    const intern = await Intern.findOne({ 
      internEmployeeId: req.params.internEmployeeId,
      status: 'completed',
    }).populate('employeeOwnerId', 'name role');

    if (!intern) {
      return res.status(404).json({ message: 'Certificate not found or internship not completed' });
    }

    // Fetch the completion certificate template
    const template = await CertificateTemplate.findOne({
      type: 'completion_certificate',
      isActive: true,
    });

    if (!template) {
      return res.status(404).json({ message: 'Certificate template not found' });
    }

    // Generate QR code
    const qrURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/completioncertificate/${intern.internEmployeeId}`;
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
      completionDate: new Date(intern.completionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      duration: `${intern.internshipDuration} days`,
      internEmployeeId: intern.internEmployeeId,
      qrCode: qrDataURL,
    };

    const htmlContent = replaceTemplateVariables(template.htmlContent, variables);

    res.json({
      valid: true,
      htmlContent,
      intern: {
        name: intern.name,
        role: intern.role,
        joiningDate: intern.joiningDate,
        completionDate: intern.completionDate,
        internshipDuration: intern.internshipDuration,
        internEmployeeId: intern.internEmployeeId,
      },
    });
  } catch (error) {
    console.error('Verify completion certificate error:', error);
    res.status(500).json({ message: 'Failed to verify certificate' });
  }
});

// Public: Download joining certificate PDF
router.get('/public/joiningcertificate/:internEmployeeId/download', async (req, res) => {
  try {
    const intern = await Intern.findOne({ 
      internEmployeeId: req.params.internEmployeeId 
    });

    if (!intern || !intern.joiningCertificatePath) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '../public', intern.joiningCertificatePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Certificate file not found' });
    }

    res.download(filePath, `Joining_Letter_${intern.internEmployeeId}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to download certificate' });
        }
      }
    });
  } catch (error) {
    console.error('Download joining certificate error:', error);
    res.status(500).json({ message: 'Failed to download certificate' });
  }
});

// Public: Download completion certificate PDF
router.get('/public/completioncertificate/:internEmployeeId/download', async (req, res) => {
  try {
    const intern = await Intern.findOne({ 
      internEmployeeId: req.params.internEmployeeId,
      status: 'completed',
    });

    if (!intern || !intern.completionCertificatePath) {
      return res.status(404).json({ message: 'Certificate not found or internship not completed' });
    }

    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '../public', intern.completionCertificatePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Certificate file not found' });
    }

    res.download(filePath, `Completion_Certificate_${intern.internEmployeeId}.pdf`, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Failed to download certificate' });
        }
      }
    });
  } catch (error) {
    console.error('Download completion certificate error:', error);
    res.status(500).json({ message: 'Failed to download certificate' });
  }
});

// Intern login
router.post('/intern/login', async (req, res) => {
  try {
    const { email, internEmployeeId } = req.body;

    if (!email || !internEmployeeId) {
      return res.status(400).json({ message: 'Email and intern ID are required' });
    }

    const intern = await Intern.findOne({
      email: email.toLowerCase(),
      internEmployeeId: internEmployeeId.toUpperCase(),
    });

    if (!intern) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // For simplicity, we'll use a simple session (in production, use proper JWT)
    res.json({
      message: 'Login successful',
      intern: {
        _id: intern._id,
        name: intern.name,
        email: intern.email,
        role: intern.role,
        internEmployeeId: intern.internEmployeeId,
        status: intern.status,
      },
    });
  } catch (error) {
    console.error('Intern login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Get intern dashboard data
router.get('/intern/:internEmployeeId', async (req, res) => {
  try {
    const intern = await Intern.findOne({ 
      internEmployeeId: req.params.internEmployeeId.toUpperCase() 
    }).populate('employeeOwnerId', 'name role');

    if (!intern) {
      return res.status(404).json({ message: 'Intern not found' });
    }

    res.json(intern);
  } catch (error) {
    console.error('Get intern data error:', error);
    res.status(500).json({ message: 'Failed to fetch intern data' });
  }
});

module.exports = router;

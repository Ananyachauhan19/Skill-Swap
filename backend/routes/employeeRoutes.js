const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { requireEmployee } = require('../middleware/requireEmployee');
const { sendOtpEmail } = require('../utils/sendMail');
const fetch = require('node-fetch');
const csv = require('csvtojson');

const router = express.Router();

// Helper to sign employee JWT
const signEmployeeToken = (employee) => {
  const payload = {
    employeeId: employee._id.toString(),
    accessPermissions: employee.accessPermissions,
  };
  const secret = process.env.EMPLOYEE_JWT_SECRET || process.env.JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};

// Admin-only: create employee
router.post('/admin/employees', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      employeeId,
      email,
      password,
      accessPermissions,
      allowedClasses,
      allowedSubjects,
    } = req.body;

    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await Employee.create({
      name,
      employeeId,
      email,
      passwordHash,
      accessPermissions,
      allowedClasses: Array.isArray(allowedClasses) ? allowedClasses : [],
      allowedSubjects: Array.isArray(allowedSubjects) ? allowedSubjects : [],
      // Password given by admin is treated as permanent
      mustChangePassword: false,
    });

    return res.status(201).json(employee);
  } catch (err) {
    console.error('Create employee error:', err);
    return res.status(500).json({ message: 'Failed to create employee' });
  }
});

// Admin-only: list employees
router.get('/admin/employees', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 }).lean();
    return res.json(employees);
  } catch (err) {
    console.error('List employees error:', err);
    return res.status(500).json({ message: 'Failed to fetch employees' });
  }
});

// Admin-only: update/disable employee
router.put('/admin/employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, accessPermissions, isDisabled, allowedClasses, allowedSubjects } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (accessPermissions !== undefined) update.accessPermissions = accessPermissions;
    if (isDisabled !== undefined) update.isDisabled = isDisabled;
    if (allowedClasses !== undefined) {
      update.allowedClasses = Array.isArray(allowedClasses) ? allowedClasses : [];
    }
    if (allowedSubjects !== undefined) {
      update.allowedSubjects = Array.isArray(allowedSubjects) ? allowedSubjects : [];
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    return res.json(employee);
  } catch (err) {
    console.error('Update employee error:', err);
    return res.status(500).json({ message: 'Failed to update employee' });
  }
});

// Admin-only: reset employee password
router.post('/admin/employees/:id/reset-password', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password required' });
    const hash = await bcrypt.hash(password, 10);
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      {
        passwordHash: hash,
        // Do not force password change; admin-set password is permanent
        mustChangePassword: false,
      },
      { new: true },
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    return res.json({ message: 'Password reset', employeeId: employee._id });
  } catch (err) {
    console.error('Reset employee password error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Admin-only: delete employee
router.delete('/admin/employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return res.status(500).json({ message: 'Failed to delete employee' });
  }
});

// Admin-only: get tutor-approval class/subject options from Google Sheet CSV
router.get('/admin/tutor/approval-options', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const SHEET_URL = process.env.GOOGLE_SHEET_CSV_URL;
    if (!SHEET_URL) {
      return res.status(400).json({ message: 'GOOGLE_SHEET_CSV_URL not configured in .env' });
    }

    const resp = await fetch(SHEET_URL);
    if (!resp.ok) throw new Error('Failed to fetch CSV');
    const text = await resp.text();

    const rows = await csv({ trim: true }).fromString(text);

    const classSet = new Set();
    const subjectSet = new Set();

    rows.forEach((r) => {
      const classOrCourse = (r['Class/Course'] || r.course || r.Course || '').trim();
      const subject = (r['Subject'] || r.subject || r.unit || r.Unit || '').trim();

      if (classOrCourse) classSet.add(classOrCourse);
      if (subject) subjectSet.add(subject);
    });

    const classes = Array.from(classSet).sort((a, b) => a.localeCompare(b));
    const subjects = Array.from(subjectSet).sort((a, b) => a.localeCompare(b));

    return res.json({ classes, subjects });
  } catch (err) {
    console.error('Failed to load tutor approval options from sheet:', err.message);
    return res.status(500).json({ message: 'Failed to load tutor approval options' });
  }
});

// Employee login (by employeeId or email)
router.post('/employee/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = employeeId or email
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { employeeId: identifier };
    const employee = await Employee.findOne(query);
    if (!employee || employee.isDisabled) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, employee.passwordHash || '');
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate OTP for employee login
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    employee.otp = otp;
    employee.otpExpires = otpExpires;
    await employee.save();

    await sendOtpEmail(employee.email, otp);

    return res.json({ message: 'OTP sent to email', otpSent: true });
  } catch (err) {
    console.error('Employee login error:', err);
    return res.status(500).json({ message: 'Failed to login' });
  }
});

// Employee OTP verification
router.post('/employee/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const employee = await Employee.findOne({ email: email.toLowerCase() });
    if (!employee || !employee.otp || !employee.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const isMatch = String(employee.otp) === String(otp);
    const isExpired = Date.now() > employee.otpExpires;
    if (!isMatch || isExpired) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP and update last login
    employee.otp = undefined;
    employee.otpExpires = undefined;
    employee.lastLoginAt = new Date();
    await employee.save();

    const token = signEmployeeToken(employee);

    res.cookie('employeeToken', token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({
      message: 'Login successful',
      employee: {
        id: employee._id,
        name: employee.name,
        employeeId: employee.employeeId,
        email: employee.email,
        accessPermissions: employee.accessPermissions,
        allowedClasses: employee.allowedClasses || [],
        allowedSubjects: employee.allowedSubjects || [],
      },
    });
  } catch (err) {
    console.error('Employee verify OTP error:', err);
    return res.status(500).json({ message: 'Failed to verify OTP' });
  }
});

// Get current employee profile
router.get('/employee/me', requireEmployee, (req, res) => {
  const e = req.employee;
  return res.json({
    id: e._id,
    name: e.name,
    employeeId: e.employeeId,
    email: e.email,
    accessPermissions: e.accessPermissions,
    allowedClasses: e.allowedClasses || [],
    allowedSubjects: e.allowedSubjects || [],
    mustChangePassword: e.mustChangePassword,
  });
});
 
module.exports = router;

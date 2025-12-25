const express = require('express');
const router = express.Router();
const ApprovedInterviewer = require('../models/ApprovedInterviewer');
const Employee = require('../models/Employee');
const requireAuth = require('../middleware/requireAuth');

// Check if user is an approved interviewer
router.get('/interview/check-interviewer', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      console.log('[check-interviewer] No authenticated user');
      return res.json({ isApprovedInterviewer: false });
    }

    console.log('[check-interviewer] Checking for user:', req.user._id, req.user.email);
    
    // Check in ApprovedInterviewer collection
    const interviewer = await ApprovedInterviewer.findOne({ user: req.user._id });
    
    console.log('[check-interviewer] Found interviewer record:', interviewer ? 'YES' : 'NO');
    if (interviewer) {
      console.log('[check-interviewer] Interviewer details:', {
        id: interviewer._id,
        userId: interviewer.user,
        createdAt: interviewer.createdAt
      });
    }
    
    const isApproved = !!interviewer;
    
    res.json({ 
      isApprovedInterviewer: isApproved,
      isInterviewer: isApproved,
      approved: isApproved,
      interviewerId: interviewer?._id 
    });
  } catch (error) {
    console.error('[check-interviewer] Error:', error);
    res.status(500).json({ 
      error: 'Failed to check interviewer status',
      isApprovedInterviewer: false 
    });
  }
});

// Check if user is a tutor verifier (employee)
router.get('/employee/check-verifier', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      console.log('[check-verifier] No authenticated user');
      return res.json({ isTutorVerifier: false });
    }

    console.log('[check-verifier] Checking for user:', req.user._id, req.user.email);
    
    // Check if user is an employee with tutor verification permissions
    const employee = await Employee.findOne({ 
      email: req.user.email,
      isDisabled: false,
      $or: [
        { accessPermissions: 'tutor' },
        { accessPermissions: 'both' }
      ]
    });
    
    console.log('[check-verifier] Found employee record:', employee ? 'YES' : 'NO');
    if (employee) {
      console.log('[check-verifier] Employee details:', {
        id: employee._id,
        email: employee.email,
        accessPermissions: employee.accessPermissions,
        isDisabled: employee.isDisabled
      });
    }
    
    const isVerifier = !!employee;
    
    res.json({ 
      isTutorVerifier: isVerifier,
      isEmployee: isVerifier,
      hasAccess: isVerifier,
      canVerifyTutors: isVerifier,
      employeeId: employee?._id 
    });
  } catch (error) {
    console.error('[check-verifier] Error:', error);
    res.status(500).json({ 
      error: 'Failed to check verifier status',
      isTutorVerifier: false 
    });
  }
});

module.exports = router;

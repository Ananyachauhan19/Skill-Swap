const express = require('express');
const router = express.Router();
const ApprovedInterviewer = require('../models/ApprovedInterviewer');
const Employee = require('../models/Employee');

// Check if user is an approved interviewer
router.get('/interview/check-interviewer', async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ isApprovedInterviewer: false });
    }

    const interviewer = await ApprovedInterviewer.findOne({ user: req.user._id });
    
    res.json({ 
      isApprovedInterviewer: !!interviewer,
      interviewerId: interviewer?._id 
    });
  } catch (error) {
    console.error('Error checking interviewer status:', error);
    res.status(500).json({ 
      error: 'Failed to check interviewer status',
      isApprovedInterviewer: false 
    });
  }
});

// Check if user is a tutor verifier (employee)
router.get('/employee/check-verifier', async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ isTutorVerifier: false });
    }

    // Check if user is an employee with tutor verification permissions
    const employee = await Employee.findOne({ 
      email: req.user.email,
      isDisabled: false,
      $or: [
        { accessPermissions: 'tutor' },
        { accessPermissions: 'both' }
      ]
    });
    
    res.json({ 
      isTutorVerifier: !!employee,
      employeeId: employee?._id 
    });
  } catch (error) {
    console.error('Error checking verifier status:', error);
    res.status(500).json({ 
      error: 'Failed to check verifier status',
      isTutorVerifier: false 
    });
  }
});

module.exports = router;

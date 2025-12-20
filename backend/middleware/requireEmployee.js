const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Separate auth middleware for employee accounts (staff dashboard)
const requireEmployee = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.employeeToken) {
    token = req.cookies.employeeToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Employee authorization token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.EMPLOYEE_JWT_SECRET || process.env.JWT_SECRET);
    if (!decoded || !decoded.employeeId) {
      return res.status(401).json({ message: 'Invalid employee token' });
    }

    const employee = await Employee.findById(decoded.employeeId);
    if (!employee || employee.isDisabled) {
      return res.status(401).json({ message: 'Employee account not found or disabled' });
    }

    req.employee = employee;
    next();
  } catch (err) {
    console.error('Employee token verification failed:', err.message);
    return res.status(401).json({ message: 'Employee token is not valid' });
  }
};

// Helper middleware to enforce module-level access
const requireEmployeeAccess = (required) => {
  return (req, res, next) => {
    const emp = req.employee;
    if (!emp) return res.status(401).json({ message: 'Employee authentication required' });

    const perms = emp.accessPermissions;
    const hasInterviewer = perms === 'interviewer' || perms === 'both';
    const hasTutor = perms === 'tutor' || perms === 'both';

    if (required === 'interviewer' && !hasInterviewer) {
      return res.status(403).json({ message: 'Interviewer approval access required' });
    }
    if (required === 'tutor' && !hasTutor) {
      return res.status(403).json({ message: 'Tutor approval access required' });
    }

    next();
  };
};

module.exports = {
  requireEmployee,
  requireEmployeeAccess,
};

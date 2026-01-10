const jwt = require('jsonwebtoken');
const QuizementEmployee = require('../models/QuizementEmployee');

const requireQuizementEmployee = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.quizementEmployeeToken) {
    token = req.cookies.quizementEmployeeToken;
  }

  if (!token) {
    return res.status(401).json({ message: 'Quizzment employee authorization token required' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.QUIZEMENT_EMPLOYEE_JWT_SECRET || process.env.JWT_SECRET
    );

    if (!decoded || !decoded.quizementEmployeeId) {
      return res.status(401).json({ message: 'Invalid Quizzment employee token' });
    }

    const employee = await QuizementEmployee.findById(decoded.quizementEmployeeId);
    if (!employee || employee.status === 'disabled') {
      return res.status(401).json({ message: 'Quizzment employee account not found or disabled' });
    }

    req.quizementEmployee = employee;
    next();
  } catch (err) {
    console.error('Quizzment employee token verification failed:', err.message);
    return res.status(401).json({ message: 'Quizzment employee token is not valid' });
  }
};

module.exports = requireQuizementEmployee;

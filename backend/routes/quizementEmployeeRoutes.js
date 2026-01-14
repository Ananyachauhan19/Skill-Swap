const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const QuizementEmployee = require('../models/QuizementEmployee');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Helper to sign Quizzment employee JWT
const signQuizementEmployeeToken = (employee) => {
  const payload = {
    quizementEmployeeId: employee._id.toString(),
    role: 'quizement_employee',
  };
  const secret = process.env.QUIZEMENT_EMPLOYEE_JWT_SECRET || process.env.JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: '1d' });
};

// Admin-only: list Quizzment employees
router.get('/admin/quizement-employees', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const employees = await QuizementEmployee.find().sort({ createdAt: -1 }).lean();
    return res.json(employees);
  } catch (err) {
    console.error('List Quizzment employees error:', err);
    return res.status(500).json({ message: 'Failed to fetch Quizzment employees' });
  }
});

// Admin-only: create Quizzment employee
router.post('/admin/quizement-employees', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { fullName, email, employeeId, password, status } = req.body;

    if (!fullName || !email || !employeeId || !password) {
      return res.status(400).json({ message: 'Full name, email, employee ID and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Enforce global email / employeeId uniqueness across users and employees
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by an existing user' });
    }

    const existingEmployee = await Employee.findOne({ email: normalizedEmail }).lean();
    if (existingEmployee) {
      return res.status(400).json({ message: 'Email already in use by an existing employee' });
    }

    const existingQuizementByEmail = await QuizementEmployee.findOne({ email: normalizedEmail }).lean();
    if (existingQuizementByEmail) {
      return res.status(400).json({ message: 'Email already in use by a Quizzment employee' });
    }

    const existingQuizementById = await QuizementEmployee.findOne({ employeeId: employeeId.trim() }).lean();
    if (existingQuizementById) {
      return res.status(400).json({ message: 'Employee ID already in use by a Quizzment employee' });
    }

    const existingEmployeeById = await Employee.findOne({ employeeId: employeeId.trim() }).lean();
    if (existingEmployeeById) {
      return res.status(400).json({ message: 'Employee ID already in use by an employee' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const employee = await QuizementEmployee.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      employeeId: employeeId.trim(),
      passwordHash,
      status: status === 'disabled' ? 'disabled' : 'active',
    });

    return res.status(201).json(employee);
  } catch (err) {
    console.error('Create Quizzment employee error:', err);
    return res.status(500).json({ message: 'Failed to create Quizzment employee' });
  }
});

// Admin-only: update Quizzment employee (name / status / password)
router.put('/admin/quizement-employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { fullName, status, password } = req.body;
    const update = {};

    if (fullName !== undefined) update.fullName = fullName;
    if (status !== undefined) update.status = status === 'disabled' ? 'disabled' : 'active';

    if (password) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    const employee = await QuizementEmployee.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!employee) return res.status(404).json({ message: 'Quizzment employee not found' });

    return res.json(employee);
  } catch (err) {
    console.error('Update Quizzment employee error:', err);
    return res.status(500).json({ message: 'Failed to update Quizzment employee' });
  }
});

// Admin-only: delete Quizzment employee
router.delete('/admin/quizement-employees/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await QuizementEmployee.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Quizzment employee deleted' });
  } catch (err) {
    console.error('Delete Quizzment employee error:', err);
    return res.status(500).json({ message: 'Failed to delete Quizzment employee' });
  }
});

// Quizzment employee login (email or employeeId)
router.post('/quizement-employee/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email or Employee ID and password are required' });
    }

    const trimmed = identifier.trim();
    const query = trimmed.includes('@')
      ? { email: trimmed.toLowerCase() }
      : { employeeId: trimmed };

    const employee = await QuizementEmployee.findOne(query);
    if (!employee || employee.status === 'disabled') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, employee.passwordHash || '');
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signQuizementEmployeeToken(employee);

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('quizementEmployeeToken', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    employee.lastLoginAt = new Date();
    await employee.save();

    return res.json({
      employee: {
        id: employee._id,
        fullName: employee.fullName,
        email: employee.email,
        employeeId: employee.employeeId,
        status: employee.status,
      },
    });
  } catch (err) {
    console.error('Quizzment employee login error:', err);
    return res.status(500).json({ message: 'Failed to login' });
  }
});

// Get current Quizzment employee profile
router.get('/quizement-employee/me', async (req, res) => {
  try {
    const token = req.cookies?.quizementEmployeeToken;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.QUIZEMENT_EMPLOYEE_JWT_SECRET || process.env.JWT_SECRET
      );
    } catch (e) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!decoded.quizementEmployeeId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const employee = await QuizementEmployee.findById(decoded.quizementEmployeeId).lean();
    if (!employee || employee.status === 'disabled') {
      return res.status(401).json({ message: 'Account not found or disabled' });
    }

    return res.json({
      employee: {
        id: employee._id,
        fullName: employee.fullName,
        email: employee.email,
        employeeId: employee.employeeId,
        status: employee.status,
        createdAt: employee.createdAt,
      },
    });
  } catch (err) {
    console.error('Get Quizzment employee profile error:', err);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
});

// Quizzment employee logout
router.post('/quizement-employee/logout', (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('quizementEmployeeToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
    return res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Quizzment employee logout error:', err);
    return res.status(500).json({ message: 'Failed to logout' });
  }
});

// ==================== QUIZ MANAGEMENT (WITH EXCEL UPLOAD) ====================

const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const QuizementTest = require('../models/QuizementTest');
const requireQuizementEmployee = require('../middleware/requireQuizementEmployee');

// Configure multer for file upload
const storage = multer.memoryStorage();
const quizUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls' || ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel and CSV files (.xlsx, .xls, .csv) are allowed'), false);
    }
  }
}).single('excelFile');

// Create quiz via Excel upload
router.post('/quizement-employee/quizzes', requireQuizementEmployee, (req, res) => {
  quizUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, description, duration, isPaid, coinCost, course } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Excel file is required' });
      }

      if (!title || !duration) {
        return res.status(400).json({ message: 'Title and duration are required' });
      }

      // Validate paid quiz fields
      const isPaidQuiz = isPaid === 'true' || isPaid === true;
      const parsedBronzeCost = parseInt(req.body.bronzeCoinCost) || 0;
      const parsedSilverCost = parseInt(req.body.silverCoinCost) || 0;
      
      if (isPaidQuiz && parsedBronzeCost <= 0 && parsedSilverCost <= 0) {
        return res.status(400).json({ message: 'At least one coin cost (Bronze or Silver) must be greater than 0 for paid quizzes' });
      }

      // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      if (!data.length) {
        return res.status(400).json({ message: 'Excel file is empty' });
      }

      // Validate and transform questions
      const questions = [];
      const errors = [];
      let totalMarks = 0;

      data.forEach((row, index) => {
        const rowNum = index + 2; // Excel row number (accounting for header)
        
        // Validate required fields
        if (!row.Question || !row.Question.toString().trim()) {
          errors.push(`Row ${rowNum}: Question text is required`);
          return;
        }

        if (!row['Option A'] || !row['Option B'] || !row['Option C'] || !row['Option D']) {
          errors.push(`Row ${rowNum}: All 4 options (A, B, C, D) are required`);
          return;
        }

        const correctAnswer = row['Correct Answer']?.toString().toUpperCase().trim();
        if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
          errors.push(`Row ${rowNum}: Correct answer must be A, B, C, or D`);
          return;
        }

        const marks = parseInt(row.Marks);
        if (isNaN(marks) || marks < 1) {
          errors.push(`Row ${rowNum}: Marks must be a positive number`);
          return;
        }

        questions.push({
          questionText: row.Question.toString().trim(),
          options: [
            row['Option A'].toString().trim(),
            row['Option B'].toString().trim(),
            row['Option C'].toString().trim(),
            row['Option D'].toString().trim()
          ],
          correctAnswer,
          marks
        });

        totalMarks += marks;
      });

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: 'Validation errors found',
          errors 
        });
      }

      if (questions.length === 0) {
        return res.status(400).json({ message: 'No valid questions found in the Excel file' });
      }

      // Create quiz with new fields
      const quiz = await QuizementTest.create({
        name: title.trim(),
        description: description?.trim() || '',
        duration: parseInt(duration),
        bronzeCost: isPaidQuiz ? parsedBronzeCost : 0,
        silverCost: isPaidQuiz ? parsedSilverCost : 0,
        totalMarks,
        questions,
        createdByQuizementEmployee: req.quizementEmployee._id,
        isActive: true,
        // New fields
        isPaid: isPaidQuiz,
        course: course?.trim() || ''
      });

      return res.status(201).json({
        message: 'Quiz created successfully',
        quiz: {
          _id: quiz._id,
          title: quiz.name,  // Return as 'title' for frontend consistency
          description: quiz.description,
          duration: quiz.duration,
          totalMarks: quiz.totalMarks,
          questions: quiz.questions,
          isActive: quiz.isActive,
          isPaid: quiz.isPaid,
          bronzeCost: quiz.bronzeCost,
          silverCost: quiz.silverCost,
          course: quiz.course
        }
      });
    } catch (error) {
      console.error('Create quiz error:', error);
      return res.status(500).json({ message: 'Failed to create quiz' });
    }
  });
});

// Create WEEKLY quiz via Excel upload (auto-expires after 7 days)
router.post('/quizement-employee/weekly-quizzes', requireQuizementEmployee, (req, res) => {
  quizUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, description, duration, isPaid, course } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Excel file is required' });
      }

      if (!title || !duration) {
        return res.status(400).json({ message: 'Title and duration are required' });
      }

      // Validate paid quiz fields
      const isPaidQuiz = isPaid === 'true' || isPaid === true;
      const parsedBronzeCost = parseInt(req.body.bronzeCoinCost) || 0;
      const parsedSilverCost = parseInt(req.body.silverCoinCost) || 0;
      
      if (isPaidQuiz && parsedBronzeCost <= 0 && parsedSilverCost <= 0) {
        return res.status(400).json({ message: 'At least one coin cost (Bronze or Silver) must be greater than 0 for paid quizzes' });
      }

      // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      if (!data.length) {
        return res.status(400).json({ message: 'Excel file is empty' });
      }

      // Validate and transform questions
      const questions = [];
      const errors = [];
      let totalMarks = 0;

      data.forEach((row, index) => {
        const rowNum = index + 2;
        
        if (!row.Question || !row.Question.toString().trim()) {
          errors.push(`Row ${rowNum}: Question text is required`);
          return;
        }

        if (!row['Option A'] || !row['Option B'] || !row['Option C'] || !row['Option D']) {
          errors.push(`Row ${rowNum}: All 4 options (A, B, C, D) are required`);
          return;
        }

        const correctAnswer = row['Correct Answer']?.toString().toUpperCase().trim();
        if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
          errors.push(`Row ${rowNum}: Correct answer must be A, B, C, or D`);
          return;
        }

        const marks = parseInt(row.Marks);
        if (isNaN(marks) || marks < 1) {
          errors.push(`Row ${rowNum}: Marks must be a positive number`);
          return;
        }

        questions.push({
          questionText: row.Question.toString().trim(),
          options: [
            row['Option A'].toString().trim(),
            row['Option B'].toString().trim(),
            row['Option C'].toString().trim(),
            row['Option D'].toString().trim()
          ],
          correctAnswer,
          marks
        });

        totalMarks += marks;
      });

      if (errors.length > 0) {
        return res.status(400).json({ 
          message: 'Validation errors found',
          errors 
        });
      }

      if (questions.length === 0) {
        return res.status(400).json({ message: 'No valid questions found in the Excel file' });
      }

      // Calculate expiry date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create weekly quiz
      const quiz = await QuizementTest.create({
        name: title.trim(),
        description: description?.trim() || '',
        duration: parseInt(duration),
        bronzeCost: isPaidQuiz ? parsedBronzeCost : 0,
        silverCost: isPaidQuiz ? parsedSilverCost : 0,
        totalMarks,
        questions,
        createdByQuizementEmployee: req.quizementEmployee._id,
        isActive: true,
        isPaid: isPaidQuiz,
        course: course?.trim() || '',
        isWeeklyQuiz: true,
        expiresAt: expiresAt
      });

      return res.status(201).json({
        message: 'Weekly quiz created successfully! It will auto-expire in 7 days.',
        quiz: {
          _id: quiz._id,
          title: quiz.name,
          description: quiz.description,
          duration: quiz.duration,
          totalMarks: quiz.totalMarks,
          questions: quiz.questions,
          isActive: quiz.isActive,
          isPaid: quiz.isPaid,
          bronzeCost: quiz.bronzeCost,
          silverCost: quiz.silverCost,
          course: quiz.course,
          isWeeklyQuiz: quiz.isWeeklyQuiz,
          expiresAt: quiz.expiresAt
        }
      });
    } catch (error) {
      console.error('Create weekly quiz error:', error);
      return res.status(500).json({ message: 'Failed to create weekly quiz' });
    }
  });
});

// Get quizzes created by current Quizzment employee
router.get('/quizement-employee/quizzes/mine', requireQuizementEmployee, async (req, res) => {
  try {
    const quizzes = await QuizementTest.find({
      createdByQuizementEmployee: req.quizementEmployee._id
    })
    .select('name description duration totalMarks isActive isPaid bronzeCost silverCost course createdAt')
    .sort({ createdAt: -1 })
    .lean();

    // Get attempt counts for each quiz
    const QuizementAttempt = require('../models/QuizementAttempt');
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const attemptCount = await QuizementAttempt.countDocuments({ testId: quiz._id, finished: true });
        return { 
          ...quiz, 
          title: quiz.name, 
          attemptCount,
          isPaid: quiz.isPaid || false,
          bronzeCost: quiz.bronzeCost || 0,
          silverCost: quiz.silverCost || 0,
          course: quiz.course || ''
        };
      })
    );

    return res.json(quizzesWithStats);
  } catch (error) {
    console.error('Get my quizzes error:', error);
    return res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Get single quiz details
router.get('/quizement-employee/quizzes/:id', requireQuizementEmployee, async (req, res) => {
  try {
    const quiz = await QuizementTest.findOne({
      _id: req.params.id,
      createdByQuizementEmployee: req.quizementEmployee._id
    }).lean();

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const QuizementAttempt = require('../models/QuizementAttempt');
    const attemptCount = await QuizementAttempt.countDocuments({ testId: quiz._id, finished: true });

    return res.json({ 
      ...quiz, 
      title: quiz.name, 
      attemptCount,
      isPaid: quiz.isPaid || false,
      bronzeCost: quiz.bronzeCost || 0,
      silverCost: quiz.silverCost || 0,
      course: quiz.course || ''
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    return res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

// Toggle quiz active status
router.patch('/quizement-employee/quizzes/:id/toggle', requireQuizementEmployee, async (req, res) => {
  try {
    const quiz = await QuizementTest.findOne({
      _id: req.params.id,
      createdByQuizementEmployee: req.quizementEmployee._id
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    return res.json({ isActive: quiz.isActive });
  } catch (error) {
    console.error('Toggle quiz error:', error);
    return res.status(500).json({ message: 'Failed to toggle quiz status' });
  }
});

// Delete quiz
router.delete('/quizement-employee/quizzes/:id', requireQuizementEmployee, async (req, res) => {
  try {
    const QuizementAttempt = require('../models/QuizementAttempt');
    
    // Check if quiz has attempts
    const attemptCount = await QuizementAttempt.countDocuments({ quizementTestId: req.params.id });
    if (attemptCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete quiz with existing attempts' 
      });
    }

    const quiz = await QuizementTest.findOneAndDelete({
      _id: req.params.id,
      createdByQuizementEmployee: req.quizementEmployee._id
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    return res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return res.status(500).json({ message: 'Failed to delete quiz' });
  }
});

// Get quiz results/statistics
router.get('/quizement-employee/quizzes/:id/results', requireQuizementEmployee, async (req, res) => {
  try {
    const quiz = await QuizementTest.findOne({
      _id: req.params.id,
      createdByQuizementEmployee: req.quizementEmployee._id
    }).lean();

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const QuizementAttempt = require('../models/QuizementAttempt');
    const User = require('../models/User');

    const attempts = await QuizementAttempt.find({ testId: quiz._id, finished: true })
      .populate('userId', 'firstName lastName email username')
      .sort({ finishedAt: -1 })
      .lean();

    const stats = {
      totalAttempts: attempts.length,
      averageScore: attempts.length > 0 
        ? attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length 
        : 0,
      highestScore: attempts.length > 0 
        ? Math.max(...attempts.map(a => a.score)) 
        : 0,
      lowestScore: attempts.length > 0 
        ? Math.min(...attempts.map(a => a.score)) 
        : 0
    };

    const attemptsWithDetails = attempts.map(attempt => ({
      _id: attempt._id,
      userName: `${attempt.userId?.firstName || ''} ${attempt.userId?.lastName || ''}`.trim() || attempt.userId?.username || 'Unknown',
      userEmail: attempt.userId?.email || 'N/A',
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage || 0,
      completedAt: attempt.finishedAt,
      violations: attempt.violations?.length || 0
    }));

    return res.json({
      quiz: {
        _id: quiz._id,
        title: quiz.name,  // Convert to 'title' for frontend
        description: quiz.description,
        totalMarks: quiz.totalMarks,
        duration: quiz.duration
      },
      stats,
      attempts: attemptsWithDetails
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    return res.status(500).json({ message: 'Failed to fetch quiz results' });
  }
});

// ==================== COURSES API ====================

// Get available courses from CSV (for quiz creation)
router.get('/quizement-employee/courses', requireQuizementEmployee, async (req, res) => {
  try {
    const csvUrl = process.env.GOOGLE_DEGREE_CSV_URL;
    if (!csvUrl) {
      // Fallback courses if CSV URL not configured
      return res.json({
        courses: ['BCA', 'BSc CS', 'BCom', 'BA', 'BTech', 'MTech', 'MCA', 'MBA', 'BBA', 'BSc Maths', 'Other']
      });
    }

    const fetch = (await import('node-fetch')).default;
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch courses CSV');
    }

    const text = await response.text();
    const lines = text.split('\n').filter(l => l.trim());
    // Skip header row and parse courses
    // CSV format: DEGREE_CODE,Full Name,Type,Category
    // We only want the Full Name (second column)
    const courseList = lines.slice(1).map(line => {
      const columns = line.split(',');
      if (columns.length >= 2) {
        // Extract second column (Full Name) and remove quotes
        const fullName = columns[1].trim().replace(/^"|"$/g, '');
        return fullName;
      }
      return null;
    }).filter(Boolean);

    // Remove duplicates and sort
    const uniqueCourses = [...new Set(courseList)].sort();

    // Add "Other" option at the end
    res.json({ courses: [...uniqueCourses, 'Other'] });
  } catch (error) {
    console.error('Error fetching courses:', error);
    // Return fallback courses on error
    res.json({
      courses: ['BCA', 'BSc CS', 'BCom', 'BA', 'BTech', 'MTech', 'MCA', 'MBA', 'BBA', 'BSc Maths', 'Other']
    });
  }
});

module.exports = router;


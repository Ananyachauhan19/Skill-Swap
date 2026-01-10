const path = require('path');
const xlsx = require('xlsx');
const multer = require('multer');
const QuizementTest = require('../models/QuizementTest');
const QuizementAttempt = require('../models/QuizementAttempt');
const User = require('../models/User');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or Excel files are allowed'), false);
    }
  },
}).single('csvFile');

exports.downloadSampleCsv = (req, res) => {
  const sampleRows = [
    ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks'],
    ['What is 2 + 2?', '1', '2', '3', '4', 'D', '1'],
  ];

  const worksheet = xlsx.utils.aoa_to_sheet(sampleRows);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sample');
  const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'csv' });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="quizement-sample.csv"');
  return res.send(buffer);
};

exports.uploadTest = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { name, description, duration, bronzeCost, silverCost } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: 'CSV file is required' });
      }

      if (!name || !duration) {
        return res.status(400).json({ message: 'Test name and duration are required' });
      }

      const durationMinutes = parseInt(duration, 10);
      const bronze = parseInt(bronzeCost, 10);
      const silver = parseInt(silverCost, 10);

      if (Number.isNaN(durationMinutes) || durationMinutes <= 0) {
        return res.status(400).json({ message: 'Duration must be a positive number of minutes' });
      }
      if (Number.isNaN(bronze) || bronze < 0) {
        return res.status(400).json({ message: 'Bronze coins required must be zero or positive' });
      }
      if (Number.isNaN(silver) || silver < 0) {
        return res.status(400).json({ message: 'Silver coins required must be zero or positive' });
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      if (!data.length) {
        return res.status(400).json({ message: 'CSV file is empty' });
      }

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

        const marks = parseInt(row.Marks, 10);
        if (Number.isNaN(marks) || marks < 1) {
          errors.push(`Row ${rowNum}: Marks must be a positive number`);
          return;
        }

        questions.push({
          questionText: row.Question.toString().trim(),
          options: [
            row['Option A'].toString().trim(),
            row['Option B'].toString().trim(),
            row['Option C'].toString().trim(),
            row['Option D'].toString().trim(),
          ],
          correctAnswer,
          marks,
        });
        totalMarks += marks;
      });

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Validation errors found', errors });
      }

      if (questions.length === 0) {
        return res.status(400).json({ message: 'No valid questions found in CSV' });
      }
      if (questions.length > 100) {
        return res.status(400).json({ message: 'Maximum 100 questions allowed' });
      }

      const test = new QuizementTest({
        name: name.trim(),
        description: description || '',
        duration: durationMinutes,
        bronzeCost: bronze,
        silverCost: silver,
        totalMarks,
        questions,
        createdByEmployee: req.employee?._id,
      });

      await test.save();

      return res.status(201).json({
        message: 'Quizement test created successfully',
        test: {
          id: test._id,
          name: test.name,
          description: test.description,
          duration: test.duration,
          bronzeCost: test.bronzeCost,
          silverCost: test.silverCost,
          totalMarks: test.totalMarks,
          questionCount: test.questions.length,
        },
      });
    } catch (error) {
      console.error('Quizement upload error:', error);
      return res.status(500).json({ message: 'Failed to upload Quizement test' });
    }
  });
};

exports.listTestsForUser = async (req, res) => {
  try {
    // Get all active tests (includes both employee-created and Quizzment employee-created)
    const tests = await QuizementTest.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('createdByQuizementEmployee', 'fullName')
      .lean();
    
    const attempts = await QuizementAttempt.find({ 
      userId: req.user._id, 
      testId: { $in: tests.map((t) => t._id) } 
    }).lean();
    
    const attemptMap = new Map();
    attempts.forEach((a) => {
      attemptMap.set(String(a.testId), a);
    });

    const items = tests.map((t) => {
      const a = attemptMap.get(String(t._id));
      let status = 'locked';
      
      // If created by Quizzment employee, it's free and unlocked by default
      const isFreeQuiz = !!t.createdByQuizementEmployee;
      
      if (a) {
        if (a.finished) status = 'attempted';
        else if (a.started) status = 'in-progress';
        else if (a.unlocked) status = 'unlocked';
      } else if (isFreeQuiz) {
        // Free quiz from Quizzment employee - always unlocked
        status = 'unlocked';
      }
      
      return {
        id: t._id,
        name: t.name || t.title,  // Support both name (old) and title (new)
        description: t.description,
        duration: t.duration,
        bronzeCost: isFreeQuiz ? 0 : (t.bronzeCost || 0),
        silverCost: isFreeQuiz ? 0 : (t.silverCost || 0),
        totalMarks: t.totalMarks,
        questionCount: t.questions?.length || 0,
        status,
        isFreeQuiz,
        createdBy: t.createdByQuizementEmployee 
          ? `${t.createdByQuizementEmployee.fullName} (Quizzment)` 
          : 'SkillSwap'
      };
    });

    return res.json({ tests: items });
  } catch (error) {
    console.error('Quizement list error:', error);
    return res.status(500).json({ message: 'Failed to load Quizement tests' });
  }
};

exports.unlockTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { coinType } = req.body; // 'bronze' or 'silver'

    const test = await QuizementTest.findById(testId);
    if (!test || !test.isActive) {
      return res.status(404).json({ message: 'Quizement test not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let attempt = await QuizementAttempt.findOne({ testId: testId, userId: user._id });
    
    // If it's a free quiz (created by Quizzment employee), auto-unlock without cost
    const isFreeQuiz = !!test.createdByQuizementEmployee;
    
    if (isFreeQuiz) {
      if (attempt && attempt.unlocked) {
        return res.status(200).json({ message: 'Test already unlocked', attemptId: attempt._id });
      }
      
      if (!attempt) {
        attempt = new QuizementAttempt({
          testId: testId,
          userId: user._id,
          unlocked: true,
          unlockedAt: new Date(),
          // No coins spent for free quiz
        });
      } else {
        attempt.unlocked = true;
        attempt.unlockedAt = new Date();
      }
      
      await attempt.save();
      
      return res.status(200).json({ 
        message: 'Free quiz unlocked successfully', 
        attemptId: attempt._id 
      });
    }

    // For paid quizzes, require valid coin type and sufficient balance
    if (!['bronze', 'silver'].includes(coinType)) {
      return res.status(400).json({ message: 'Invalid coin type' });
    }

    const cost = coinType === 'bronze' ? (test.bronzeCost || 0) : (test.silverCost || 0);
    const field = coinType === 'bronze' ? 'bronzeCoins' : 'silverCoins';

    if (cost <= 0) {
      return res.status(400).json({ message: 'Selected coin type is not allowed for unlock' });
    }

    if ((user[field] || 0) < cost) {
      return res.status(400).json({ message: `Insufficient ${coinType} balance` });
    }

    if (attempt && attempt.unlocked) {
      return res.status(200).json({ message: 'Test already unlocked', attemptId: attempt._id });
    }

    user[field] = (user[field] || 0) - cost;
    await user.save();

    if (!attempt) {
      attempt = new QuizementAttempt({
        testId: testId,
        userId: user._id,
        unlocked: true,
        unlockedAt: new Date(),
        coinTypeUsed: coinType,
        coinsSpent: cost,
      });
    } else {
      attempt.unlocked = true;
      attempt.unlockedAt = new Date();
      attempt.coinTypeUsed = coinType;
      attempt.coinsSpent = cost;
    }

    await attempt.save();

    return res.status(200).json({
      message: 'Test unlocked successfully',
      attemptId: attempt._id,
      balance: {
        bronzeCoins: user.bronzeCoins || 0,
        silverCoins: user.silverCoins || 0,
        goldCoins: user.goldCoins || 0,
      },
    });
  } catch (error) {
    console.error('Quizement unlock error:', error);
    return res.status(500).json({ message: 'Failed to unlock Quizement test' });
  }
};

exports.startAttempt = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await QuizementTest.findById(testId);
    if (!test || !test.isActive) {
      return res.status(404).json({ message: 'Quizement test not found' });
    }

    let attempt = await QuizementAttempt.findOne({ testId: testId, userId: req.user._id });
    
    // If it's a free quiz and no attempt exists, auto-create and unlock
    const isFreeQuiz = !!test.createdByQuizementEmployee;
    
    if (isFreeQuiz && !attempt) {
      attempt = new QuizementAttempt({
        testId: testId,
        userId: req.user._id,
        unlocked: true,
        unlockedAt: new Date(),
      });
      await attempt.save();
    }
    
    if (!attempt || !attempt.unlocked) {
      return res.status(403).json({ message: 'Test is not unlocked' });
    }

    if (attempt.finished) {
      return res.status(400).json({ message: 'You have already completed this test' });
    }

    if (!attempt.started) {
      attempt.started = true;
      attempt.startedAt = new Date();
      attempt.answers = test.questions.map((_, index) => ({ questionIndex: index, selectedAnswer: '' }));
      await attempt.save();
    }

    return res.json({
      test: {
        id: test._id,
        name: test.name,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        questions: test.questions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          marks: q.marks,
        })),
      },
      attempt: {
        id: attempt._id,
        startedAt: attempt.startedAt,
      },
    });
  } catch (error) {
    console.error('Quizement start error:', error);
    return res.status(500).json({ message: 'Failed to start Quizement test' });
  }
};

exports.submitAttempt = async (req, res) => {
  try {
    const { testId } = req.params;
    const { answers } = req.body; // { questionIndex, selectedAnswer }[]

    const test = await QuizementTest.findById(testId);
    if (!test || !test.isActive) {
      return res.status(404).json({ message: 'Quizement test not found' });
    }

    const attempt = await QuizementAttempt.findOne({ testId: testId, userId: req.user._id });
    if (!attempt || !attempt.unlocked) {
      return res.status(403).json({ message: 'Test is not unlocked' });
    }

    if (attempt.finished) {
      return res.status(400).json({ message: 'Test already submitted' });
    }

    if (Array.isArray(answers)) {
      attempt.answers = answers.map((a) => ({
        questionIndex: a.questionIndex,
        selectedAnswer: a.selectedAnswer || '',
      }));
    }

    await attempt.calculateScore();
    attempt.finished = true;
    attempt.finishedAt = new Date();
    await attempt.save();

    return res.json({
      message: 'Quizement attempt submitted successfully',
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
    });
  } catch (error) {
    console.error('Quizement submit error:', error);
    return res.status(500).json({ message: 'Failed to submit Quizement attempt' });
  }
};

exports.logViolation = async (req, res) => {
  try {
    const { testId } = req.params;
    const { type } = req.body;

    const attempt = await QuizementAttempt.findOne({ testId: testId, userId: req.user._id });
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    const count = await attempt.addViolation(type);
    const autoSubmitted = attempt.finished;

    return res.json({ violationCount: count, autoSubmitted });
  } catch (error) {
    console.error('Quizement violation error:', error);
    return res.status(500).json({ message: 'Failed to log violation' });
  }
};

exports.getResult = async (req, res) => {
  try {
    const { testId } = req.params;
    const test = await QuizementTest.findById(testId);
    const attempt = await QuizementAttempt.findOne({ testId: testId, userId: req.user._id });

    if (!test || !attempt) {
      return res.status(404).json({ message: 'Result not found' });
    }

    return res.json({
      test: {
        id: test._id,
        name: test.name,
        description: test.description,
        duration: test.duration,
        questions: test.questions.map((q, index) => ({
          questionIndex: index,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
        })),
      },
      attempt: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        finishedAt: attempt.finishedAt,
        answers: attempt.answers,
      },
    });
  } catch (error) {
    console.error('Quizement result error:', error);
    return res.status(500).json({ message: 'Failed to load result' });
  }
};

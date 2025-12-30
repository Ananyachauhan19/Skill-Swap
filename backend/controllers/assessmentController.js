const Assessment = require('../models/Assessment');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const AssessmentNotification = require('../models/AssessmentNotification');
const Institute = require('../models/Institute');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');
const { sendAssessmentNotifications } = require('../utils/assessmentNotifications');

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
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

// ==================== CAMPUS AMBASSADOR ENDPOINTS ====================

// Upload assessment via Excel
exports.uploadAssessment = async (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const { title, description, duration, collegeConfigs, startTime, endTime } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: 'Excel file is required' });
      }

      if (!title || !duration) {
        return res.status(400).json({ message: 'Title and duration are required' });
      }

      // Parse collegeConfigs - this is the new format
      let parsedConfigs = [];
      if (collegeConfigs) {
        try {
          parsedConfigs = typeof collegeConfigs === 'string' 
            ? JSON.parse(collegeConfigs) 
            : collegeConfigs;
        } catch (error) {
          return res.status(400).json({ message: 'Invalid collegeConfigs format' });
        }
      }

      if (!parsedConfigs.length) {
        return res.status(400).json({ message: 'At least one college configuration is required' });
      }

      // Extract unique college IDs from configs
      const collegeIds = [...new Set(parsedConfigs.map(c => c.collegeId))];

      // Verify colleges belong to this campus ambassador
      const validColleges = await Institute.find({
        _id: { $in: collegeIds },
        campusAmbassador: req.user._id
      });

      if (validColleges.length !== collegeIds.length) {
        return res.status(403).json({ message: 'Invalid college selection' });
      }

      // Validate each college configuration
      for (const config of parsedConfigs) {
        if (!config.collegeId || !config.courseId || !config.compulsorySemesters) {
          return res.status(400).json({
            message: 'Each college config must have collegeId, courseId, and compulsorySemesters'
          });
        }

        // Find the college for this config
        const college = validColleges.find(c => c._id.toString() === config.collegeId);
        
        if (!college) {
          return res.status(400).json({ 
            message: `Invalid college ID: ${config.collegeId}` 
          });
        }

        // Validate course belongs to this college
        const collegeCourses = college.courses || [];
        if (!collegeCourses.includes(config.courseId)) {
          return res.status(400).json({
            message: `Course "${config.courseId}" is not available in ${college.instituteName}. Available courses: ${collegeCourses.join(', ')}`
          });
        }

        // Validate compulsory semesters (1-12)
        if (!Array.isArray(config.compulsorySemesters) || config.compulsorySemesters.length === 0) {
          return res.status(400).json({
            message: `College ${college.instituteName}: compulsorySemesters must be a non-empty array`
          });
        }

        const invalidSemesters = config.compulsorySemesters.filter(s => s < 1 || s > 12);
        if (invalidSemesters.length > 0) {
          return res.status(400).json({
            message: `Invalid semesters for ${college.instituteName}: ${invalidSemesters.join(', ')}. Semesters must be between 1 and 12.`
          });
        }
      }

      // Validate time window if provided
      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start) {
          return res.status(400).json({ message: 'End time must be after start time' });
        }
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
        return res.status(400).json({ message: 'No valid questions found in Excel' });
      }

      if (questions.length > 100) {
        return res.status(400).json({ message: 'Maximum 100 questions allowed' });
      }

      // Create assessment with new collegeConfigs format
      const assessment = new Assessment({
        title,
        description: description || '',
        duration: parseInt(duration),
        totalMarks,
        campusAmbassadorId: req.user._id,
        collegeConfigs: parsedConfigs,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        questions,
        isActive: true
      });

      await assessment.save();

      // Send email notifications if config is provided
      let notificationResults = null;
      if (parsedConfigs.length > 0 && startTime && endTime) {
        try {
          notificationResults = await sendAssessmentNotifications(assessment);
        } catch (error) {
          console.error('Failed to send notifications:', error);
          // Don't fail the assessment creation if notifications fail
        }
      }

      res.status(201).json({
        message: 'Assessment created successfully',
        assessment: {
          id: assessment._id,
          title: assessment.title,
          questionCount: assessment.questions.length,
          totalMarks: assessment.totalMarks,
          duration: assessment.duration
        },
        notifications: notificationResults
      });

      // Log activity (after response to avoid blocking)
      setImmediate(async () => {
        try {
          const instituteNames = validColleges.map(c => c.instituteName);
          await ActivityLog.logActivity(req.campusAmbassador._id, 'Assessment Uploaded', {
            instituteName: instituteNames,
            metadata: {
              testName: assessment.title,
              testStartTime: assessment.startTime,
              testEndTime: assessment.endTime,
              questionCount: assessment.questions.length,
              totalMarks: assessment.totalMarks
            }
          });
        } catch (logError) {
          console.error('[ActivityLog] Error logging assessment upload:', logError);
        }
      });

    } catch (error) {
      console.error('Upload assessment error:', error);
      res.status(500).json({ message: 'Failed to create assessment', error: error.message });
    }
  });
};

// Get all assessments created by campus ambassador
exports.getMyAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ 
      campusAmbassadorId: req.user._id 
    })
    .populate('collegeConfigs.collegeId', 'instituteName instituteId instituteType')
    .populate('instituteIds', 'instituteName instituteId instituteType')
    .sort({ createdAt: -1 })
    .select('-questions.correctAnswer'); // Don't send correct answers

    const assessmentsWithStats = assessments.map(assessment => ({
      _id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      totalMarks: assessment.totalMarks,
      questionCount: assessment.questions.length,
      collegeConfigs: assessment.collegeConfigs?.map(config => ({
        collegeId: config.collegeId?._id || config.collegeId,
        collegeName: config.collegeId?.instituteName,
        courseId: config.courseId,
        compulsorySemesters: config.compulsorySemesters
      })) || [],
      // Fallback for old format
      institutes: assessment.instituteIds,
      isActive: assessment.isActive,
      attemptsCount: assessment.attemptsCount,
      averageScore: assessment.averageScore,
      createdAt: assessment.createdAt,
      updatedAt: assessment.updatedAt
    }));

    res.json({ assessments: assessmentsWithStats });
  } catch (error) {
    console.error('Get assessments error:', error);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
};

// Get single assessment with full details (for preview)
exports.getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      campusAmbassadorId: req.user._id
    }).populate('instituteIds', 'name');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    res.json({ assessment });
  } catch (error) {
    console.error('Get assessment error:', error);
    res.status(500).json({ message: 'Failed to fetch assessment' });
  }
};

// Update assessment configuration (college configs and compulsory semesters)
// NOTE: Questions cannot be edited after creation, but compulsory semesters can be updated
exports.updateAssessmentConfig = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      campusAmbassadorId: req.user._id
    }).populate('collegeConfigs.collegeId', 'instituteName courses');

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const { collegeConfigs } = req.body;

    if (!collegeConfigs || !Array.isArray(collegeConfigs)) {
      return res.status(400).json({ message: 'collegeConfigs must be an array' });
    }

    if (collegeConfigs.length === 0) {
      return res.status(400).json({ message: 'At least one college configuration is required' });
    }

    // Extract college IDs from configs
    const collegeIds = [...new Set(collegeConfigs.map(c => c.collegeId))];

    // Verify colleges belong to this campus ambassador
    const validColleges = await Institute.find({
      _id: { $in: collegeIds },
      campusAmbassador: req.user._id
    });

    if (validColleges.length !== collegeIds.length) {
      return res.status(403).json({ message: 'Invalid college selection' });
    }

    // Validate each college configuration
    for (const config of collegeConfigs) {
      if (!config.collegeId || !config.courseId || !config.compulsorySemesters) {
        return res.status(400).json({
          message: 'Each college config must have collegeId, courseId, and compulsorySemesters'
        });
      }

      // Find the college for this config
      const college = validColleges.find(c => c._id.toString() === config.collegeId);
      
      if (!college) {
        return res.status(400).json({ 
          message: `Invalid college ID: ${config.collegeId}` 
        });
      }

      // Validate course belongs to this college
      const collegeCourses = college.courses || [];
      if (!collegeCourses.includes(config.courseId)) {
        return res.status(400).json({
          message: `Course "${config.courseId}" is not available in ${college.instituteName}`
        });
      }

      // Validate compulsory semesters (1-12)
      if (!Array.isArray(config.compulsorySemesters) || config.compulsorySemesters.length === 0) {
        return res.status(400).json({
          message: `College ${college.instituteName}: compulsorySemesters must be a non-empty array`
        });
      }

      const invalidSemesters = config.compulsorySemesters.filter(s => s < 1 || s > 12);
      if (invalidSemesters.length > 0) {
        return res.status(400).json({
          message: `Invalid semesters for ${college.instituteName}: ${invalidSemesters.join(', ')}`
        });
      }
    }

    // Update college configs
    assessment.collegeConfigs = collegeConfigs;
    await assessment.save();

    res.json({
      message: 'Assessment configuration updated successfully',
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        collegeConfigs: assessment.collegeConfigs.map(config => ({
          collegeId: config.collegeId,
          courseId: config.courseId,
          compulsorySemesters: config.compulsorySemesters
        }))
      }
    });
  } catch (error) {
    console.error('Update assessment config error:', error);
    res.status(500).json({ message: 'Failed to update assessment', error: error.message });
  }
};

// Toggle assessment active status
exports.toggleAssessmentStatus = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      campusAmbassadorId: req.user._id
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    assessment.isActive = !assessment.isActive;
    await assessment.save();

    res.json({ 
      message: `Assessment ${assessment.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: assessment.isActive
    });
  } catch (error) {
    console.error('Toggle assessment error:', error);
    res.status(500).json({ message: 'Failed to toggle assessment status' });
  }
};

// Delete assessment
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      campusAmbassadorId: req.user._id
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    // Check if any attempts exist
    const attemptCount = await AssessmentAttempt.countDocuments({ assessmentId: assessment._id });
    
    if (attemptCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete assessment with existing attempts',
        attemptCount 
      });
    }

    await Assessment.findByIdAndDelete(assessment._id);

    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Delete assessment error:', error);
    res.status(500).json({ message: 'Failed to delete assessment' });
  }
};

// Get assessment attempts for a specific assessment
exports.getAssessmentAttempts = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      campusAmbassadorId: req.user._id
    });

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    const attempts = await AssessmentAttempt.find({ 
      assessmentId: assessment._id,
      status: { $in: ['submitted', 'auto-submitted'] }
    })
    .populate('studentId', 'firstName lastName email')
    .sort({ submittedAt: -1 });

    res.json({ attempts });
  } catch (error) {
    console.error('Get attempts error:', error);
    res.status(500).json({ message: 'Failed to fetch attempts' });
  }
};

// ==================== STUDENT ENDPOINTS ====================

// Get available assessments for student's institute
exports.getStudentAssessments = async (req, res) => {
  try {
    // Check if user has an instituteId
    if (!req.user.instituteId) {
      return res.json({ assessments: [] });
    }

    // Find student's institute using the instituteId string field
    const studentInstitute = await Institute.findOne({
      instituteId: req.user.instituteId
    });

    if (!studentInstitute) {
      return res.json({ assessments: [] });
    }

    const studentSemester = req.user.semester ? parseInt(req.user.semester) : null;
    const studentCourse = req.user.course || null;

    // Find active assessments for this institute that include the student's course
    const assessments = await Assessment.find({
      isActive: true,
      'collegeConfigs.collegeId': studentInstitute._id
    })
    .sort({ createdAt: -1 });

    // Check attempt status and eligibility for each assessment
    const assessmentsWithStatus = await Promise.all(assessments.map(async (assessment) => {
      const attempt = await AssessmentAttempt.findOne({
        assessmentId: assessment._id,
        studentId: req.user._id
      });

      // VISIBILITY LOGIC:
      // 1. Find the college config for student's institute
      const collegeConfig = assessment.collegeConfigs?.find(config => 
        config.collegeId.toString() === studentInstitute._id.toString()
      );

      // If no college config exists, check old format for backward compatibility
      if (!collegeConfig && (!assessment.collegeConfigs || assessment.collegeConfigs.length === 0)) {
        // OLD FORMAT: Check universitySemesterConfig for backward compatibility
        if (assessment.universitySemesterConfig && assessment.universitySemesterConfig.length > 0) {
          const matchingConfig = assessment.universitySemesterConfig.find(config => {
            // Must match institute
            if (config.instituteId.toString() !== studentInstitute._id.toString()) {
              return false;
            }

            // Must match semester (old behavior)
            if (!studentSemester || !config.semesters.includes(studentSemester)) {
              return false;
            }

            // If config has courses specified, student must match one of them
            if (config.courses && config.courses.length > 0) {
              if (!studentCourse || !config.courses.includes(studentCourse)) {
                return false;
              }
            }

            return true;
          });

          if (!matchingConfig) {
            return null; // Not eligible - old format assessment
          }

          // For old format, return as before
          const isCompulsory = matchingConfig.isCompulsory;
          const now = new Date();
          const isWithinTimeWindow = assessment.startTime && assessment.endTime 
            ? now >= new Date(assessment.startTime) && now <= new Date(assessment.endTime)
            : true;

          return {
            _id: assessment._id,
            title: assessment.title,
            description: assessment.description,
            duration: assessment.duration,
            totalMarks: assessment.totalMarks,
            questionCount: assessment.questions?.length || 0,
            createdAt: assessment.createdAt,
            startTime: assessment.startTime,
            endTime: assessment.endTime,
            isCompulsory,
            isWithinTimeWindow,
            hasAttempted: !!attempt,
            attemptStatus: attempt?.status,
            score: attempt?.score,
            percentage: attempt?.percentage,
            isCompulsoryForStudent: attempt?.isCompulsoryForStudent
          };
        }

        return null; // No config found
      }

      // NEW FORMAT LOGIC:
      if (!collegeConfig) {
        return null; // Assessment not visible to this college
      }

      // VISIBILITY: Student can see if they're in the selected course
      // (ALL semesters of the course can see it)
      const isVisible = studentCourse === collegeConfig.courseId;

      if (!isVisible) {
        return null; // Not in the visible course
      }

      // COMPULSORY: Mark as compulsory only if student's semester is in compulsorySemesters
      const isCompulsory = studentSemester && collegeConfig.compulsorySemesters.includes(studentSemester);

      // Check time window
      const now = new Date();
      const isWithinTimeWindow = assessment.startTime && assessment.endTime 
        ? now >= new Date(assessment.startTime) && now <= new Date(assessment.endTime)
        : true;

      return {
        _id: assessment._id,
        title: assessment.title,
        description: assessment.description,
        duration: assessment.duration,
        totalMarks: assessment.totalMarks,
        questionCount: assessment.questions?.length || 0,
        createdAt: assessment.createdAt,
        startTime: assessment.startTime,
        endTime: assessment.endTime,
        isCompulsory,
        isWithinTimeWindow,
        hasAttempted: !!attempt,
        attemptStatus: attempt?.status,
        score: attempt?.score,
        percentage: attempt?.percentage,
        isCompulsoryForStudent: attempt?.isCompulsoryForStudent
      };
    }));

    // Filter out null values (ineligible assessments)
    const eligibleAssessments = assessmentsWithStatus.filter(a => a !== null);

    res.json({ assessments: eligibleAssessments });
  } catch (error) {
    console.error('Get student assessments error:', error);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
};

// Start assessment attempt
exports.startAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (!assessment.isActive) {
      return res.status(400).json({ message: 'This assessment is not active' });
    }

    // Verify student belongs to correct institute
    // Check if student has an instituteId
    if (!req.user.instituteId) {
      return res.status(403).json({ message: 'You are not authorized to attempt this assessment' });
    }

    // Find the student's institute using their instituteId field
    const studentInstitute = await Institute.findOne({
      instituteId: req.user.instituteId
    });

    if (!studentInstitute) {
      return res.status(403).json({ message: 'You are not authorized to attempt this assessment' });
    }

    // Check if assessment is assigned to student's institute
    // Check in both new collegeConfigs and old instituteIds for backward compatibility
    let isAssignedToInstitute = false;
    
    if (assessment.collegeConfigs && assessment.collegeConfigs.length > 0) {
      isAssignedToInstitute = assessment.collegeConfigs.some(
        config => config.collegeId.toString() === studentInstitute._id.toString()
      );
    } else if (assessment.instituteIds && assessment.instituteIds.length > 0) {
      isAssignedToInstitute = assessment.instituteIds.some(
        instId => instId.toString() === studentInstitute._id.toString()
      );
    }

    if (!isAssignedToInstitute) {
      return res.status(403).json({ message: 'You are not authorized to attempt this assessment' });
    }

    // Check eligibility based on collegeConfigs or old universitySemesterConfig
    let isCompulsory = false;
    const studentSemester = req.user.semester ? parseInt(req.user.semester) : null;
    const studentCourse = req.user.course || null;
    
    // NEW FORMAT: Check collegeConfigs
    if (assessment.collegeConfigs && assessment.collegeConfigs.length > 0) {
      // Find the college config for this student's institute
      const collegeConfig = assessment.collegeConfigs.find(config => 
        config.collegeId.toString() === studentInstitute._id.toString()
      );

      if (!collegeConfig) {
        return res.status(403).json({ message: 'This assessment is not available for your college' });
      }

      // Check if student's course matches
      if (studentCourse !== collegeConfig.courseId) {
        return res.status(403).json({ message: 'This assessment is not available for your course' });
      }

      // Determine if compulsory for this student
      isCompulsory = studentSemester && collegeConfig.compulsorySemesters.includes(studentSemester);

      // Check time window
      const now = new Date();
      if (assessment.startTime && now < new Date(assessment.startTime)) {
        return res.status(400).json({ 
          message: 'Assessment has not started yet',
          startTime: assessment.startTime
        });
      }
      if (assessment.endTime && now > new Date(assessment.endTime)) {
        return res.status(400).json({ 
          message: 'Assessment window has ended',
          endTime: assessment.endTime
        });
      }
    }
    // OLD FORMAT: Check universitySemesterConfig (backward compatibility)
    else if (assessment.universitySemesterConfig && assessment.universitySemesterConfig.length > 0) {
      const matchingConfig = assessment.universitySemesterConfig.find(config => {
        // Must match institute
        if (config.instituteId.toString() !== studentInstitute._id.toString()) {
          return false;
        }

        // Must match semester
        if (!studentSemester || !config.semesters.includes(studentSemester)) {
          return false;
        }

        // If config has courses specified, student must match one of them
        if (config.courses && config.courses.length > 0) {
          if (!studentCourse || !config.courses.includes(studentCourse)) {
            return false;
          }
        }

        return true;
      });

      if (!matchingConfig) {
        return res.status(403).json({ message: 'This assessment is not available for your course/semester combination' });
      }

      isCompulsory = matchingConfig.isCompulsory;

      // Check time window
      const now = new Date();
      if (assessment.startTime && now < new Date(assessment.startTime)) {
        return res.status(400).json({ 
          message: 'Assessment has not started yet',
          startTime: assessment.startTime
        });
      }
      if (assessment.endTime && now > new Date(assessment.endTime)) {
        return res.status(400).json({ 
          message: 'Assessment window has ended',
          endTime: assessment.endTime
        });
      }
    }

    // Check for existing attempt
    const existingAttempt = await AssessmentAttempt.findOne({
      assessmentId: assessment._id,
      studentId: req.user._id
    });

    if (existingAttempt) {
      return res.status(400).json({ 
        message: 'You have already attempted this assessment',
        attemptId: existingAttempt._id
      });
    }

    // Create new attempt
    const attempt = new AssessmentAttempt({
      assessmentId: assessment._id,
      studentId: req.user._id,
      totalMarks: assessment.totalMarks,
      answers: [],
      status: 'in-progress',
      isCompulsoryForStudent: isCompulsory
    });

    await attempt.save();

    // Send assessment with questions but without correct answers
    const assessmentForStudent = {
      _id: assessment._id,
      title: assessment.title,
      description: assessment.description,
      duration: assessment.duration,
      totalMarks: assessment.totalMarks,
      questions: assessment.questions.map((q, index) => ({
        index,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks
      })),
      attemptId: attempt._id
    };

    res.json({ 
      message: 'Assessment started',
      assessment: assessmentForStudent,
      attempt: {
        id: attempt._id,
        startedAt: attempt.startedAt,
        isCompulsory
      }
    });
  } catch (error) {
    console.error('Start assessment error:', error);
    res.status(500).json({ message: 'Failed to start assessment' });
  }
};

// Submit assessment
exports.submitAssessment = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers must be an array' });
    }

    const attempt = await AssessmentAttempt.findOne({
      assessmentId: req.params.id,
      studentId: req.user._id,
      status: 'in-progress'
    });

    if (!attempt) {
      return res.status(404).json({ message: 'No active attempt found' });
    }

    // Check if assessment window has ended
    const assessment = await Assessment.findById(attempt.assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: 'Assessment not found' });
    }

    if (assessment.endTime) {
      const now = new Date();
      if (now > new Date(assessment.endTime)) {
        return res.status(400).json({ 
          message: 'Assessment window has ended. Your attempt will be auto-submitted.',
          endTime: assessment.endTime
        });
      }
    }

    // Update answers
    attempt.answers = answers;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();

    // Calculate score
    try {
      await attempt.calculateScore();
    } catch (scoreError) {
      console.error('Calculate score error:', scoreError);
      return res.status(500).json({ 
        message: 'Failed to calculate score',
        error: scoreError.message 
      });
    }

    await attempt.save();

    // Update assessment statistics
    try {
      await assessment.updateStatistics();
    } catch (statsError) {
      console.error('Update statistics error:', statsError);
      // Don't fail submission if statistics update fails
    }

    res.json({ 
      message: 'Assessment submitted successfully',
      result: {
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        attemptId: attempt._id
      }
    });
  } catch (error) {
    console.error('Submit assessment error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Failed to submit assessment',
      error: error.message 
    });
  }
};

// Log violation
exports.logViolation = async (req, res) => {
  try {
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ message: 'Violation type is required' });
    }

    // Log for debugging
    console.log(`[Violation] Type: ${type}, AssessmentId: ${req.params.id}, UserId: ${req.user?._id}`);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const attempt = await AssessmentAttempt.findOne({
      assessmentId: req.params.id,
      studentId: req.user._id,
      status: 'in-progress'
    });

    if (!attempt) {
      console.log(`[Violation] No active attempt found for assessment ${req.params.id} and user ${req.user._id}`);
      return res.status(404).json({ message: 'No active attempt found' });
    }

    const violationCount = await attempt.addViolation(type);

    res.json({ 
      message: 'Violation logged',
      violationCount,
      autoSubmitted: attempt.status === 'auto-submitted'
    });
  } catch (error) {
    console.error('Log violation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to log violation', error: error.message });
  }
};

// Get assessment result
exports.getAssessmentResult = async (req, res) => {
  try {
    const attempt = await AssessmentAttempt.findOne({
      assessmentId: req.params.id,
      studentId: req.user._id,
      status: { $in: ['submitted', 'auto-submitted'] }
    }).populate('assessmentId');

    if (!attempt) {
      return res.status(404).json({ message: 'No completed attempt found' });
    }

    const assessment = attempt.assessmentId;

    // Build result with correct answers
    const questionsWithResults = assessment.questions.map((q, index) => {
      const studentAnswer = attempt.answers.find(a => a.questionIndex === index);
      const isCorrect = studentAnswer?.selectedAnswer === q.correctAnswer;

      return {
        index,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAnswer?.selectedAnswer || '',
        isCorrect,
        marks: q.marks,
        earned: isCorrect ? q.marks : 0
      };
    });

    res.json({
      attempt: {
        id: attempt._id,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeTaken: attempt.timeTaken,
        violationCount: attempt.violations.length
      },
      assessment: {
        title: assessment.title,
        description: assessment.description
      },
      questions: questionsWithResults
    });
  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({ message: 'Failed to fetch result' });
  }
};

// Get all student attempts
exports.getStudentAttempts = async (req, res) => {
  try {
    const attempts = await AssessmentAttempt.find({
      studentId: req.user._id,
      status: { $in: ['submitted', 'auto-submitted'] }
    })
    .populate('assessmentId', 'title description duration totalMarks')
    .sort({ submittedAt: -1 });

    res.json({ attempts });
  } catch (error) {
    console.error('Get student attempts error:', error);
    res.status(500).json({ message: 'Failed to fetch attempts' });
  }
};

// ==================== MONTHLY REPORTS ====================

// Get full monthly report (all assessments for all students)
exports.getFullMonthlyReport = async (req, res) => {
  try {
    const { month, year, instituteId } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Verify institute belongs to this campus ambassador
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(403).json({ message: 'Invalid institute selection' });
    }

    // Get date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Find all assessments for this institute in the month
    const assessments = await Assessment.find({
      instituteIds: institute._id,
      createdAt: { $gte: startDate, $lte: endDate }
    }).select('_id title totalMarks createdAt universitySemesterConfig startTime endTime');

    // Get all students from this institute
    const students = await User.find({
      instituteId: institute.instituteId,
      role: { $in: ['learner', 'both'] }
    }).select('_id firstName lastName email semester studentId');

    // Build report data
    const reportData = [];

    for (const student of students) {
      for (const assessment of assessments) {
        // Check if student is eligible for this assessment
        const studentSemester = student.semester ? parseInt(student.semester) : null;
        let isEligible = false;
        let isCompulsory = false;

        if (assessment.universitySemesterConfig && assessment.universitySemesterConfig.length > 0) {
          const matchingConfig = assessment.universitySemesterConfig.find(config =>
            config.instituteId.toString() === institute._id.toString() &&
            studentSemester && config.semesters.includes(studentSemester)
          );

          if (matchingConfig) {
            isEligible = true;
            isCompulsory = matchingConfig.isCompulsory;
          }
        } else {
          // Legacy assessment without config - all students eligible
          isEligible = true;
        }

        if (!isEligible) continue;

        // Find attempt
        const attempt = await AssessmentAttempt.findOne({
          assessmentId: assessment._id,
          studentId: student._id
        });

        const now = new Date();
        const hasExpired = assessment.endTime && now > new Date(assessment.endTime);

        reportData.push({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          semester: student.semester,
          assessmentTitle: assessment.title,
          assessmentDate: assessment.createdAt,
          totalMarks: assessment.totalMarks,
          isCompulsory,
          attempted: !!attempt,
          attemptStatus: attempt ? attempt.status : (hasExpired && isCompulsory ? 'not-attempted' : 'pending'),
          score: attempt ? attempt.score : null,
          percentage: attempt ? attempt.percentage : null,
          submittedAt: attempt ? attempt.submittedAt : null
        });
      }
    }

    res.json({ 
      report: reportData,
      summary: {
        totalStudents: students.length,
        totalAssessments: assessments.length,
        totalRecords: reportData.length,
        month,
        year,
        institute: {
          id: institute._id,
          name: institute.instituteName
        }
      }
    });
  } catch (error) {
    console.error('Get full monthly report error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// Get compulsory-only monthly report
exports.getCompulsoryMonthlyReport = async (req, res) => {
  try {
    const { month, year, instituteId } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Verify institute belongs to this campus ambassador
    const institute = await Institute.findOne({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!institute) {
      return res.status(403).json({ message: 'Invalid institute selection' });
    }

    // Get date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Find compulsory assessments for this institute in the month
    const assessments = await Assessment.find({
      instituteIds: institute._id,
      createdAt: { $gte: startDate, $lte: endDate },
      'universitySemesterConfig.isCompulsory': true
    }).select('_id title totalMarks createdAt universitySemesterConfig startTime endTime');

    // Get all students from this institute
    const students = await User.find({
      instituteId: institute.instituteId,
      role: { $in: ['learner', 'both'] }
    }).select('_id firstName lastName email semester studentId');

    // Build report data
    const reportData = [];
    let notAttemptedCount = 0;

    for (const student of students) {
      for (const assessment of assessments) {
        // Check if student is eligible and if it's compulsory for them
        const studentSemester = student.semester ? parseInt(student.semester) : null;
        const matchingConfig = assessment.universitySemesterConfig.find(config =>
          config.instituteId.toString() === institute._id.toString() &&
          studentSemester && config.semesters.includes(studentSemester) &&
          config.isCompulsory === true
        );

        if (!matchingConfig) continue;

        // Find attempt
        const attempt = await AssessmentAttempt.findOne({
          assessmentId: assessment._id,
          studentId: student._id
        });

        const now = new Date();
        const hasExpired = assessment.endTime && now > new Date(assessment.endTime);
        const notAttempted = !attempt && hasExpired;

        if (notAttempted) {
          notAttemptedCount++;
        }

        reportData.push({
          studentId: student.studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          semester: student.semester,
          assessmentTitle: assessment.title,
          assessmentDate: assessment.createdAt,
          deadline: assessment.endTime,
          totalMarks: assessment.totalMarks,
          attempted: !!attempt,
          attemptStatus: attempt ? attempt.status : (hasExpired ? 'not-attempted' : 'pending'),
          score: attempt ? attempt.score : null,
          percentage: attempt ? attempt.percentage : null,
          submittedAt: attempt ? attempt.submittedAt : null,
          flagged: notAttempted // Flag for RED highlighting
        });
      }
    }

    res.json({ 
      report: reportData,
      summary: {
        totalStudents: students.length,
        compulsoryAssessments: assessments.length,
        totalRecords: reportData.length,
        notAttemptedCount,
        month,
        year,
        institute: {
          id: institute._id,
          name: institute.instituteName
        }
      }
    });
  } catch (error) {
    console.error('Get compulsory monthly report error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

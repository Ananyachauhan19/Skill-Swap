const AssessmentAttempt = require('../models/AssessmentAttempt');
const Assessment = require('../models/Assessment');
const Institute = require('../models/Institute');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Calculate grade based on percentage
 */
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

/**
 * Get monthly report data for a student
 * @param {string} studentId - Student's user ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {boolean} compulsoryOnly - If true, only include compulsory assessments
 */
const getStudentMonthlyReportData = async (studentId, month, year, compulsoryOnly = false) => {
  // Define month boundaries
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Build query for attempts
  const query = {
    studentId: new mongoose.Types.ObjectId(studentId),
    status: { $in: ['submitted', 'auto-submitted'] },
    submittedAt: { $gte: startDate, $lte: endDate }
  };

  if (compulsoryOnly) {
    query.isCompulsoryForStudent = true;
  }

  // Fetch attempts with assessment details
  const attempts = await AssessmentAttempt.find(query)
    .populate({
      path: 'assessmentId',
      select: 'title totalMarks'
    })
    .sort({ submittedAt: 1 })
    .lean();

  // Process attempts
  const tests = attempts.map((attempt, idx) => ({
    srNo: idx + 1,
    testName: attempt.assessmentId?.title || 'Unknown Test',
    date: attempt.submittedAt,
    totalMarks: attempt.totalMarks || 0,
    marksObtained: attempt.score || 0,
    isCompulsory: attempt.isCompulsoryForStudent
  }));

  // Calculate summary
  const totalTests = tests.length;
  const sumMarksObtained = tests.reduce((sum, t) => sum + t.marksObtained, 0);
  const sumTotalMarks = tests.reduce((sum, t) => sum + t.totalMarks, 0);
  const average = totalTests > 0 ? sumMarksObtained / totalTests : 0;
  const percentage = sumTotalMarks > 0 ? (sumMarksObtained / sumTotalMarks) * 100 : 0;
  const grade = calculateGrade(percentage);

  return {
    tests,
    summary: {
      totalTests,
      sumMarksObtained,
      sumTotalMarks,
      average: Math.round(average * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      grade
    }
  };
};

// ==================== STUDENT ENDPOINTS ====================

/**
 * Get student's own monthly compulsory report
 * GET /api/assessment-reports/student/monthly/compulsory
 */
exports.getStudentCompulsoryReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const studentId = req.user._id;
    
    // Get student details
    const student = await User.findById(studentId)
      .select('firstName lastName email studentId instituteId instituteName course semester class')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get institute details if available
    let institute = null;
    if (student.instituteId) {
      institute = await Institute.findOne({ instituteId: student.instituteId })
        .select('instituteName instituteId campusBackgroundImage instituteType')
        .lean();
    }

    const reportData = await getStudentMonthlyReportData(
      studentId,
      parseInt(month),
      parseInt(year),
      true // compulsory only
    );

    res.json({
      reportType: 'compulsory',
      month: parseInt(month),
      year: parseInt(year),
      student: {
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
        email: student.email,
        studentId: student.studentId,
        course: student.course,
        semester: student.semester,
        class: student.class
      },
      institute: institute ? {
        name: institute.instituteName,
        id: institute.instituteId,
        logo: institute.campusBackgroundImage,
        type: institute.instituteType
      } : null,
      ...reportData
    });
  } catch (error) {
    console.error('[AssessmentReports] Error fetching student compulsory report:', error);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
};

/**
 * Get student's own monthly overall report
 * GET /api/assessment-reports/student/monthly/overall
 */
exports.getStudentOverallReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    const studentId = req.user._id;
    
    // Get student details
    const student = await User.findById(studentId)
      .select('firstName lastName email studentId instituteId instituteName course semester class')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get institute details if available
    let institute = null;
    if (student.instituteId) {
      institute = await Institute.findOne({ instituteId: student.instituteId })
        .select('instituteName instituteId campusBackgroundImage instituteType')
        .lean();
    }

    const reportData = await getStudentMonthlyReportData(
      studentId,
      parseInt(month),
      parseInt(year),
      false // all assessments
    );

    res.json({
      reportType: 'overall',
      month: parseInt(month),
      year: parseInt(year),
      student: {
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
        email: student.email,
        studentId: student.studentId,
        course: student.course,
        semester: student.semester,
        class: student.class
      },
      institute: institute ? {
        name: institute.instituteName,
        id: institute.instituteId,
        logo: institute.campusBackgroundImage,
        type: institute.instituteType
      } : null,
      ...reportData
    });
  } catch (error) {
    console.error('[AssessmentReports] Error fetching student overall report:', error);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
};

/**
 * Get student's report summary (months with data available)
 * GET /api/assessment-reports/student/summary
 */
exports.getStudentReportSummary = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find all months where student has attempts
    const attempts = await AssessmentAttempt.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: { $in: ['submitted', 'auto-submitted'] },
          submittedAt: { $ne: null }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          totalAttempts: { $sum: 1 },
          compulsoryAttempts: {
            $sum: { $cond: ['$isCompulsoryForStudent', 1, 0] }
          }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    const availableMonths = attempts.map(a => ({
      year: a._id.year,
      month: a._id.month,
      totalAttempts: a.totalAttempts,
      compulsoryAttempts: a.compulsoryAttempts
    }));

    res.json({ availableMonths });
  } catch (error) {
    console.error('[AssessmentReports] Error fetching student report summary:', error);
    res.status(500).json({ message: 'Failed to fetch report summary' });
  }
};

// ==================== CAMPUS AMBASSADOR ENDPOINTS ====================

/**
 * Get a specific student's report (for campus ambassador)
 * GET /api/assessment-reports/campus-ambassador/student/:studentId/monthly
 */
exports.getStudentReportForAmbassador = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year, type = 'overall' } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Verify student belongs to ambassador's institute
    const student = await User.findById(studentId)
      .select('firstName lastName email studentId instituteId instituteName course semester class')
      .lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get ambassador's institutes
    const ambassadorInstitutes = await Institute.find({ campusAmbassador: req.user._id })
      .select('instituteId instituteName campusBackgroundImage instituteType')
      .lean();

    const ambassadorInstituteIds = ambassadorInstitutes.map(i => i.instituteId);

    if (!student.instituteId || !ambassadorInstituteIds.includes(student.instituteId)) {
      return res.status(403).json({ message: 'Student does not belong to your institute' });
    }

    const institute = ambassadorInstitutes.find(i => i.instituteId === student.instituteId);

    const reportData = await getStudentMonthlyReportData(
      studentId,
      parseInt(month),
      parseInt(year),
      type === 'compulsory'
    );

    res.json({
      reportType: type,
      month: parseInt(month),
      year: parseInt(year),
      student: {
        _id: studentId,
        name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
        email: student.email,
        studentId: student.studentId,
        course: student.course,
        semester: student.semester,
        class: student.class
      },
      institute: institute ? {
        name: institute.instituteName,
        id: institute.instituteId,
        logo: institute.campusBackgroundImage,
        type: institute.instituteType
      } : null,
      ...reportData
    });
  } catch (error) {
    console.error('[AssessmentReports] Error fetching student report for ambassador:', error);
    res.status(500).json({ message: 'Failed to fetch report' });
  }
};

/**
 * Get all students' reports for an institute with filters
 * GET /api/assessment-reports/campus-ambassador/institute/:instituteId/students
 */
exports.getInstituteStudentsReports = async (req, res) => {
  try {
    const { instituteId } = req.params;
    const { month, year, type = 'overall', course, semester, page = 1, limit = 50 } = req.query;

    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }

    // Verify institute belongs to ambassador
    const institute = await Institute.findById(instituteId)
      .select('instituteId instituteName campusBackgroundImage instituteType courses')
      .lean();

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    // Check ownership
    const isOwner = await Institute.exists({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to access this institute' });
    }

    // Build student query
    const studentQuery = { instituteId: institute.instituteId };
    if (course && course !== 'all') {
      studentQuery.course = course;
    }
    if (semester && semester !== 'all') {
      studentQuery.semester = parseInt(semester);
    }

    // Get students
    const students = await User.find(studentQuery)
      .select('firstName lastName email studentId course semester class')
      .sort({ firstName: 1, lastName: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    const totalStudents = await User.countDocuments(studentQuery);

    // Get reports for each student
    const studentsWithReports = await Promise.all(
      students.map(async (student) => {
        const reportData = await getStudentMonthlyReportData(
          student._id,
          parseInt(month),
          parseInt(year),
          type === 'compulsory'
        );

        return {
          _id: student._id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
          email: student.email,
          studentId: student.studentId,
          course: student.course,
          semester: student.semester,
          class: student.class,
          report: reportData
        };
      })
    );

    res.json({
      institute: {
        _id: institute._id,
        name: institute.instituteName,
        id: institute.instituteId,
        type: institute.instituteType,
        courses: institute.courses || []
      },
      reportType: type,
      month: parseInt(month),
      year: parseInt(year),
      filters: { course, semester },
      students: studentsWithReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalStudents,
        pages: Math.ceil(totalStudents / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[AssessmentReports] Error fetching institute students reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

/**
 * Get bulk report data for PDF generation
 * POST /api/assessment-reports/campus-ambassador/bulk
 */
exports.getBulkReportData = async (req, res) => {
  try {
    const { instituteId, month, year, type = 'overall', course, semester } = req.body;

    if (!instituteId || !month || !year) {
      return res.status(400).json({ message: 'Institute ID, month, and year are required' });
    }

    // Verify institute belongs to ambassador
    const institute = await Institute.findById(instituteId)
      .select('instituteId instituteName campusBackgroundImage instituteType courses')
      .lean();

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    const isOwner = await Institute.exists({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to access this institute' });
    }

    // Build student query
    const studentQuery = { instituteId: institute.instituteId };
    if (course && course !== 'all') {
      studentQuery.course = course;
    }
    if (semester && semester !== 'all') {
      studentQuery.semester = parseInt(semester);
    }

    // Get all students (no pagination for bulk)
    const students = await User.find(studentQuery)
      .select('firstName lastName email studentId course semester class')
      .sort({ course: 1, semester: 1, firstName: 1, lastName: 1 })
      .lean();

    // Get reports for each student
    const studentsWithReports = await Promise.all(
      students.map(async (student) => {
        const reportData = await getStudentMonthlyReportData(
          student._id,
          parseInt(month),
          parseInt(year),
          type === 'compulsory'
        );

        return {
          _id: student._id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown',
          email: student.email,
          studentId: student.studentId,
          course: student.course,
          semester: student.semester,
          class: student.class,
          report: reportData
        };
      })
    );

    // Filter out students with no tests
    const studentsWithTests = studentsWithReports.filter(s => s.report.tests.length > 0);

    res.json({
      institute: {
        _id: institute._id,
        name: institute.instituteName,
        id: institute.instituteId,
        logo: institute.campusBackgroundImage,
        type: institute.instituteType
      },
      reportType: type,
      month: parseInt(month),
      year: parseInt(year),
      filters: { course, semester },
      students: studentsWithTests,
      totalStudents: studentsWithTests.length
    });
  } catch (error) {
    console.error('[AssessmentReports] Error fetching bulk report data:', error);
    res.status(500).json({ message: 'Failed to fetch bulk report data' });
  }
};

/**
 * Get available courses and semesters for filters
 * GET /api/assessment-reports/campus-ambassador/institute/:instituteId/filters
 */
exports.getReportFilters = async (req, res) => {
  try {
    const { instituteId } = req.params;

    // Verify institute belongs to ambassador
    const institute = await Institute.findById(instituteId)
      .select('instituteId instituteName instituteType courses')
      .lean();

    if (!institute) {
      return res.status(404).json({ message: 'Institute not found' });
    }

    const isOwner = await Institute.exists({
      _id: instituteId,
      campusAmbassador: req.user._id
    });

    if (!isOwner) {
      return res.status(403).json({ message: 'Not authorized to access this institute' });
    }

    // Get unique courses and semesters from students
    const coursesAgg = await User.aggregate([
      { $match: { instituteId: institute.instituteId } },
      {
        $group: {
          _id: null,
          courses: { $addToSet: '$course' },
          semesters: { $addToSet: '$semester' },
          classes: { $addToSet: '$class' }
        }
      }
    ]);

    const filters = coursesAgg[0] || { courses: [], semesters: [], classes: [] };

    // Get available months with data
    const monthsAgg = await AssessmentAttempt.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      { $match: { 'student.instituteId': institute.instituteId } },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);

    const availableMonths = monthsAgg.map(m => ({
      year: m._id.year,
      month: m._id.month
    }));

    res.json({
      institute: {
        _id: institute._id,
        name: institute.instituteName,
        type: institute.instituteType
      },
      courses: (filters.courses || []).filter(Boolean).sort(),
      semesters: (filters.semesters || []).filter(Boolean).sort((a, b) => a - b),
      classes: (filters.classes || []).filter(Boolean).sort(),
      availableMonths
    });
  } catch (error) {
    console.error('[AssessmentReports] Error fetching report filters:', error);
    res.status(500).json({ message: 'Failed to fetch filters' });
  }
};

module.exports = exports;

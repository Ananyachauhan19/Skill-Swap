const QuizementAttempt = require('../models/QuizementAttempt');
const QuizementTest = require('../models/QuizementTest');
const ActivityLog = require('../models/ActivityLog');
const CampusAmbassador = require('../models/CampusAmbassador');

// Get user's quiz attempt history
exports.getQuizementHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const attempts = await QuizementAttempt.find({
      userId,
      finished: true
    })
    .populate('testId', 'name description course category duration totalMarks questions isWeeklyQuiz')
    .sort({ finishedAt: -1 })
    .lean();

    const history = attempts.map(attempt => {
      const test = attempt.testId;
      const totalQuestions = test?.questions?.length || 0;
      const correctAnswers = attempt.answers?.filter((answer, idx) => {
        const question = test?.questions?.[answer.questionIndex];
        return question && answer.selectedAnswer === question.correctAnswer;
      }).length || 0;
      const wrongAnswers = totalQuestions - correctAnswers;
      
      // Calculate time taken
      let timeTaken = null;
      if (attempt.startedAt && attempt.finishedAt) {
        const diffMs = new Date(attempt.finishedAt) - new Date(attempt.startedAt);
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        timeTaken = `${minutes}m ${seconds}s`;
      }

      return {
        _id: attempt._id,
        testId: test?._id,
        testName: test?.name || 'Unknown Test',
        category: test?.category,
        course: test?.course,
        description: test?.description,
        duration: test?.duration,
        score: attempt.score,
        totalMarks: attempt.totalMarks || test?.totalMarks || 0,
        marksObtained: attempt.score,
        percentage: attempt.percentage,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        timeTaken,
        completedAt: attempt.finishedAt,
        startedAt: attempt.startedAt,
        finishedAt: attempt.finishedAt,
        isWeekly: test?.isWeeklyQuiz || false,
        violations: attempt.violations?.length || 0,
        createdAt: attempt.createdAt
      };
    });

    return res.json(history);
  } catch (error) {
    console.error('Error fetching quizement history:', error);
    return res.status(500).json({ message: 'Failed to fetch quiz history' });
  }
};

// Get user's contribution events for calendar
exports.getContributionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const ContributionEvent = require('../models/ContributionEvent');

    // Get all contribution events for the user
    const contributions = await ContributionEvent.find({ userId })
      .sort({ dateKey: -1 })
      .lean();

    // Group by date and count
    const contributionMap = {};
    contributions.forEach(event => {
      if (!contributionMap[event.dateKey]) {
        contributionMap[event.dateKey] = {
          dateKey: event.dateKey,
          count: 0,
          events: []
        };
      }
      contributionMap[event.dateKey].count++;
      contributionMap[event.dateKey].events.push({
        key: event.key,
        createdAt: event.createdAt
      });
    });

    const result = Object.values(contributionMap);
    return res.json(result);
  } catch (error) {
    console.error('Error fetching contribution history:', error);
    return res.status(500).json({ message: 'Failed to fetch contribution history' });
  }
};

// Get interview history (teaching and learning)
exports.getInterviewHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const InterviewRequest = require('../models/InterviewRequest');

    const interviews = await InterviewRequest.find({
      $or: [
        { interviewerId: userId },
        { requestedBy: userId }
      ],
      status: { $in: ['scheduled', 'completed', 'cancelled'] }
    })
    .populate('interviewerId', 'firstName lastName username')
    .populate('requestedBy', 'firstName lastName username')
    .sort({ scheduledAt: -1 })
    .lean();

    const history = interviews.map(interview => {
      const isInterviewer = interview.interviewerId._id.toString() === userId.toString();
      
      return {
        id: interview._id,
        role: isInterviewer ? 'interviewer' : 'candidate',
        position: interview.position || interview.jobTitle,
        candidateName: isInterviewer 
          ? `${interview.requestedBy.firstName} ${interview.requestedBy.lastName}`
          : `${interview.interviewerId.firstName} ${interview.interviewerId.lastName}`,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration,
        status: interview.status,
        meetLink: interview.meetLink,
        createdAt: interview.createdAt
      };
    });

    return res.json(history);
  } catch (error) {
    console.error('Error fetching interview history:', error);
    return res.status(500).json({ message: 'Failed to fetch interview history' });
  }
};

// Get campus ambassador activity history
exports.getCampusAmbassadorHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user is a campus ambassador
    const ambassador = await CampusAmbassador.findOne({ user: userId });
    if (!ambassador) {
      return res.json([]); // Return empty array if not an ambassador
    }

    // Get activity logs
    const activities = await ActivityLog.find({ ambassadorId: ambassador._id })
      .sort({ performedAt: -1 })
      .limit(100) // Limit to last 100 activities
      .lean();

    const history = activities.map(activity => ({
      id: activity._id,
      actionType: activity.actionType,
      instituteName: activity.instituteName,
      description: activity.description,
      metadata: activity.metadata,
      performedAt: activity.performedAt,
      createdAt: activity.createdAt
    }));

    return res.json(history);
  } catch (error) {
    console.error('Error fetching campus ambassador history:', error);
    return res.status(500).json({ message: 'Failed to fetch campus ambassador history' });
  }
};

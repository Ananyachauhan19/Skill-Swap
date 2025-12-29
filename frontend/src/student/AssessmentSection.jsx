import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Award, CheckCircle, Play, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const AssessmentSection = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, available, attempted
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/student/assessments`,
        { withCredentials: true }
      );
      setAssessments(response.data.assessments);
    } catch (error) {
      console.error('Fetch assessments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttempt = (assessment) => {
    setSelectedAssessment(assessment);
    setShowRulesModal(true);
  };

  const startAssessment = () => {
    setShowRulesModal(false);
    navigate(`/student/assessment-attempt/${selectedAssessment._id}`);
  };

  const viewResult = (assessmentId) => {
    navigate(`/student/assessment-result/${assessmentId}`);
  };

  const filteredAssessments = assessments.filter(a => {
    if (filter === 'available') return !a.hasAttempted;
    if (filter === 'attempted') return a.hasAttempted;
    if (filter === 'compulsory') return a.isCompulsory && !a.hasAttempted;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const availableCount = assessments.filter(a => !a.hasAttempted).length;
  const attemptedCount = assessments.filter(a => a.hasAttempted).length;
  const compulsoryCount = assessments.filter(a => a.isCompulsory && !a.hasAttempted).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total Assessments</p>
              <p className="text-3xl font-bold mt-1">{assessments.length}</p>
            </div>
            <FileText className="h-12 w-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Available</p>
              <p className="text-3xl font-bold mt-1">{availableCount}</p>
            </div>
            <Play className="h-12 w-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Completed</p>
              <p className="text-3xl font-bold mt-1">{attemptedCount}</p>
            </div>
            <CheckCircle className="h-12 w-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({assessments.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'available'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available ({availableCount})
          </button>
          {compulsoryCount > 0 && (
            <button
              onClick={() => setFilter('compulsory')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'compulsory'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              🔴 Compulsory ({compulsoryCount})
            </button>
          )}
          <button
            onClick={() => setFilter('attempted')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'attempted'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Attempted ({attemptedCount})
          </button>
        </div>
      </div>

      {/* Assessment Cards */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {filter === 'available' ? 'No Available Assessments' : 'No Assessments Found'}
          </h3>
          <p className="text-gray-500">
            {filter === 'available'
              ? 'All assessments have been attempted'
              : 'Check back later for new assessments'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAssessments.map(assessment => (
            <div
              key={assessment._id}
              className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                assessment.isCompulsory && !assessment.hasAttempted ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{assessment.title}</h3>
                    {assessment.isCompulsory && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                        Compulsory
                      </span>
                    )}
                    {assessment.hasAttempted && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Completed
                      </span>
                    )}
                    {!assessment.isWithinTimeWindow && assessment.startTime && (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                        Time Limited
                      </span>
                    )}
                  </div>

                  {assessment.description && (
                    <p className="text-gray-600 text-sm mb-4">{assessment.description}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Questions</p>
                        <p className="text-sm font-semibold text-gray-800">{assessment.questionCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-semibold text-gray-800">{assessment.duration} min</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-xs text-gray-500">Total Marks</p>
                        <p className="text-sm font-semibold text-gray-800">{assessment.totalMarks}</p>
                      </div>
                    </div>

                    {assessment.hasAttempted && (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Your Score</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {assessment.percentage?.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {assessment.hasAttempted && (
                    <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Score: {assessment.score}/{assessment.totalMarks} ({assessment.percentage?.toFixed(1)}%)
                        </p>
                        <p className="text-xs text-green-600">Status: {assessment.attemptStatus?.replace('-', ' ')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ml-6">
                  {assessment.hasAttempted ? (
                    <button
                      onClick={() => viewResult(assessment._id)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      View Result
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAttempt(assessment)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Play className="h-5 w-5" />
                      <span>Attempt</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rules Modal */}
      {showRulesModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Assessment Rules & Instructions</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">{selectedAssessment.title}</h3>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-semibold">{selectedAssessment.questionCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold">{selectedAssessment.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="font-semibold">{selectedAssessment.totalMarks}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start space-x-3">
                <span className="text-red-600 font-bold">⚠️</span>
                <p className="text-sm text-gray-700">
                  <strong>Fullscreen Mode:</strong> The test will open in fullscreen. Do not exit fullscreen during the test.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-600 font-bold">⚠️</span>
                <p className="text-sm text-gray-700">
                  <strong>No Tab Switching:</strong> Do not switch to other tabs or windows during the test.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-600 font-bold">⚠️</span>
                <p className="text-sm text-gray-700">
                  <strong>No Copy-Paste:</strong> Copy-paste functionality is disabled during the test.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-600 font-bold">⚠️</span>
                <p className="text-sm text-gray-700">
                  <strong>Violation Limit:</strong> After 3 violations, your test will be auto-submitted.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-600 font-bold">ℹ️</span>
                <p className="text-sm text-gray-700">
                  <strong>Timer:</strong> A countdown timer will be displayed. Submit before time runs out.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-blue-600 font-bold">ℹ️</span>
                <p className="text-sm text-gray-700">
                  <strong>One Attempt Only:</strong> You can only attempt this assessment once.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800 font-semibold">
                By clicking "Start Test", you agree to follow all the rules and guidelines mentioned above.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowRulesModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startAssessment}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                I Agree - Start Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentSection;

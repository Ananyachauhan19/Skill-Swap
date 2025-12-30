import React, { useState, useEffect } from 'react';
import { Trash2, Eye, ToggleLeft, ToggleRight, FileText, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const AssessmentList = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/api/campus-ambassador/assessments`,
        { withCredentials: true }
      );
      setAssessments(response.data.assessments);
      setError(null);
    } catch (err) {
      console.error('Fetch assessments error:', err);
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.patch(
        `${BACKEND_URL}/api/campus-ambassador/assessments/${id}/toggle`,
        {},
        { withCredentials: true }
      );

      // Update local state
      setAssessments(prev =>
        prev.map(a => (a._id === id ? { ...a, isActive: response.data.isActive } : a))
      );
    } catch (err) {
      console.error('Toggle error:', err);
      alert(err.response?.data?.message || 'Failed to toggle assessment status');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(
        `${BACKEND_URL}/api/campus-ambassador/assessments/${id}`,
        { withCredentials: true }
      );

      setAssessments(prev => prev.filter(a => a._id !== id));
      alert('Assessment deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete assessment');
    }
  };

  const handlePreview = async (id) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/campus-ambassador/assessments/${id}`,
        { withCredentials: true }
      );
      setSelectedAssessment(response.data.assessment);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview error:', err);
      alert('Failed to load assessment details');
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedAssessment(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Assessments Yet</h3>
        <p className="text-gray-500">Create your first assessment by uploading an Excel file.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {assessments.map(assessment => (
          <div
            key={assessment._id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{assessment.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      assessment.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {assessment.isActive ? 'Active' : 'Inactive'}
                  </span>
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
                    <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="text-sm font-semibold text-gray-800">{assessment.duration} min</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500">Total Marks</p>
                      <p className="text-sm font-semibold text-gray-800">{assessment.totalMarks}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">Attempts</p>
                      <p className="text-sm font-semibold text-gray-800">{assessment.attemptsCount}</p>
                    </div>
                  </div>
                </div>

                {assessment.attemptsCount > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-xs text-gray-500">Average Score</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {assessment.averageScore.toFixed(2)} / {assessment.totalMarks} (
                        {((assessment.averageScore / assessment.totalMarks) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {assessment.collegeConfigs?.length > 0 ? (
                    assessment.collegeConfigs.map((config, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 bg-blue-50 text-blue-800 text-xs rounded-lg border border-blue-200"
                      >
                        <div className="font-semibold">{config.collegeName}</div>
                        <div className="text-xs mt-1">
                          <span className="font-medium">Course:</span> {config.courseId}
                        </div>
                        <div className="text-xs mt-0.5">
                          <span className="font-medium">Compulsory:</span> Sem {config.compulsorySemesters.join(', ')}
                        </div>
                      </div>
                    ))
                  ) : (
                    assessment.institutes?.map(institute => (
                      <span
                        key={institute._id}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                      >
                        {institute.instituteName || institute.name}
                      </span>
                    ))
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  Created: {new Date(assessment.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handlePreview(assessment._id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Preview"
                >
                  <Eye className="h-5 w-5" />
                </button>

                <button
                  onClick={() => handleToggleStatus(assessment._id)}
                  className={`p-2 rounded-lg transition-colors ${
                    assessment.isActive
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title={assessment.isActive ? 'Deactivate' : 'Activate'}
                >
                  {assessment.isActive ? (
                    <ToggleRight className="h-5 w-5" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(assessment._id, assessment.title)}
                  disabled={assessment.attemptsCount > 0}
                  className={`p-2 rounded-lg transition-colors ${
                    assessment.attemptsCount > 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={
                    assessment.attemptsCount > 0
                      ? 'Cannot delete - has attempts'
                      : 'Delete'
                  }
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{selectedAssessment.title}</h2>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {selectedAssessment.description && (
                <p className="text-gray-600">{selectedAssessment.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold">{selectedAssessment.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Questions</p>
                  <p className="font-semibold">{selectedAssessment.questions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="font-semibold">{selectedAssessment.totalMarks}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Questions:</h3>
                <div className="space-y-4">
                  {selectedAssessment.questions.map((q, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <p className="font-medium text-gray-800">
                          {index + 1}. {q.questionText}
                        </p>
                        <span className="text-sm text-blue-600 font-semibold ml-2">
                          {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((option, optIdx) => {
                          const label = ['A', 'B', 'C', 'D'][optIdx];
                          const isCorrect = q.correctAnswer === label;
                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded ${
                                isCorrect
                                  ? 'bg-green-50 border-2 border-green-500'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <span className="font-semibold mr-2">{label}.</span>
                              <span>{option}</span>
                              {isCorrect && (
                                <span className="ml-2 text-green-600 text-sm font-semibold">✓ Correct</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentList;

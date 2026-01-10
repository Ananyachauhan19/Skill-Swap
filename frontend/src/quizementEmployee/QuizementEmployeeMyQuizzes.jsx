import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, ToggleLeft, ToggleRight, FileText, Users, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const QuizementEmployeeMyQuizzes = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/quizement-employee/quizzes/mine`, {
        withCredentials: true,
      });
      setQuizzes(res.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const response = await axios.patch(
        `${BACKEND_URL}/api/quizement-employee/quizzes/${id}/toggle`,
        {},
        { withCredentials: true }
      );

      setQuizzes(prev =>
        prev.map(q => (q._id === id ? { ...q, isActive: response.data.isActive } : q))
      );
    } catch (err) {
      console.error('Toggle error:', err);
      alert(err.response?.data?.message || 'Failed to toggle quiz status');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(
        `${BACKEND_URL}/api/quizement-employee/quizzes/${id}`,
        { withCredentials: true }
      );

      setQuizzes(prev => prev.filter(q => q._id !== id));
      alert('Quiz deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  const handlePreview = async (id) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/quizement-employee/quizzes/${id}`,
        { withCredentials: true }
      );
      setSelectedQuiz(response.data);
      setShowPreview(true);
    } catch (err) {
      console.error('Preview error:', err);
      alert('Failed to load quiz details');
    }
  };

  const closePreview = () => {
    setShowPreview(false);
    setSelectedQuiz(null);
  };

  const viewResults = (id) => {
    navigate(`/quizement-employee/results?quizId=${id}`);
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Quizzes</h1>
          <p className="text-sm text-gray-600 mt-1">
            View and manage all quizzes you have created.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/quizement-employee/create-quiz')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700"
        >
          + Create New Quiz
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-gray-200">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Quizzes Yet</h3>
          <p className="text-gray-500 mb-4">Create your first quiz by uploading an Excel file.</p>
          <button
            onClick={() => navigate('/quizement-employee/create-quiz')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Create Quiz
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {quizzes.map(quiz => (
              <div
                key={quiz._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{quiz.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {quiz.description && (
                      <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Total Marks</p>
                          <p className="text-sm font-semibold text-gray-800">{quiz.totalMarks}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="text-sm font-semibold text-gray-800">{quiz.duration} min</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Attempts</p>
                          <p className="text-sm font-semibold text-gray-800">{quiz.attemptCount || 0}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-xs text-gray-500">Created</p>
                          <p className="text-sm font-semibold text-gray-800">
                            {new Date(quiz.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handlePreview(quiz._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-5 w-5" />
                    </button>

                    {quiz.attemptCount > 0 && (
                      <button
                        onClick={() => viewResults(quiz._id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Results"
                      >
                        <TrendingUp className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleStatus(quiz._id)}
                      className={`p-2 rounded-lg transition-colors ${
                        quiz.isActive
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      title={quiz.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {quiz.isActive ? (
                        <ToggleRight className="h-5 w-5" />
                      ) : (
                        <ToggleLeft className="h-5 w-5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(quiz._id, quiz.title)}
                      disabled={quiz.attemptCount > 0}
                      className={`p-2 rounded-lg transition-colors ${
                        quiz.attemptCount > 0
                          ? 'text-gray-300 cursor-not-allowed'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                      title={
                        quiz.attemptCount > 0
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
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{selectedQuiz.title}</h2>
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
              {selectedQuiz.description && (
                <p className="text-gray-600">{selectedQuiz.description}</p>
              )}

              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold">{selectedQuiz.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Questions</p>
                  <p className="font-semibold">{selectedQuiz.questions?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Marks</p>
                  <p className="font-semibold">{selectedQuiz.totalMarks}</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Questions:</h3>
                <div className="space-y-4">
                  {selectedQuiz.questions?.map((q, index) => (
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
                        {['A', 'B', 'C', 'D'].map((label, idx) => {
                          const optionText = q.options?.[idx] || '';
                          const isCorrect = q.correctAnswer === label;
                          return (
                            <div
                              key={label}
                              className={`p-3 rounded ${
                                isCorrect
                                  ? 'bg-green-50 border-2 border-green-500'
                                  : 'bg-gray-50 border border-gray-200'
                              }`}
                            >
                              <span className="font-semibold mr-2">{label}.</span>
                              <span>{optionText}</span>
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

export default QuizementEmployeeMyQuizzes;
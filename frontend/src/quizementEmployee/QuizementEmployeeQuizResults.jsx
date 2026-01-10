import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Award, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const QuizementEmployeeQuizResults = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

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

  const loadResults = async (quizId) => {
    try {
      setLoadingResults(true);
      const res = await axios.get(`${BACKEND_URL}/api/quizement-employee/quizzes/${quizId}/results`, {
        withCredentials: true,
      });
      setResults(res.data);
      setSelectedQuiz(quizId);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load results');
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !quizzes.length) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  // If no quiz is selected, show quiz list
  if (!selectedQuiz) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
          <p className="text-sm text-gray-600 mt-1">Select a quiz to view detailed results and user attempts</p>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-600">No quizzes found. Create a quiz first.</p>
            <button
              onClick={() => navigate('/quizement-employee/create')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {quizzes.map((quiz) => (
              <button
                key={quiz._id}
                onClick={() => loadResults(quiz._id)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{quiz.title || quiz.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        quiz.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{quiz.description}</p>
                    <div className="flex items-center gap-6 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span className="font-semibold">{quiz.attemptCount || 0}</span> attempts
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span className="font-semibold">{quiz.totalMarks}</span> marks
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">{quiz.duration}</span> min
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show results for selected quiz
  if (loadingResults) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  const { quiz, stats, attempts } = results;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => {
            setSelectedQuiz(null);
            setResults(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-3"
        >
          ← Back to Quiz List
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
        <p className="text-sm text-gray-600 mt-1">Quiz Results & Statistics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Total Attempts</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Average Score</p>
          <p className="text-2xl font-bold text-gray-900">
            {stats.averageScore.toFixed(2)} / {quiz.totalMarks}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {((stats.averageScore / quiz.totalMarks) * 100).toFixed(1)}% average
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Highest Score</p>
          <p className="text-2xl font-bold text-gray-900">{stats.highestScore} / {quiz.totalMarks}</p>
          <p className="text-xs text-gray-600 mt-1">
            {stats.totalAttempts > 0 ? ((stats.highestScore / quiz.totalMarks) * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="text-2xl font-bold text-gray-900">{quiz.duration}</p>
          <p className="text-xs text-gray-600 mt-1">minutes</p>
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">All Attempts</h2>
          <p className="text-sm text-gray-600 mt-1">{attempts.length} attempt{attempts.length !== 1 ? 's' : ''}</p>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No attempts yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Taken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map((attempt) => {
                  const percentage = parseFloat(attempt.percentage);
                  const passed = percentage >= 40;

                  return (
                    <tr key={attempt._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attempt.userName}
                          </div>
                          <div className="text-sm text-gray-500">{attempt.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {attempt.score} / {attempt.totalMarks}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-semibold text-gray-900 mr-2">
                            {attempt.percentage}%
                          </div>
                          {passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Math.floor(attempt.timeTaken / 60)} min {attempt.timeTaken % 60} sec
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(attempt.completedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.violationDetected ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Violation
                          </span>
                        ) : (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            passed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {passed ? 'Passed' : 'Failed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizementEmployeeQuizResults;
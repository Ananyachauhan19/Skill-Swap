import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Award, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const QuizementResult = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadResult();
  }, [testId]);

  const loadResult = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/quizement/tests/${testId}/result`,
        { withCredentials: true }
      );
      setResult(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Load result error:', err);
      setError(err.response?.data?.message || 'Failed to load result');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-home-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-sm font-semibold text-slate-800">Loading result...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-home-bg flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate('/quizement/tests')}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const { test, attempt } = result;
  const percentage = attempt.percentage || 0;
  const passed = percentage >= 50;

  return (
    <div className="min-h-screen bg-home-bg py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/quizement/tests')}
            className="flex items-center gap-2 text-blue-700 font-semibold hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900">{test.name}</h1>
          <p className="text-sm text-slate-600 mt-1">{test.description}</p>
        </div>

        {/* Score Card */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {passed ? (
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {passed ? 'Test Passed!' : 'Test Completed'}
                </h2>
                <p className="text-sm text-slate-600">
                  {new Date(attempt.finishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-extrabold text-blue-700">{percentage.toFixed(1)}%</div>
              <p className="text-sm text-slate-600 mt-1">Score</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Award className="h-5 w-5" />
                <span className="text-xs font-semibold">Score</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {attempt.score}/{attempt.totalMarks}
              </p>
              <p className="text-xs text-slate-600 mt-1">marks obtained</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <CheckCircle className="h-5 w-5" />
                <span className="text-xs font-semibold">Correct</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">
                {attempt.answers.filter((a, idx) => a.selectedAnswer === test.questions[idx]?.correctAnswer).length}
              </p>
              <p className="text-xs text-slate-600 mt-1">out of {test.questions.length}</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Clock className="h-5 w-5" />
                <span className="text-xs font-semibold">Duration</span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{test.duration}</p>
              <p className="text-xs text-slate-600 mt-1">minutes</p>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-extrabold text-slate-900 mb-4">Question Review</h3>
          {test.questions.map((question, idx) => {
            const userAnswer = attempt.answers[idx]?.selectedAnswer || '';
            const correctAnswer = question.correctAnswer;
            const isCorrect = userAnswer === correctAnswer;

            return (
              <div
                key={idx}
                className={`bg-white border rounded-2xl shadow-sm p-5 ${
                  isCorrect ? 'border-green-200' : 'border-red-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-blue-700">Question {idx + 1}</span>
                      {isCorrect ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Correct
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Incorrect
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{question.questionText}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700">{question.marks} marks</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {question.options.map((option, optIdx) => {
                    const label = ['A', 'B', 'C', 'D'][optIdx];
                    const isUserAnswer = userAnswer === label;
                    const isCorrectOption = correctAnswer === label;

                    return (
                      <div
                        key={optIdx}
                        className={`px-4 py-3 border rounded-xl text-sm ${
                          isCorrectOption
                            ? 'border-green-500 bg-green-50'
                            : isUserAnswer && !isCorrect
                            ? 'border-red-500 bg-red-50'
                            : 'border-blue-100 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{label}.</span>
                          <span className="text-slate-800">{option}</span>
                          {isCorrectOption && (
                            <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                          )}
                          {isUserAnswer && !isCorrect && (
                            <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  {userAnswer ? (
                    <>
                      Your answer: <span className="font-semibold text-slate-900">{userAnswer}</span>
                      {!isCorrect && (
                        <>
                          {' | '}Correct answer: <span className="font-semibold text-green-700">{correctAnswer}</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Not answered | Correct answer:{' '}
                      <span className="font-semibold text-green-700">{correctAnswer}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/quizement/tests')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Quizement Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizementResult;

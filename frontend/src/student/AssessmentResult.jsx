import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const AssessmentResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [id]);

  const fetchResult = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/student/assessments/${id}/result`,
        { withCredentials: true }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Fetch result error:', error);
      alert('Failed to load result');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!result) return null;

  const { attempt, assessment, questions } = result;
  const correctCount = questions.filter(q => q.isCorrect).length;
  const incorrectCount = questions.length - correctCount;
  const percentage = attempt.percentage;

  const getGradeColor = () => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGrade = () => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    return 'F';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-gray-600">{assessment.description}</p>
            )}
          </div>

          {/* Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white text-center">
              <p className="text-sm opacity-90 mb-2">Your Score</p>
              <p className="text-4xl font-bold">{attempt.score}/{attempt.totalMarks}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white text-center">
              <p className="text-sm opacity-90 mb-2">Percentage</p>
              <p className={`text-4xl font-bold`}>{percentage.toFixed(1)}%</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white text-center">
              <p className="text-sm opacity-90 mb-2">Grade</p>
              <p className="text-4xl font-bold">{getGrade()}</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white text-center">
              <p className="text-sm opacity-90 mb-2">Correct</p>
              <p className="text-4xl font-bold">{correctCount}/{questions.length}</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Correct</p>
                <p className="font-semibold text-gray-800">{correctCount}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs text-gray-500">Incorrect</p>
                <p className="font-semibold text-gray-800">{incorrectCount}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Time Taken</p>
                <p className="font-semibold text-gray-800">{attempt.timeTaken} min</p>
              </div>
            </div>

            {attempt.violationCount > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-xs text-gray-500">Violations</p>
                  <p className="font-semibold text-gray-800">{attempt.violationCount}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-semibold text-gray-800 capitalize">{attempt.status.replace('-', ' ')}</p>
              </div>
            </div>
          </div>

          {attempt.status === 'auto-submitted' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                This assessment was auto-submitted due to multiple violations of test rules.
              </p>
            </div>
          )}
        </div>

        {/* Detailed Answers */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Detailed Answers</h2>
          
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-6 ${
                  question.isCorrect
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">
                    {index + 1}. {question.questionText}
                  </h3>
                  <div className="ml-4 flex items-center space-x-2">
                    {question.isCorrect ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <span className={`font-semibold ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {question.earned}/{question.marks}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {question.options.map((option, optIdx) => {
                    const label = ['A', 'B', 'C', 'D'][optIdx];
                    const isCorrect = question.correctAnswer === label;
                    const isStudentAnswer = question.studentAnswer === label;

                    let bgColor = 'bg-white border-gray-200';
                    let textColor = 'text-gray-800';

                    if (isCorrect) {
                      bgColor = 'bg-green-100 border-green-500';
                      textColor = 'text-green-900';
                    } else if (isStudentAnswer && !isCorrect) {
                      bgColor = 'bg-red-100 border-red-500';
                      textColor = 'text-red-900';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 border-2 rounded ${bgColor} ${textColor}`}
                      >
                        <span className="font-semibold mr-2">{label}.</span>
                        <span>{option}</span>
                        {isCorrect && (
                          <span className="ml-2 text-green-700 font-semibold">✓ Correct Answer</span>
                        )}
                        {isStudentAnswer && !isCorrect && (
                          <span className="ml-2 text-red-700 font-semibold">✗ Your Answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!question.studentAnswer && (
                  <p className="mt-3 text-sm text-gray-600 italic">
                    You did not answer this question.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-x-4">
          <button
            onClick={() => navigate('/student/dashboard')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResult;

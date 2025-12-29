import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Flag } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const AssessmentAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [violations, setViolations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    startAssessment();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleRightClick);
      document.exitFullscreen?.();
    };
  }, []);

  const startAssessment = async () => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/student/assessments/${id}/start`,
        {},
        { withCredentials: true }
      );

      setAssessment(response.data.assessment);
      setAttemptId(response.data.attempt.id);
      startTimeRef.current = new Date(response.data.attempt.startedAt);
      
      // Initialize answers
      const initialAnswers = {};
      response.data.assessment.questions.forEach((_, index) => {
        initialAnswers[index] = '';
      });
      setAnswers(initialAnswers);

      // Set timer
      setTimeRemaining(response.data.assessment.duration * 60);
      
      // Enter fullscreen
      enterFullscreen();

      // Setup anti-cheat measures
      setupAntiCheat();

      setLoading(false);
    } catch (error) {
      console.error('Start assessment error:', error);
      alert(error.response?.data?.message || 'Failed to start assessment');
      navigate('/student/dashboard');
    }
  };

  const setupAntiCheat = () => {
    // Prevent right-click
    document.addEventListener('contextmenu', handleRightClick);
    
    // Detect tab switch / window blur
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    
    // Detect fullscreen exit
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Prevent copy-paste
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
  };

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    }
  };

  const logViolation = async (type) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/student/assessments/${id}/violation`,
        { type },
        { withCredentials: true }
      );

      setViolations(response.data.violationCount);
      
      if (response.data.autoSubmitted) {
        alert('Too many violations detected. Your assessment has been auto-submitted.');
        navigate(`/student/assessment-result/${id}`);
      } else {
        showWarning(`Warning ${response.data.violationCount}/3: ${getViolationMessage(type)}`);
      }
    } catch (error) {
      console.error('Log violation error:', error);
    }
  };

  const getViolationMessage = (type) => {
    const messages = {
      'tab-switch': 'Do not switch tabs during the test',
      'fullscreen-exit': 'Do not exit fullscreen mode',
      'right-click': 'Right-click is disabled',
      'copy-paste': 'Copy-paste is not allowed',
      'window-blur': 'Stay focused on the test window'
    };
    return messages[type] || 'Suspicious activity detected';
  };

  const showWarning = (message) => {
    setWarningMessage(message);
    setTimeout(() => setWarningMessage(''), 5000);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    logViolation('right-click');
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      logViolation('tab-switch');
    }
  };

  const handleWindowBlur = () => {
    logViolation('window-blur');
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      logViolation('fullscreen-exit');
      // Try to re-enter fullscreen
      setTimeout(enterFullscreen, 1000);
    }
  };

  const handleCopyPaste = (e) => {
    e.preventDefault();
    logViolation('copy-paste');
  };

  // Timer countdown
  useEffect(() => {
    if (!assessment || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [assessment]);

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleAutoSubmit = () => {
    submitAssessment();
  };

  const submitAssessment = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      // Convert answers object to array format
      const answersArray = Object.entries(answers).map(([questionIndex, selectedAnswer]) => ({
        questionIndex: parseInt(questionIndex),
        selectedAnswer
      }));

      await axios.post(
        `${BACKEND_URL}/api/student/assessments/${id}/submit`,
        { answers: answersArray },
        { withCredentials: true }
      );

      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      document.exitFullscreen?.().catch(() => {});

      // Navigate to results
      navigate(`/student/assessment-result/${id}`);
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.response?.data?.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.values(answers).filter(a => a !== '').length;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const answeredCount = getAnsweredCount();
  const totalQuestions = assessment.questions.length;
  const isTimeRunningOut = timeRemaining < 300; // Less than 5 minutes

  return (
    <div className="fixed inset-0 bg-gray-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{assessment.title}</h1>
              <p className="text-sm text-gray-600">
                Question {answeredCount} / {totalQuestions} answered
              </p>
            </div>

            <div className="flex items-center space-x-6">
              {/* Violation Counter */}
              {violations > 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Violations: {violations}/3</span>
                </div>
              )}

              {/* Timer */}
              <div className={`flex items-center space-x-2 ${isTimeRunningOut ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                <Clock className="h-6 w-6" />
                <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitClick}
                disabled={submitting}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      {warningMessage && (
        <div className="bg-red-600 text-white px-4 py-3 text-center font-semibold animate-pulse">
          <AlertTriangle className="inline h-5 w-5 mr-2" />
          {warningMessage}
        </div>
      )}

      {/* Questions */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {assessment.questions.map((question, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex-1">
                  {index + 1}. {question.questionText}
                </h3>
                <div className="ml-4 flex items-center space-x-2">
                  <span className="text-sm text-blue-600 font-semibold">
                    {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
                  </span>
                  {answers[index] && (
                    <Flag className="h-5 w-5 text-green-600" fill="currentColor" />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {question.options.map((option, optIdx) => {
                  const label = ['A', 'B', 'C', 'D'][optIdx];
                  const isSelected = answers[index] === label;

                  return (
                    <label
                      key={optIdx}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={label}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(index, label)}
                        className="mr-3"
                      />
                      <span className="font-semibold mr-2">{label}.</span>
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmitClick}
            disabled={submitting}
            className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Submit Assessment?</h3>
            <p className="text-gray-600 mb-2">
              You have answered {answeredCount} out of {totalQuestions} questions.
            </p>
            {answeredCount < totalQuestions && (
              <p className="text-red-600 font-semibold mb-4">
                ⚠️ You have {totalQuestions - answeredCount} unanswered question(s).
              </p>
            )}
            <p className="text-gray-600 mb-6">
              Once submitted, you cannot change your answers. Are you sure you want to submit?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  submitAssessment();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentAttempt;

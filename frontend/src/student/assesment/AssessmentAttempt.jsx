import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Flag } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../config.js';
import { useAuth } from '../../context/AuthContext.jsx';

const AssessmentAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [violations, setViolations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const isSubmittingRef = useRef(false); // Flag to prevent violation during submission
  const isCleanedUpRef = useRef(false); // Flag to track if cleanup has been done

  useEffect(() => {
    startAssessment();
    return () => {
      isCleanedUpRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupAntiCheat();
      // Safely exit fullscreen if document is active
      if (document.fullscreenElement && document.fullscreenElement === document.documentElement) {
        document.exitFullscreen().catch(err => {
          console.log('Fullscreen exit on cleanup:', err);
        });
      }
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
      const initialMarked = {};
      response.data.assessment.questions.forEach((_, index) => {
        initialAnswers[index] = '';
        initialMarked[index] = false;
      });
      setAnswers(initialAnswers);
      setMarkedForReview(initialMarked);
      setCurrentQuestionIndex(0);

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

  const cleanupAntiCheat = () => {
    // Remove all anti-cheat event listeners
    document.removeEventListener('contextmenu', handleRightClick);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('copy', handleCopyPaste);
    document.removeEventListener('paste', handleCopyPaste);
  };

  const enterFullscreen = () => {
    // Don't attempt to enter fullscreen if cleaned up or submitting
    if (isCleanedUpRef.current || isSubmittingRef.current) {
      return;
    }

    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
        // Show a warning but don't log as violation on initial attempt
        if (err.message && err.message.includes('user gesture')) {
          showWarning('Please click anywhere to enable fullscreen mode');
        }
      });
    }
  };

  const logViolation = async (type) => {
    // Don't log violations if component is cleaning up or submission is in progress
    if (isCleanedUpRef.current || isSubmittingRef.current) {
      return;
    }

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
    // Don't log violation if component is cleaning up or submitting
    if (!document.fullscreenElement && !isCleanedUpRef.current && !isSubmittingRef.current) {
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

  const toggleMarkForReview = (questionIndex) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  const goToQuestion = (index) => {
    const next = Math.max(0, Math.min(index, totalQuestions - 1));
    setCurrentQuestionIndex(next);
  };

  const handlePrev = () => {
    goToQuestion(currentQuestionIndex - 1);
  };

  const handleNext = () => {
    goToQuestion(currentQuestionIndex + 1);
  };

  const handleSubmitClick = () => {
    setShowConfirmModal(true);
  };

  const handleAutoSubmit = () => {
    submitAssessment();
  };

  const handleConfirmSubmit = async () => {
    // Set flags to stop violation tracking
    isSubmittingRef.current = true;
    isCleanedUpRef.current = true;
    
    // Immediately cleanup all anti-cheat listeners to stop violation tracking
    cleanupAntiCheat();
    setShowConfirmModal(false);
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.log('Fullscreen exit error:', err);
      }
    }
    
    // Submit assessment
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
      <div className="fixed inset-0 bg-home-bg flex items-center justify-center">
        <div className="text-slate-800 text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-sm font-semibold">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) return null;

  const answeredCount = getAnsweredCount();
  const totalQuestions = assessment.questions.length;
  const isTimeRunningOut = timeRemaining < 300; // Less than 5 minutes
  const currentQuestion = assessment.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const isCurrentAnswered = Boolean(currentAnswer);
  const isCurrentMarked = Boolean(markedForReview[currentQuestionIndex]);

  const userDisplayName =
    (user && (`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username)) || 'Student';
  const userInitials = (userDisplayName || 'S')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const subjectLine = (assessment.description || '').trim();

  return (
    <div className="fixed inset-0 bg-home-bg overflow-hidden">
      {/* Warning Banner */}
      {warningMessage && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold animate-pulse">
          <AlertTriangle className="inline h-4 w-4 mr-2" />
          {warningMessage}
        </div>
      )}

      {/* Two-section Layout */}
      <div className="h-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-5">
        <div className="h-full grid grid-cols-12 gap-5">
          {/* Main Content (Left) */}
          <main className="col-span-12 lg:col-span-8 h-full flex flex-col min-h-0">
            {/* Main Header */}
            <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">
                    {assessment.title}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 truncate">
                    {subjectLine || 'Assessment'}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Question <span className="font-semibold text-slate-900">{currentQuestionIndex + 1}</span> of{' '}
                    <span className="font-semibold text-slate-900">{totalQuestions}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    Answered <span className="font-semibold text-slate-900">{answeredCount}</span>/{totalQuestions}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3 sm:gap-4">
                  <img
                    src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
                    alt="SkillSwapHub"
                    className="hidden sm:block h-9 w-9 rounded-xl border border-blue-100 bg-white p-1 object-contain"
                    loading="lazy"
                  />
                  {violations > 0 && (
                    <div className="hidden sm:flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-sm font-semibold">{violations}/3</span>
                    </div>
                  )}

                  <div className={`flex items-center gap-2 ${isTimeRunningOut ? 'text-red-600 animate-pulse' : 'text-blue-700'}`}>
                    <Clock className="h-5 w-5" />
                    <span className="text-lg sm:text-xl font-extrabold tabular-nums">{formatTime(timeRemaining)}</span>
                  </div>

                  <button
                    onClick={handleSubmitClick}
                    disabled={submitting}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Test'}
                  </button>
                </div>
              </div>
            </div>

            {/* Question Panel */}
            <div className="mt-4 flex-1 min-h-0 bg-white border border-blue-100 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">Question {currentQuestionIndex + 1}</p>
                  <h3 className="mt-1 text-sm sm:text-base font-semibold text-slate-900 leading-relaxed">
                    {currentQuestion?.questionText}
                  </h3>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-xs font-semibold text-slate-700">
                    {currentQuestion?.marks} {currentQuestion?.marks === 1 ? 'mark' : 'marks'}
                  </p>
                  <div className="mt-2 flex justify-end">
                    {isCurrentMarked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold">
                        <Flag className="h-3.5 w-3.5" />
                        Marked
                      </span>
                    ) : isCurrentAnswered ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-semibold">
                        <Flag className="h-3.5 w-3.5" />
                        Answered
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {currentQuestion?.options?.map((option, optIdx) => {
                  const label = ['A', 'B', 'C', 'D'][optIdx];
                  const isSelected = currentAnswer === label;
                  return (
                    <label
                      key={optIdx}
                      className={`block px-4 py-3 border rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-blue-100 bg-white hover:bg-blue-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestionIndex}`}
                        value={label}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(currentQuestionIndex, label)}
                        className="mr-3"
                      />
                      <span className="text-sm font-extrabold text-slate-800 mr-2">{label}.</span>
                      <span className="text-sm text-slate-800 leading-relaxed">{option}</span>
                    </label>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="mt-auto pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-semibold text-slate-800 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === totalQuestions - 1}
                    className="px-4 py-2.5 rounded-xl border border-blue-200 bg-white text-sm font-semibold text-slate-800 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <button
                    onClick={() => toggleMarkForReview(currentQuestionIndex)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                      isCurrentMarked
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-blue-200 bg-white text-slate-800 hover:bg-blue-50'
                    }`}
                  >
                    Mark for Review
                  </button>
                  <button
                    onClick={handleSubmitClick}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </main>

          {/* Sidebar (Right) */}
          <aside className="col-span-12 lg:col-span-4 h-full min-h-0">
            <div className="h-full bg-white border border-blue-100 rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col overflow-hidden">
              {/* Profile */}
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 font-extrabold">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 truncate">{userDisplayName}</p>
                  <p className="text-xs text-slate-600 truncate">Student</p>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-extrabold text-slate-900">Legend</p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-green-500" />
                    Correct (after submit)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-blue-800" />
                    Answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-white border border-blue-200" />
                    Not Answered
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full bg-amber-400" />
                    Marked
                  </div>
                </div>
              </div>

              {/* Question Palette (no internal scroll) */}
              <div className="mt-4 flex-1 min-h-0">
                <p className="text-xs font-extrabold text-slate-900">Questions</p>
                <div className="mt-3 grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-8 gap-2">
                  {assessment.questions.map((_, idx) => {
                    const isAnswered = Boolean(answers[idx]);
                    const isActive = idx === currentQuestionIndex;
                    const isMarked = Boolean(markedForReview[idx]);
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`relative h-8 w-8 rounded-full border text-[11px] font-extrabold transition-colors ${
                          isAnswered
                            ? 'bg-blue-800 border-blue-800 text-white'
                            : 'bg-white border-blue-200 text-slate-700 hover:bg-blue-50'
                        } ${isActive ? 'ring-2 ring-blue-300 ring-offset-2 ring-offset-white' : ''}`}
                        aria-label={`Question ${idx + 1}`}
                      >
                        {idx + 1}
                        {isMarked ? (
                          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 border border-white" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-3">
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    <span className="font-semibold text-slate-900">Blue</span> = attempted,{' '}
                    <span className="font-semibold text-slate-900">white</span> = not attempted.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-blue-100/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm max-w-md w-full p-6">
            <h3 className="text-lg font-extrabold mb-3 text-slate-900">Submit Assessment?</h3>
            <p className="text-sm text-slate-700 mb-2">
              You have answered {answeredCount} out of {totalQuestions} questions.
            </p>
            {answeredCount < totalQuestions && (
              <p className="text-sm text-red-700 font-semibold mb-3">
                You have {totalQuestions - answeredCount} unanswered question(s).
              </p>
            )}
            <p className="text-sm text-slate-700 mb-6">
              Once submitted, you cannot change your answers. Are you sure you want to submit?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-blue-200 rounded-xl hover:bg-blue-50 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-semibold"
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

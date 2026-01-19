import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp, ChevronDown, Award } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../../config.js';
import socket from '../../socket.js';
import { useModal } from '../../context/ModalContext.jsx';
import CampusDashboardNavbar from '../CampusDashboardNavbar.jsx';

const AssessmentResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { openLogin } = useModal();

  const [activeTab, setActiveTab] = useState('assessment');
  const [isLoggedIn] = useState(!!Cookies.get('user'));
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bronzeCoins, setBronzeCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [campusRequestCount, setCampusRequestCount] = useState(0);
  const coinsRef = useRef(null);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  const isActive = (tab) => activeTab === tab;

  const fetchCoins = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/coins`, {
        credentials: 'include',
      });
      if (response.ok) {
        const payload = await response.json();
        setBronzeCoins(payload.bronze || 0);
        setSilverCoins(payload.silver || 0);
      }
    } catch {
      // ignore
    }
  };

  const fetchCampusRequestCount = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/campus`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const received = Array.isArray(data.received) ? data.received : [];
        const sent = Array.isArray(data.sent) ? data.sent : [];
        const all = [...received, ...sent];
        
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const campusPending = all.filter((r) => {
          const status = (r.status || '').toLowerCase();
          if (status !== 'pending') return false;
          const createdAt = new Date(r.createdAt || r.requestedAt);
          return !createdAt || isNaN(createdAt.getTime()) || createdAt >= twoDaysAgo;
        }).length;
        
        setCampusRequestCount(campusPending);
      }
    } catch (error) {
      console.error('Failed to fetch campus request count:', error);
    }
  };

  const handleLoginClick = () => {
    openLogin();
    setTimeout(() => {
      window.dispatchEvent(new Event('authChanged'));
    }, 100);
  };

  useEffect(() => {
    const campusValidated = localStorage.getItem('campusValidated');
    if (!campusValidated) {
      navigate('/campus-dashboard/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        localStorage.removeItem('notifications');
      }
    }

    const userCookie = Cookies.get('user');
    const userData = userCookie ? JSON.parse(userCookie) : null;
    if (userData && userData._id) {
      socket.emit('register', userData._id);
      fetchCoins();
      fetchCampusRequestCount();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen for campus request count updates
  useEffect(() => {
    const handleRequestCountChanged = (event) => {
      if (event.detail && typeof event.detail.campus === 'number') {
        setCampusRequestCount(event.detail.campus);
      }
    };

    const handleSocketCountUpdate = (data) => {
      if (data && data.counts && typeof data.counts.campus === 'number') {
        setCampusRequestCount(data.counts.campus);
      }
    };

    const handleSessionRequestEvent = () => {
      fetchCampusRequestCount();
    };

    window.addEventListener('requestCountChanged', handleRequestCountChanged);
    socket.on('request-count-update', handleSocketCountUpdate);
    socket.on('session-request-received', handleSessionRequestEvent);
    socket.on('session-request-updated', handleSessionRequestEvent);

    return () => {
      window.removeEventListener('requestCountChanged', handleRequestCountChanged);
      socket.off('request-count-update', handleSocketCountUpdate);
      socket.off('session-request-received', handleSessionRequestEvent);
      socket.off('session-request-updated', handleSessionRequestEvent);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showCoinsDropdown) return;
    const handleClickOutside = (event) => {
      if (coinsRef.current && !coinsRef.current.contains(event.target)) {
        setShowCoinsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCoinsDropdown]);

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
      <div className="min-h-screen bg-home-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
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
    <>
      <CampusDashboardNavbar
        navigate={navigate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isActive={isActive}
        isLoggedIn={isLoggedIn}
        handleLoginClick={handleLoginClick}
        bronzeCoins={bronzeCoins}
        silverCoins={silverCoins}
        showCoinsDropdown={showCoinsDropdown}
        setShowCoinsDropdown={setShowCoinsDropdown}
        fetchCoins={fetchCoins}
        coinsRef={coinsRef}
        notifications={notifications}
        setNotifications={setNotifications}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        campusRequestCount={campusRequestCount}
      />
      <div className="min-h-screen bg-home-bg pt-[76px] sm:pt-[88px] pb-6 sm:pb-8 px-4">
        <div className="max-w-6xl mx-auto">
        {/* Top */}
        <div className="bg-white/90 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                {assessment.title}
              </h1>
              {assessment.description ? (
                <p className="mt-1 text-xs sm:text-sm text-slate-600 truncate">{assessment.description}</p>
              ) : null}
            </div>

            <button
              onClick={() => navigate('/campus-dashboard')}
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-blue-900 text-white px-4 py-2 text-xs sm:text-sm font-semibold hover:bg-blue-950 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-900" />
                <p className="text-xs font-semibold text-slate-700">Score</p>
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900">
                {attempt.score}/{attempt.totalMarks}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-900" />
                <p className="text-xs font-semibold text-slate-700">Percent</p>
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900">
                {Number.isFinite(percentage) ? `${percentage.toFixed(1)}%` : '-'}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-900" />
                <p className="text-xs font-semibold text-slate-700">Grade</p>
              </div>
              <p className={`mt-2 text-xl sm:text-2xl font-extrabold ${getGradeColor()}`}>{getGrade()}</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-900" />
                <p className="text-xs font-semibold text-slate-700">Correct</p>
              </div>
              <p className="mt-2 text-xl sm:text-2xl font-extrabold text-slate-900">
                {correctCount}/{questions.length}
              </p>
            </div>
          </div>

          {attempt.status === 'auto-submitted' ? (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-700 flex-shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-red-800 font-semibold">
                Auto-submitted due to multiple violations of test rules.
              </p>
            </div>
          ) : null}
        </div>

        {/* Questions (Dropdown) */}
        <div className="mt-5 bg-white/90 backdrop-blur-sm border border-blue-100 rounded-2xl shadow-sm p-5 sm:p-7">
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900">Questions</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Click a question to view the answer details.
          </p>

          <div className="mt-4 space-y-3">
            {questions.map((question, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-blue-100 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex((prev) => (prev === index ? null : index))}
                    className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-blue-50/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-blue-900">Q{index + 1}</span>
                        {question.isCorrect ? (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-900 text-[11px] font-semibold">
                            Correct
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 text-[11px] font-semibold">
                            Incorrect
                          </span>
                        )}
                        {question.studentAnswer ? null : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            Not answered
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900 truncate">
                        {question.questionText}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <span className={`text-xs font-extrabold ${question.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        {question.earned}/{question.marks}
                      </span>
                      <ChevronDown className={`h-5 w-5 text-blue-900 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="px-4 pb-4">
                      <div className="mt-2 space-y-2">
                        {question.options.map((option, optIdx) => {
                          const label = ['A', 'B', 'C', 'D'][optIdx];
                          const isCorrect = question.correctAnswer === label;
                          const isStudentAnswer = question.studentAnswer === label;

                          let container = 'border-blue-100 bg-white text-slate-800';
                          if (isCorrect) container = 'border-green-200 bg-green-50 text-green-900';
                          else if (isStudentAnswer && !isCorrect) container = 'border-red-200 bg-red-50 text-red-900';

                          return (
                            <div
                              key={optIdx}
                              className={`rounded-xl border px-3 py-2 text-sm ${container}`}
                            >
                              <span className="font-extrabold mr-2">{label}.</span>
                              <span>{option}</span>
                              {isCorrect ? (
                                <span className="ml-2 text-green-700 font-semibold text-xs">Correct</span>
                              ) : null}
                              {isStudentAnswer && !isCorrect ? (
                                <span className="ml-2 text-red-700 font-semibold text-xs">Your Answer</span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {!question.studentAnswer ? (
                        <p className="mt-3 text-xs sm:text-sm text-slate-600 italic">
                          You did not answer this question.
                        </p>
                      ) : null}

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                          <p className="text-xs font-semibold text-slate-700">Your Answer</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            {question.studentAnswer || '-'}
                          </p>
                        </div>
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                          <p className="text-xs font-semibold text-slate-700">Correct Answer</p>
                          <p className="mt-1 text-sm font-extrabold text-slate-900">
                            {question.correctAnswer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default AssessmentResult;

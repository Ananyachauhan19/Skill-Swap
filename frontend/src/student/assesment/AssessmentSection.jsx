import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Award, CheckCircle, Play, TrendingUp, Timer, AlertTriangle, Info } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../../config.js';

const AssessmentSection = () => {
  const navigate = useNavigate();
  const RULES_TIMER_SECONDS = 60;
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | available | completed | attempted
  const [search, setSearch] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [rulesSecondsLeft, setRulesSecondsLeft] = useState(RULES_TIMER_SECONDS);
  const rulesIntervalRef = useRef(null);

  const [sidebarWidth, setSidebarWidth] = useState(360);
  const resizeRef = useRef({ isResizing: false, startX: 0, startWidth: 360 });

  const topOffsetClass = 'pt-[76px] sm:pt-[88px]';
  const sidebarTopClass = 'top-[76px] sm:top-[88px]';

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
    setRulesSecondsLeft(RULES_TIMER_SECONDS);
    setShowRulesModal(true);
  };

  const startAssessment = () => {
    setShowRulesModal(false);
    navigate(`/student/assessment-attempt/${selectedAssessment._id}`);
  };

  const formatSeconds = (seconds) => {
    const clamped = Math.max(0, Number(seconds) || 0);
    const mm = String(Math.floor(clamped / 60)).padStart(2, '0');
    const ss = String(clamped % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  useEffect(() => {
    if (!showRulesModal) {
      if (rulesIntervalRef.current) {
        clearInterval(rulesIntervalRef.current);
        rulesIntervalRef.current = null;
      }
      return;
    }

    setRulesSecondsLeft(RULES_TIMER_SECONDS);
    if (rulesIntervalRef.current) {
      clearInterval(rulesIntervalRef.current);
      rulesIntervalRef.current = null;
    }

    rulesIntervalRef.current = setInterval(() => {
      setRulesSecondsLeft((prev) => {
        if (prev <= 1) {
          if (rulesIntervalRef.current) {
            clearInterval(rulesIntervalRef.current);
            rulesIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (rulesIntervalRef.current) {
        clearInterval(rulesIntervalRef.current);
        rulesIntervalRef.current = null;
      }
    };
  }, [showRulesModal]);

  const viewResult = (assessmentId) => {
    navigate(`/student/assessment-result/${assessmentId}`);
  };

  const completedPredicate = (a) => {
    if (!a?.hasAttempted) return false;
    if (!a?.attemptStatus) return true;
    const status = String(a.attemptStatus).toLowerCase();
    return status === 'submitted' || status === 'auto-submitted' || status === 'completed';
  };

  const filteredAssessments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assessments
      .filter((a) => {
        if (filter === 'available') return !a.hasAttempted;
        if (filter === 'completed') return completedPredicate(a);
        if (filter === 'attempted') return a.hasAttempted;
        return true;
      })
      .filter((a) => {
        if (!q) return true;
        const hay = `${a?.title || ''} ${a?.description || ''}`.toLowerCase();
        return hay.includes(q);
      });
  }, [assessments, filter, search]);

  const totals = useMemo(() => {
    const total = assessments.length;
    const available = assessments.filter((a) => !a.hasAttempted).length;
    const completed = assessments.filter((a) => completedPredicate(a)).length;
    return { total, available, completed };
  }, [assessments]);

  useEffect(() => {
    const onMove = (e) => {
      if (!resizeRef.current.isResizing) return;
      const delta = e.clientX - resizeRef.current.startX;
      const next = resizeRef.current.startWidth + delta;
      const clamped = Math.max(280, Math.min(520, next));
      setSidebarWidth(clamped);
    };
    const onUp = () => {
      resizeRef.current.isResizing = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Intentionally do not auto-select an assessment on load.

  if (loading) {
    return (
      <div className={`min-h-screen bg-home-bg ${topOffsetClass}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        </div>
      </div>
    );
  }

  const onResizeMouseDown = (e) => {
    resizeRef.current.isResizing = true;
    resizeRef.current.startX = e.clientX;
    resizeRef.current.startWidth = sidebarWidth;
  };

  const selectAssessment = (assessment) => {
    setSelectedAssessment(assessment);
  };

  return (
    <div className={`min-h-screen bg-home-bg ${topOffsetClass}`}>
      <aside
        className={`fixed left-0 ${sidebarTopClass} bottom-0 bg-white/70 backdrop-blur-sm border-r border-blue-100/80 shadow-sm`}
        style={{ width: sidebarWidth }}
      >
        <div className="h-full flex flex-col">
          <div className="px-3 sm:px-4 pt-4 pb-3 border-b border-blue-100/80">
            <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-slate-700">
              {[
                { key: 'all', label: 'ALL' },
                { key: 'available', label: 'Available' },
                { key: 'completed', label: 'Completed' },
                { key: 'attempted', label: 'Attempted' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setFilter(t.key)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    filter === t.key
                      ? 'bg-blue-700 text-white'
                      : 'bg-white/60 text-slate-700 hover:bg-blue-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assessments..."
                className="w-full rounded-lg border border-blue-100 bg-white/90 px-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredAssessments.length === 0 ? (
              <div className="p-4 text-xs text-slate-600">
                No assessments found.
              </div>
            ) : (
              <ul className="divide-y divide-blue-100/70">
                {filteredAssessments.map((a) => {
                  const isSelected = selectedAssessment?._id === a._id;
                  return (
                    <li key={a._id}>
                      <button
                        onClick={() => selectAssessment(a)}
                        className={`w-full text-left px-3 sm:px-4 py-3 transition-colors ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-blue-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                {a.title}
                              </p>
                              {a.isCompulsory && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold">
                                  COMPULSORY
                                </span>
                              )}
                            </div>
                            {a.description ? (
                              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 line-clamp-2">
                                {a.description}
                              </p>
                            ) : null}
                          </div>
                          {(a.hasAttempted || a.isCompulsory) && (
                            <span
                              className={`shrink-0 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                a.hasAttempted
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {a.hasAttempted ? 'Completed' : 'Required'}
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div
            onMouseDown={onResizeMouseDown}
            className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize bg-transparent"
            aria-label="Resize sidebar"
            role="separator"
          />
        </div>
      </aside>

      <main style={{ marginLeft: sidebarWidth }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-6 sm:py-8">
          {selectedAssessment ? (
            <>
              <div className="flex items-center justify-between gap-4 mb-4 sm:mb-5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-blue-700">Assessment</p>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                    {selectedAssessment.title}
                  </h1>
                </div>

                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="shrink-0 inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white/90 px-4 py-2 text-xs sm:text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
                >
                  Back
                </button>
              </div>

              <section className="rounded-2xl border border-blue-100 bg-white/85 backdrop-blur-sm p-5 sm:p-7">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedAssessment.isCompulsory && (
                      <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold shadow-sm">
                        COMPULSORY
                      </span>
                    )}
                    {selectedAssessment.hasAttempted ? (
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                        Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                        Available
                      </span>
                    )}
                  </div>

                  {selectedAssessment.description ? (
                    <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                      {selectedAssessment.description}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm sm:text-base text-slate-500">
                      No description provided.
                    </p>
                  )}
                </div>

                <div className="flex lg:justify-end">
                  {selectedAssessment.hasAttempted ? (
                    <button
                      onClick={() => viewResult(selectedAssessment._id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-700 text-white px-5 py-3 text-sm font-semibold hover:bg-blue-800 transition-colors"
                    >
                      <CheckCircle className="h-5 w-5" />
                      View Result
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAttempt(selectedAssessment)}
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3 text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-5 w-5" />
                      Attempt
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-blue-100 bg-white/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-700" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Questions</p>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">{selectedAssessment.questionCount}</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-blue-700" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Duration</p>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">{selectedAssessment.duration} min</p>
                </div>
                <div className="rounded-2xl border border-blue-100 bg-white/80 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-blue-700" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">Total Marks</p>
                  </div>
                  <p className="mt-3 text-2xl font-extrabold text-slate-900">{selectedAssessment.totalMarks}</p>
                </div>
              </div>

              {selectedAssessment.hasAttempted ? (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-700" />
                    <p className="text-sm font-semibold text-green-900">Performance</p>
                  </div>
                  <p className="mt-2 text-sm text-green-800">
                    Score: <span className="font-semibold">{selectedAssessment.score}/{selectedAssessment.totalMarks}</span>
                    {typeof selectedAssessment.percentage === 'number' ? (
                      <>
                        {' '}(<span className="font-semibold">{selectedAssessment.percentage.toFixed(1)}%</span>)
                      </>
                    ) : null}
                  </p>
                  {selectedAssessment.attemptStatus ? (
                    <p className="mt-1 text-xs text-green-700">
                      Status: {String(selectedAssessment.attemptStatus).replace('-', ' ')}
                    </p>
                  ) : null}
                </div>
              ) : null}
              </section>
            </>
          ) : (
            <div className="rounded-2xl border border-blue-100 bg-white/80 backdrop-blur-sm p-5 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center">
                <div className="min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                    <span className="text-slate-900">SkillSwap Campus Assessments</span>
                    <span className="text-blue-700">, Learn, Compete, Grow</span>
                  </h1>

                  <div className="mt-3 space-y-2">
                    <p className="text-sm sm:text-base text-slate-600">
                      Real-time quizzes help students test their understanding instantly.
                    </p>
                    <p className="text-sm sm:text-base text-slate-600">
                      Fair rankings and performance insights keep learning focused, competitive, and consistent.
                    </p>
                  </div>

                  <p className="mt-5 text-sm text-slate-600">
                    Select an assessment from the left sidebar to view details.
                  </p>
                </div>

                <div className="flex justify-center lg:justify-end">
                  <img
                    src="/campus-assesments.png"
                    alt="Campus assessments"
                    className="w-full max-w-[420px] lg:max-w-[520px] h-auto object-contain"
                  />
                </div>
              </div>

              <div className="mt-7 sm:mt-9">
                <div className="mx-auto w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-800 text-white shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/15 flex flex-col items-center justify-center shrink-0">
                        <FileText className="h-5 w-5" />
                        <p className="text-xl font-extrabold leading-none">{totals.total}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold leading-snug">Total Assessments</p>
                        <p className="mt-1 text-sm text-white/80">All quizzes available for you</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-800 text-white shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/15 flex flex-col items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5" />
                        <p className="text-xl font-extrabold leading-none">{totals.completed}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold leading-snug">Completed</p>
                        <p className="mt-1 text-sm text-white/80">Finished and submitted quizzes</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-800 text-white shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/15 border border-white/15 flex flex-col items-center justify-center shrink-0">
                        <Clock className="h-5 w-5" />
                        <p className="text-xl font-extrabold leading-none">{Math.max(0, totals.total - totals.completed)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold leading-snug">Pending</p>
                        <p className="mt-1 text-sm text-white/80">Quizzes you still need to attempt</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Rules Modal */}
      {showRulesModal && selectedAssessment && (
        <div className="fixed inset-0 bg-slate-950/70 flex items-center justify-center z-50 p-4 overflow-hidden">
          <div className="bg-blue-50 rounded-2xl border border-blue-100 shadow-sm max-w-3xl w-full p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Assessment Rules & Instructions
                </h2>
                <p className="mt-1 text-sm sm:text-base font-semibold text-blue-900 truncate">
                  {selectedAssessment.title}
                </p>
              </div>

              <button
                onClick={() => setShowRulesModal(false)}
                className="shrink-0 inline-flex items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-blue-900 hover:bg-blue-50 transition-colors"
              >
                Back
              </button>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border border-blue-100 rounded-2xl">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-900" />
                    <p className="text-xs font-semibold text-slate-700">Questions</p>
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-extrabold text-slate-900">{selectedAssessment.questionCount}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-900" />
                    <p className="text-xs font-semibold text-slate-700">Duration</p>
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-extrabold text-slate-900">{selectedAssessment.duration} min</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-900" />
                    <p className="text-xs font-semibold text-slate-700">Total Marks</p>
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-extrabold text-slate-900">{selectedAssessment.totalMarks}</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-blue-900" />
                    <p className="text-xs font-semibold text-slate-700">Unlock In</p>
                  </div>
                  <p className="mt-2 text-base sm:text-lg font-extrabold text-slate-900">{formatSeconds(rulesSecondsLeft)}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Start Quiz is enabled after the countdown.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-blue-900 mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900">Fullscreen Mode:</strong> The test will open in fullscreen. Do not exit fullscreen during the test.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-blue-900 mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900">No Tab Switching:</strong> Do not switch to other tabs or windows during the test.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-blue-900 mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900">No Copy-Paste:</strong> Copy-paste functionality is disabled during the test.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-blue-900 mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900">Violation Limit:</strong> After 3 violations, your test will be auto-submitted.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-900 mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900">Timer:</strong> A countdown timer will be displayed. Submit before time runs out.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-900 mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-slate-700">
                  <strong className="text-slate-900">One Attempt Only:</strong> You can only attempt this assessment once.
                </p>
              </div>
            </div>

            <div className="mt-4 bg-white border border-blue-100 rounded-2xl p-4">
              <p className="text-xs sm:text-sm text-slate-700 font-semibold">
                By clicking "Start Quiz", you agree to follow all the rules and guidelines mentioned above.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-full px-5 py-3 border border-blue-200 bg-white rounded-xl text-sm font-semibold text-slate-900 hover:bg-blue-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={startAssessment}
                disabled={rulesSecondsLeft > 0}
                className={`w-full px-5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  rulesSecondsLeft > 0
                    ? 'bg-green-200 text-white/80 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentSection;

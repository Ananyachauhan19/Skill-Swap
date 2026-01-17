import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { FaClipboardCheck, FaClock, FaSearch, FaTrophy, FaCheckCircle, FaTimesCircle, FaBars, FaCalendarAlt } from 'react-icons/fa';

const QuizementHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  
  const [stats, setStats] = useState({
    totalAttempts: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    averageScore: 0,
    averageAccuracy: 0
  });

  useEffect(() => {
    const fetchQuizementHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/quizement/attempts/history`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch quizement history');
        }
        
        const data = await response.json();
        console.log('Quizement history data:', data);
        setAttempts(data);
        setFilteredAttempts(data);
        calculateStats(data);
      } catch (err) {
        console.error('Error fetching quizement history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizementHistory();
  }, []);

  const calculateStats = (data) => {
    try {
      let totalAttempts = data.length;
      let totalQuestions = 0;
      let correctAnswers = 0;
      let wrongAnswers = 0;
      let totalScore = 0;

      data.forEach(attempt => {
        totalQuestions += attempt.totalQuestions || 0;
        correctAnswers += attempt.correctAnswers || 0;
        wrongAnswers += attempt.wrongAnswers || 0;
        totalScore += attempt.score || 0;
      });

      setStats({
        totalAttempts,
        totalQuestions,
        correctAnswers,
        wrongAnswers,
        averageScore: totalAttempts > 0 ? (totalScore / totalAttempts).toFixed(1) : 0,
        averageAccuracy: totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : 0
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  useEffect(() => {
    let filtered = [...attempts];

    if (search) {
      filtered = filtered.filter(
        (attempt) =>
          attempt.testName?.toLowerCase().includes(search.toLowerCase()) ||
          attempt.category?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((attempt) => {
        const attemptDate = new Date(attempt.completedAt).toLocaleDateString('en-CA');
        return attemptDate === selectedDate;
      });
    }

    setFilteredAttempts(filtered);
  }, [search, selectedDate, attempts]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (percentage) => {
    if (percentage >= 80) return 'bg-green-50 border-green-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-16 md:pt-[72px] xl:pt-20">
        <div className="w-full flex flex-col lg:flex-row gap-0">
          <aside className="lg:w-64 bg-white border-r border-slate-200 shadow-sm p-4">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-100 rounded"></div>
            </div>
          </aside>
          <main className="w-full lg:flex-1 p-6">
            <SkeletonLoader />
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-20 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-center">
            <FaTimesCircle className="text-5xl mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading History</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-16 md:pt-[72px] xl:pt-20">
      <div className="w-full flex flex-col lg:flex-row gap-0">
        
        {/* Left Sidebar - Sticky */}
        <aside className={`
          ${sidebarOpen ? 'block' : 'hidden'} 
          lg:block lg:sticky lg:top-20 lg:w-64 
          bg-white border-r border-slate-200 shadow-sm
          lg:h-[calc(100vh-5rem)] lg:overflow-y-auto
        `}>
          <div className="p-4">
            
            {/* Header */}
            <div className="mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <FaClipboardCheck className="text-indigo-600 text-sm" />
                </div>
                <h2 className="text-base font-semibold text-slate-700">Quizement History</h2>
              </div>
              <p className="text-xs text-slate-500 ml-10">All quiz attempts</p>
            </div>

            {/* Stats Card */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-3">
              <h3 className="text-sm font-medium text-slate-700">Your Stats</h3>
              
              {/* Total Attempts */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <FaClipboardCheck className="text-indigo-500 text-xs" />
                  Attempts
                </span>
                <span className="text-sm font-semibold text-slate-800">{stats.totalAttempts}</span>
              </div>

              {/* Total Questions */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <FaClipboardCheck className="text-blue-500 text-xs" />
                  Questions
                </span>
                <span className="text-sm font-semibold text-slate-800">{stats.totalQuestions}</span>
              </div>

              {/* Average Score */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <FaTrophy className="text-amber-500 text-xs" />
                  Avg Score
                </span>
                <span className="text-sm font-semibold text-amber-600">{stats.averageScore}%</span>
              </div>

              {/* Average Accuracy */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <FaCheckCircle className="text-green-500 text-xs" />
                  Accuracy
                </span>
                <span className="text-sm font-semibold text-green-600">{stats.averageAccuracy}%</span>
              </div>

              {/* Correct vs Wrong */}
              <div className="pt-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Answers</p>
                
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <FaCheckCircle className="text-green-500 text-xs" />
                    Correct
                  </span>
                  <span className="text-sm font-semibold text-green-600">{stats.correctAnswers}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <FaTimesCircle className="text-red-500 text-xs" />
                    Wrong
                  </span>
                  <span className="text-sm font-semibold text-red-600">{stats.wrongAnswers}</span>
                </div>
              </div>
            </div>

          </div>

        </aside>

        {/* Right Content - Scrollable */}
        <main className="w-full lg:flex-1 pb-12">
          
          {/* Search and Filter Bar */}
          <div className="bg-white border-b border-slate-200 p-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
              >
                <FaBars />
                <span className="text-sm font-medium">Stats & Filters</span>
              </button>

              {/* Search */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Clear Filters */}
              {(search || selectedDate) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedDate('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {filteredAttempts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <FaClipboardCheck className="text-slate-300 text-5xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Quiz History</h3>
                <p className="text-slate-500">You haven't completed any quizzes yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAttempts.map((attempt) => {
                  const percentage = attempt.totalMarks > 0 
                    ? ((attempt.marksObtained / attempt.totalMarks) * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <div
                      key={attempt._id}
                      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">
                              {attempt.testName || 'Quiz'}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <FaCalendarAlt className="text-xs" />
                                {formatDate(attempt.completedAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <FaClock className="text-xs" />
                                {formatTime(attempt.completedAt)}
                              </span>
                              {attempt.category && (
                                <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                  {attempt.category}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Score Badge */}
                          <div className={`px-4 py-2 rounded-lg border ${getScoreBg(percentage)}`}>
                            <div className={`text-2xl font-bold ${getScoreColor(percentage)}`}>
                              {percentage}%
                            </div>
                            <div className="text-xs text-slate-600 text-center">Score</div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                            <div className="text-xs text-slate-600 mb-1">Questions</div>
                            <div className="text-lg font-semibold text-slate-800">
                              {attempt.totalQuestions || 0}
                            </div>
                          </div>
                          
                          <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                            <div className="text-xs text-green-700 mb-1 flex items-center gap-1">
                              <FaCheckCircle className="text-xs" />
                              Correct
                            </div>
                            <div className="text-lg font-semibold text-green-600">
                              {attempt.correctAnswers || 0}
                            </div>
                          </div>
                          
                          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                            <div className="text-xs text-red-700 mb-1 flex items-center gap-1">
                              <FaTimesCircle className="text-xs" />
                              Wrong
                            </div>
                            <div className="text-lg font-semibold text-red-600">
                              {attempt.wrongAnswers || 0}
                            </div>
                          </div>
                          
                          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                            <div className="text-xs text-amber-700 mb-1">Marks</div>
                            <div className="text-lg font-semibold text-amber-600">
                              {attempt.marksObtained || 0}/{attempt.totalMarks || 0}
                            </div>
                          </div>
                        </div>

                        {/* Time Taken */}
                        {attempt.timeTaken && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <FaClock className="text-slate-400" />
                              <span>Time Taken: <strong className="text-slate-800">{attempt.timeTaken}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
};

export default QuizementHistory;

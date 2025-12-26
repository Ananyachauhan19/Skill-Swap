import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../config";
import { FaUserGraduate, FaCalendarAlt, FaSearch, FaStar, FaClock, FaBook, FaCoins, FaBars } from 'react-icons/fa';

const LearningHistory = () => {
  console.log('LearningHistory rendering, BACKEND_URL:', BACKEND_URL);
  
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [expandedSession, setExpandedSession] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalHours: 0,
    silverSpent: 0,
    goldSpent: 0,
    averageRating: 0
  });

  useEffect(() => {
    console.log('LearningHistory component mounted');
    const fetchLearningHistory = async () => {
      try {
        console.log('Fetching learning history from:', `${BACKEND_URL}/api/session-requests/learning-history`);
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/session-requests/learning-history`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch learning history');
        }
        
        const data = await response.json();
        console.log('Learning history data received:', data);
        setHistory(data);
        setFilteredHistory(data);
        calculateStats(data);
      } catch (err) {
        console.error('Error fetching learning history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningHistory();
  }, []);

  const calculateStats = (data) => {
    try {
      let totalSessions = 0;
      let totalMinutes = 0;
      let silverSpent = 0;
      let goldSpent = 0;
      let totalRating = 0;
      let ratedSessions = 0;

      data.forEach(entry => {
        entry.sessions.forEach(session => {
          totalSessions++;
          totalMinutes += session.duration || 0;
          
          // Calculate coins spent based on coin type
          if (session.coinType === 'gold') {
            goldSpent += session.coinsSpent || 0;
          } else {
            silverSpent += session.coinsSpent || 0;
          }
          
          if (session.rating) {
            totalRating += session.rating;
            ratedSessions++;
          }
        });
      });

      setStats({
        totalSessions,
        totalHours: (totalMinutes / 60).toFixed(1),
        silverSpent,
        goldSpent,
        averageRating: ratedSessions > 0 ? (totalRating / ratedSessions).toFixed(1) : 0
      });
    } catch (err) {
      console.error('Error calculating stats:', err);
    }
  };

  useEffect(() => {
    let filtered = [...history];

    if (search) {
      filtered = filtered.map(entry => ({
        ...entry,
        sessions: entry.sessions.filter(
          (session) =>
            session.with.toLowerCase().includes(search.toLowerCase()) ||
            session.subject.toLowerCase().includes(search.toLowerCase()) ||
            session.topic.toLowerCase().includes(search.toLowerCase())
        )
      }));
    }

    if (selectedDate) {
      filtered = filtered.filter((entry) => entry.date === selectedDate);
    }

    setFilteredHistory(filtered.filter((entry) => entry.sessions.length > 0));
  }, [search, selectedDate, history]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const sessionTypeLabel = (type) => {
    const icons = {
      "one-on-one": "👤",
      "interview": "🎤",
      "gd": "👥"
    };
    return icons[type] || "📚";
  };

  const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="h-8 w-64 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
          <div className="p-6">
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl p-5 h-64">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  console.log('Rendering with:', { loading, error, historyLength: history.length, filteredLength: filteredHistory.length });

  try {
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
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <FaUserGraduate className="text-purple-600 text-sm" />
                </div>
                <h2 className="text-base font-semibold text-slate-700">Learning History</h2>
              </div>
              <p className="text-xs text-slate-500 ml-10">Sessions where you learned</p>
            </div>

            {/* Stats Card */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-3">
              <h3 className="text-sm font-medium text-slate-700">Your Stats</h3>
              
              {/* Total Sessions */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <FaBook className="text-purple-500 text-xs" />
                  Sessions
                </span>
                <span className="text-sm font-semibold text-slate-800">{stats.totalSessions}</span>
              </div>

              {/* Learning Hours */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <FaClock className="text-teal-500 text-xs" />
                  Hours
                </span>
                <span className="text-sm font-semibold text-slate-800">{stats.totalHours}h</span>
              </div>

              {/* Average Rating */}
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <FaStar className="text-amber-500 text-xs" />
                  Rating
                </span>
                <span className="text-sm font-semibold text-amber-600">{stats.averageRating} ⭐</span>
              </div>

              {/* Coins Spent */}
              <div className="pt-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Coins Spent</p>
                
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <FaCoins className="text-slate-400 text-xs" />
                    Silver
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{stats.silverSpent}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <FaCoins className="text-amber-500 text-xs" />
                    Gold
                  </span>
                  <span className="text-sm font-semibold text-amber-600">{stats.goldSpent}</span>
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
                className="lg:hidden bg-slate-50 border border-slate-200 p-2.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FaBars className="text-slate-600" />
              </button>

              {/* Search */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search by teacher, subject, or topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-sm"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full md:w-auto pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-sm"
                />
              </div>

              {/* Clear Filters */}
              {(search || selectedDate) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedDate("");
                  }}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 font-medium text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 bg-slate-50">
            {loading ? (
              <SkeletonLoader />
            ) : error ? (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-center">
                <p className="text-rose-600 font-medium text-sm">Error: {error}</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
                <FaUserGraduate className="text-4xl text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No learning history found</p>
                <p className="text-slate-400 text-xs mt-1">Your completed learning sessions will appear here</p>
              </div>
            ) : (
              filteredHistory.map((entry, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm overflow-hidden border border-slate-200 hover:shadow-md transition-shadow duration-300 mb-4">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                          <FaCalendarAlt className="text-purple-500 text-sm" />
                          {new Date(entry.date).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {entry.sessions.length} session{entry.sessions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                      {entry.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-200"
                        >
                          <div className="p-4">
                            {/* Session Type Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{sessionTypeLabel(session.sessionType || 'one-on-one')}</span>
                              <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                {session.sessionType ? session.sessionType.toUpperCase() : 'ONE-ON-ONE'}
                              </span>
                            </div>

                            {/* Teacher Name */}
                            <h4 className="text-sm font-semibold text-slate-800 mb-1.5">
                              {session.with || 'Unknown Teacher'}
                            </h4>

                            {/* Subject and Topic */}
                            <div className="mb-2 space-y-0.5">
                              <p className="text-xs text-slate-600">
                                <span className="font-medium">Subject:</span> {session.subject || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-600">
                                <span className="font-medium">Topic:</span> {session.topic || 'N/A'}
                              </p>
                            </div>

                            {/* Time and Duration */}
                            <div className="flex items-center gap-3 mb-2 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <FaClock className="text-teal-500" />
                                <span>{formatTime(session.when)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaClock className="text-emerald-500" />
                                <span>{session.duration} min</span>
                              </div>
                            </div>

                            {/* Coins Spent */}
                            <div className="flex items-center gap-1.5 mb-2">
                              <FaCoins className={session.coinType === 'gold' ? 'text-amber-500' : 'text-slate-400'} />
                              <span className="text-xs font-medium text-slate-600">
                                {session.coinsSpent} {session.coinType === 'gold' ? 'Gold' : 'Silver'}
                              </span>
                            </div>

                            {/* Rating */}
                            {session.rating && (
                              <div className="flex items-center gap-1.5 mb-2">
                                <FaStar className="text-amber-500" />
                                <span className="text-xs font-medium text-slate-600">
                                  {session.rating} / 5
                                </span>
                              </div>
                            )}

                            {/* Notes */}
                            {session.notes && (
                              <div className="mt-2 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                                  className="text-xs text-purple-600 hover:text-purple-800 font-medium transition-colors"
                                >
                                  {expandedSession === session.id ? 'Hide Notes' : 'Show Notes'}
                                </button>
                                {expandedSession === session.id && (
                                  <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                    {session.notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
  } catch (err) {
    console.error('Error rendering LearningHistory:', err);
    return (
      <div className="min-h-screen bg-slate-50 pt-16 md:pt-[72px] xl:pt-20 flex items-center justify-center">
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 max-w-md">
          <h2 className="text-rose-600 font-semibold text-base mb-1">Rendering Error</h2>
          <p className="text-rose-600 text-sm">{err.message}</p>
          <p className="text-xs text-slate-500 mt-1">Check console for details</p>
        </div>
      </div>
    );
  }
};

export default LearningHistory;
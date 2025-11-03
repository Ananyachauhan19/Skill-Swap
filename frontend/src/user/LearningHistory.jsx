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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 pt-20">
        <div className="w-full flex flex-col lg:flex-row gap-0">
        
        {/* Left Sidebar - Sticky */}
        <aside className={`
          ${sidebarOpen ? 'block' : 'hidden'} 
          lg:block lg:sticky lg:top-20 lg:w-80 
          bg-gradient-to-br from-blue-50 to-indigo-50 
          lg:h-[calc(100vh-5rem)] lg:overflow-y-auto
          border-r border-blue-100
        `}>
          <div className="p-6">
            
            {/* Header */}
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <FaUserGraduate className="text-3xl text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-800">Learning History</h2>
              </div>
              <p className="text-sm text-gray-600">Sessions where you learned</p>
            </div>

            {/* Stats Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Your Stats</h3>
              
              {/* Total Sessions */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <FaBook className="text-blue-600" />
                    Total Sessions
                  </span>
                  <span className="text-sm font-bold text-gray-800">{stats.totalSessions}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-300 my-4"></div>

              {/* Learning Hours */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <FaClock className="text-blue-600" />
                    Learning Hours
                  </span>
                  <span className="text-sm font-bold text-gray-800">{stats.totalHours}h</span>
                </div>
              </div>

              {/* Average Rating */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <FaStar className="text-yellow-500" />
                    Average Rating
                  </span>
                  <span className="text-sm font-bold text-yellow-600">{stats.averageRating} ⭐</span>
                </div>
              </div>

              {/* Coins Spent */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Coins Spent</p>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaCoins className="text-gray-500" />
                      Silver Coins
                    </span>
                    <span className="text-sm font-bold text-gray-800">{stats.silverSpent}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaCoins className="text-yellow-500" />
                      Gold Coins
                    </span>
                    <span className="text-sm font-bold text-yellow-600">{stats.goldSpent}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </aside>

        {/* Right Content - Scrollable */}
        <main className="w-full lg:flex-1 pb-12">
          
          {/* Search and Filter Bar */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg p-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden bg-white/80 backdrop-blur-sm border border-blue-200 p-3 rounded-xl hover:bg-white transition-colors"
              >
                <FaBars className="text-blue-600" />
              </button>

              {/* Search */}
              <div className="flex-1 relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by teacher, subject, or topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full md:w-auto pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>

              {/* Clear Filters */}
              {(search || selectedDate) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedDate("");
                  }}
                  className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-blue-200 rounded-xl hover:bg-white transition-colors text-gray-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
            {loading ? (
              <SkeletonLoader />
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <p className="text-red-600 font-semibold">Error: {error}</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="bg-white/60 backdrop-blur-sm border border-blue-200 rounded-xl p-12 text-center">
                <FaUserGraduate className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No learning history found</p>
                <p className="text-gray-400 text-sm mt-2">Your completed learning sessions will appear here</p>
              </div>
            ) : (
              filteredHistory.map((entry, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                          <FaCalendarAlt className="text-blue-600" />
                          {new Date(entry.date).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h3>
                        <p className="text-gray-600 mt-1">
                          {entry.sessions.length} session{entry.sessions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                      {entry.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-blue-100"
                        >
                          <div className="p-5">
                            {/* Session Type Badge */}
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-2xl">{sessionTypeLabel(session.sessionType || 'one-on-one')}</span>
                              <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                {session.sessionType ? session.sessionType.toUpperCase() : 'ONE-ON-ONE'}
                              </span>
                            </div>

                            {/* Teacher Name */}
                            <h4 className="text-lg font-bold text-gray-800 mb-2">
                              {session.with || 'Unknown Teacher'}
                            </h4>

                            {/* Subject and Topic */}
                            <div className="mb-3 space-y-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Subject:</span> {session.subject || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Topic:</span> {session.topic || 'N/A'}
                              </p>
                            </div>

                            {/* Time and Duration */}
                            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <FaClock className="text-blue-500" />
                                <span>{formatTime(session.when)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FaClock className="text-green-500" />
                                <span>{session.duration} min</span>
                              </div>
                            </div>

                            {/* Coins Spent */}
                            <div className="flex items-center gap-2 mb-3">
                              <FaCoins className={session.coinType === 'gold' ? 'text-yellow-500' : 'text-gray-500'} />
                              <span className="text-sm font-semibold text-gray-700">
                                {session.coinsSpent} {session.coinType === 'gold' ? 'Gold' : 'Silver'} Coins
                              </span>
                            </div>

                            {/* Rating */}
                            {session.rating && (
                              <div className="flex items-center gap-2 mb-3">
                                <FaStar className="text-yellow-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                  {session.rating} / 5
                                </span>
                              </div>
                            )}

                            {/* Notes */}
                            {session.notes && (
                              <div className="mt-3 pt-3 border-t border-blue-100">
                                <button
                                  onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                                >
                                  {expandedSession === session.id ? 'Hide Notes' : 'Show Notes'}
                                </button>
                                {expandedSession === session.id && (
                                  <p className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 pt-20 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-red-600 font-bold text-xl mb-2">Rendering Error</h2>
          <p className="text-red-600">{err.message}</p>
          <p className="text-sm text-gray-600 mt-2">Check console for details</p>
        </div>
      </div>
    );
  }
};

export default LearningHistory;

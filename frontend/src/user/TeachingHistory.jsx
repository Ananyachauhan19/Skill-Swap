import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../config";
import { FaChalkboardTeacher, FaCalendarAlt, FaSearch, FaStar, FaClock, FaAward, FaCoins, FaBars, FaBook } from 'react-icons/fa';

const TeachingHistory = () => {
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
    silverEarned: 0,
    goldEarned: 0,
    averageRating: 0
  });

  useEffect(() => {
    const fetchTeachingHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/session-requests/teaching-history`, {
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch teaching history');
        }
        
        const data = await response.json();
        setHistory(data);
        setFilteredHistory(data);
        calculateStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachingHistory();
  }, []);

  const calculateStats = (data) => {
    let totalSessions = 0;
    let totalMinutes = 0;
    let silverEarned = 0;
    let goldEarned = 0;
    let totalRating = 0;
    let ratedSessions = 0;

    data.forEach(entry => {
      entry.sessions.forEach(session => {
        totalSessions++;
        totalMinutes += session.duration || 0;
        
        // Calculate coins earned based on coin type
        if (session.coinType === 'gold') {
          goldEarned += session.coinsSpent || 0;
        } else {
          silverEarned += session.coinsSpent || 0;
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
      silverEarned,
      goldEarned,
      averageRating: ratedSessions > 0 ? (totalRating / ratedSessions).toFixed(1) : 0
    });
  };

  useEffect(() => {
    let filtered = history;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.map((entry) => ({
        ...entry,
        sessions: entry.sessions.filter(
          (s) =>
            (Array.isArray(s.with) ? s.with.join(", ") : s.with).toLowerCase().includes(searchLower) ||
            (s.subject && s.subject.toLowerCase().includes(searchLower)) ||
            (s.topic && s.topic.toLowerCase().includes(searchLower)) ||
            (s.subtopic && s.subtopic.toLowerCase().includes(searchLower))
        ),
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
    return (
      <span className="inline-block mr-2 text-2xl">
        {icons[type] || null}
      </span>
    );
  };

  const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse">
      {[...Array(2)].map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-300 to-gray-400 p-6">
            <div className="h-8 w-64 bg-gray-500 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-400 rounded"></div>
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
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                      <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                      <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                    </div>
                    <div className="h-16 w-full bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="w-full pt-20">
        
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden m-4 p-2 bg-white rounded-lg shadow"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FaBars className="text-gray-700" />
        </button>

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
          {/* Left Sidebar - Sticky */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-5rem)] lg:overflow-y-auto w-full lg:w-80 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg p-6 space-y-6`}>
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaChalkboardTeacher className="text-blue-600" />
                Teaching Stats
              </h2>
              <p className="text-sm text-gray-500 mt-1">Your teaching impact</p>
            </div>

            {/* Total Stats Card */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Total Teaching Sessions</p>
              <p className="text-4xl font-bold text-blue-700">{stats.totalSessions}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.totalHours} hours taught</p>
            </div>

            {/* Stats Summary */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Session Overview</p>
              
              {/* Teaching Hours */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <FaClock className="text-indigo-500" />
                    Teaching Hours
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

              {/* Coins Earned */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Coins Earned</p>
                
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaCoins className="text-gray-500" />
                      Silver Coins
                    </span>
                    <span className="text-sm font-bold text-gray-800">{stats.silverEarned}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <FaCoins className="text-yellow-500" />
                      Gold Coins
                    </span>
                    <span className="text-sm font-bold text-yellow-600">{stats.goldEarned}</span>
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
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" />
                  <input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search by student, subject, topic..." 
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div className="relative w-full md:w-48">
                  <FaCalendarAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" />
                  <input 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    type="date" 
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                {(search || selectedDate) && (
                  <button 
                    onClick={() => { setSearch(''); setSelectedDate(''); }}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="p-6 space-y-4">
              {loading ? (
                <SkeletonLoader />
              ) : error ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition duration-200"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaChalkboardTeacher className="text-4xl text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No sessions found</h3>
                  <p className="text-gray-600 mb-6">
                    {search || selectedDate ? 'Try adjusting your filters' : 'Your completed teaching sessions will appear here'}
                  </p>
                  {(search || selectedDate) && (
                    <button 
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition duration-200"
                      onClick={() => {
                        setSearch("");
                        setSelectedDate("");
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredHistory.map((entry, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
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
                        {entry.sessions.map((s) => (
                          <div 
                            key={s.id}
                            className={`relative bg-gradient-to-br from-white to-gray-50 border-2 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
                              expandedSession === s.id ? 'ring-4 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                          >
                            <div className="p-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="text-4xl">
                                    {sessionTypeLabel(s.type)}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-900 text-lg">
                                      {s.type === 'gd' ? 'Group Discussion' : 
                                       s.type === 'interview' ? 'Interview Session' : '1-on-1 Session'}
                                    </h4>
                                    <p className="text-sm text-gray-600 flex items-center gap-1">
                                      <FaChalkboardTeacher className="text-blue-600" />
                                      {s.type === 'gd' ? 
                                        `${Array.isArray(s.with) ? s.with.join(', ') : s.with}` : 
                                        s.with}
                                    </p>
                                  </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1 shadow-md ${
                                  s.coinType === 'gold' 
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' 
                                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                                }`}>
                                  <FaCoins /> {s.coinsSpent} {s.coinType === 'gold' ? 'Gold' : 'Silver'}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                  <FaClock />
                                  {formatTime(s.when)}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  ⏱️ {s.duration} min
                                </span>
                              </div>
                              
                              {s.subject && (
                                <div className="bg-gray-100 rounded-lg p-3 mb-3">
                                  <p className="text-sm font-semibold text-gray-700">
                                    📚 <span className="font-bold">{s.subject}</span>
                                    {s.topic && <span className="text-gray-600"> • {s.topic}</span>}
                                    {s.subtopic && <span className="text-gray-500"> • {s.subtopic}</span>}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {expandedSession === s.id && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t-2 border-blue-200 p-5 animate-fade-in">
                                <h5 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                                  📝 Session Notes
                                </h5>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {s.notes || "No additional notes provided for this session."}
                                </p>
                              </div>
                            )}
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
    </div>
  );
};

export default TeachingHistory;

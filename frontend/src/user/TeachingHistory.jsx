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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="w-full pt-20">
        
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden m-4 p-2 bg-white rounded-lg shadow-sm border border-slate-200"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FaBars className="text-slate-600" />
        </button>

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
          {/* Left Sidebar - Sticky */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-5rem)] lg:overflow-y-auto w-full lg:w-64 bg-white border-r border-slate-200 shadow-sm`}>
            
            <div className="p-4 border-b border-slate-100">
              {/* Header */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <FaChalkboardTeacher className="text-emerald-600 text-sm" />
                </div>
                <h2 className="text-base font-semibold text-slate-700">Teaching Stats</h2>
              </div>
              <p className="text-xs text-slate-500 ml-10">Your teaching impact</p>
            </div>

            <div className="p-4 space-y-4">
              {/* Total Stats Card */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Total Sessions</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalSessions}</p>
                <p className="text-xs text-slate-500 mt-1">{stats.totalHours} hours taught</p>
              </div>

              {/* Stats Summary */}
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Overview</p>
                
                {/* Teaching Hours */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600 flex items-center gap-2">
                    <FaClock className="text-purple-500 text-xs" />
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

                {/* Coins Earned */}
                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">Coins Earned</p>
                  
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <FaCoins className="text-slate-400 text-xs" />
                      Silver
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{stats.silverEarned}</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-600 flex items-center gap-2">
                      <FaCoins className="text-amber-500 text-xs" />
                      Gold
                    </span>
                    <span className="text-sm font-semibold text-amber-600">{stats.goldEarned}</span>
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
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
                  <input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search by student, subject, topic..." 
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                  />
                </div>
                <div className="relative w-full md:w-44">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
                  <input 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    type="date" 
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-sm"
                  />
                </div>
                {(search || selectedDate) && (
                  <button 
                    onClick={() => { setSearch(''); setSelectedDate(''); }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium text-sm text-slate-600 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Sessions List */}
            <div className="p-4 space-y-4">
              {loading ? (
                <SkeletonLoader />
              ) : error ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="bg-rose-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Oops! Something went wrong</h3>
                  <p className="text-slate-500 text-sm mb-4">{error}</p>
                  <button 
                    className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
                  <div className="bg-emerald-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaChalkboardTeacher className="text-2xl text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">No sessions found</h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {search || selectedDate ? 'Try adjusting your filters' : 'Your completed teaching sessions will appear here'}
                  </p>
                  {(search || selectedDate) && (
                    <button 
                      className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition"
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
                  <div key={idx} className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 hover:shadow-md transition-shadow duration-300">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                            <FaCalendarAlt className="text-teal-600 text-sm" />
                            {new Date(entry.date).toLocaleDateString(undefined, {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </h3>
                          <p className="text-slate-500 text-sm mt-0.5">
                            {entry.sessions.length} session{entry.sessions.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                        {entry.sessions.map((s) => (
                          <div 
                            key={s.id}
                            className={`relative bg-white border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                              expandedSession === s.id ? 'ring-2 ring-teal-500 border-teal-300' : 'border-slate-200 hover:border-teal-300'
                            }`}
                            onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="text-2xl">
                                    {sessionTypeLabel(s.type)}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">
                                      {s.type === 'gd' ? 'Group Discussion' : 
                                       s.type === 'interview' ? 'Interview Session' : '1-on-1 Session'}
                                    </h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                      <FaChalkboardTeacher className="text-teal-600 text-xs" />
                                      {s.type === 'gd' ? 
                                        `${Array.isArray(s.with) ? s.with.join(', ') : s.with}` : 
                                        s.with}
                                    </p>
                                  </div>
                                </div>
                                <div className={`px-2 py-1 rounded-full font-medium text-xs flex items-center gap-1 ${
                                  s.coinType === 'gold' 
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                    : 'bg-slate-50 text-slate-600 border border-slate-200'
                                }`}>
                                  <FaCoins className="text-xs" /> {s.coinsSpent}
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5 mb-3">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                  <FaClock className="text-xs" />
                                  {formatTime(s.when)}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                                  ⏱️ {s.duration} min
                                </span>
                              </div>
                              
                              {s.subject && (
                                <div className="bg-slate-50 rounded-lg p-2.5">
                                  <p className="text-xs text-slate-600">
                                    📚 <span className="font-medium text-slate-700">{s.subject}</span>
                                    {s.topic && <span className="text-slate-500"> • {s.topic}</span>}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {expandedSession === s.id && (
                              <div className="bg-teal-50 border-t border-teal-100 p-4 animate-fade-in">
                                <h5 className="text-xs font-semibold text-teal-800 mb-1.5 flex items-center gap-1">
                                  📝 Session Notes
                                </h5>
                                <p className="text-xs text-slate-600 leading-relaxed">
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

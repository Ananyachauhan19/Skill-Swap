import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { FaCoins, FaClock, FaCalendarAlt, FaSearch, FaBook, FaChalkboardTeacher, FaHistory, FaBars } from 'react-icons/fa';

const CoinsHistory = () => {
  const [learningEvents, setLearningEvents] = useState([]);
  const [teachingEvents, setTeachingEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all | learning | teaching
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Calculated stats
  const [stats, setStats] = useState({
    silverAvailable: 0,
    goldAvailable: 0,
    silverSpent: 0,
    goldSpent: 0,
    silverEarned: 0,
    goldEarned: 0
  });

  // Fetch coin balances and history
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Fetch current balances from profile/auth endpoint
        const balRes = await fetch(`${BACKEND_URL}/api/auth/coins`, { credentials: 'include' });
        let balData = { silver: 0, golden: 0 };
        if (balRes.ok) {
          balData = await balRes.json();
          console.log('💰 Coin Balances from Profile:', balData);
          console.log('💰 Silver:', balData.silver, 'Gold:', balData.golden);
        } else {
          console.error('❌ Failed to fetch balances:', balRes.status);
        }

        // Fetch complete coin history - ALL completed sessions (no date restriction)
        // This is different from learning-history/teaching-history which only show past 2 days
        const historyRes = await fetch(`${BACKEND_URL}/api/session-requests/all-coin-history`, { credentials: 'include' });
        
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          console.log('🎯 Complete Coin History Response:', historyData);
          console.log('📚 Learning transactions:', historyData.learning?.length || 0);
          console.log('👨‍🏫 Teaching transactions:', historyData.teaching?.length || 0);
          
          // Set learning and teaching events directly
          const learningTxns = historyData.learning || [];
          const teachingTxns = historyData.teaching || [];
          
          setLearningEvents(learningTxns);
          setTeachingEvents(teachingTxns);
          
          console.log('✅ Set learning events:', learningTxns.length);
          console.log('✅ Set teaching events:', teachingTxns.length);
          
          // Calculate stats
          calculateStats(learningTxns, teachingTxns, balData);
        } else {
          const errorText = await historyRes.text();
          console.error('❌ Failed to fetch coin history:', historyRes.status, errorText);
          setError('Failed to fetch coin history');
        }

      } catch (err) {
        console.error('❌ Error loading coin history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const calculateStats = (learning, teaching, balData) => {
    let silverSpent = 0, goldSpent = 0, silverEarned = 0, goldEarned = 0;

    console.log('📊 Calculating stats with balData:', balData);
    console.log('📊 Learning transactions:', learning.length);
    console.log('📊 Teaching transactions:', teaching.length);

    learning.forEach(e => {
      if (e.coinType === 'gold') goldSpent += e.coinsSpent || 0;
      else silverSpent += e.coinsSpent || 0;
    });

    teaching.forEach(e => {
      const earned = (typeof e.coinsEarned === 'number' ? e.coinsEarned : (e.coinsSpent || 0));
      if (e.coinType === 'gold') goldEarned += earned;
      else silverEarned += earned;
    });

    const calculatedStats = {
      silverAvailable: balData.silver || 0,  // Changed from balData.silverCoins
      goldAvailable: balData.golden || 0,    // Changed from balData.goldCoins
      silverSpent,
      goldSpent,
      silverEarned,
      goldEarned
    };
    
    console.log('📈 Calculated Stats:', calculatedStats);
    setStats(calculatedStats);
  };

  // Filter events based on active tab and search
  useEffect(() => {
    let events = [];
    
    if (activeTab === 'learning') {
      events = learningEvents;
    } else if (activeTab === 'teaching') {
      events = teachingEvents;
    } else {
      events = [...learningEvents, ...teachingEvents].sort((a, b) => new Date(b.when) - new Date(a.when));
    }
    
    console.log(`🔍 Filtering - Tab: ${activeTab}, Total events before filter:`, events.length);

    if (search) {
      const s = search.toLowerCase();
      events = events.filter(e => (
        (e.with && e.with.toString().toLowerCase().includes(s)) ||
        (e.subject && e.subject.toLowerCase().includes(s)) ||
        (e.topic && e.topic.toLowerCase().includes(s))
      ));
      console.log(`🔍 After search filter (${search}):`, events.length);
    }

    if (selectedDate) {
      events = events.filter(e => e.date === selectedDate || new Date(e.when).toISOString().slice(0, 10) === selectedDate);
      console.log(`🔍 After date filter (${selectedDate}):`, events.length);
    }

    console.log('✅ Final filtered events:', events);
    setFilteredEvents(events);
  }, [activeTab, search, selectedDate, learningEvents, teachingEvents]);

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <div className="w-full pt-16 md:pt-[72px] xl:pt-20">
        
        {/* Mobile menu toggle */}
        <button 
          className="lg:hidden m-4 p-2 bg-white rounded-lg shadow"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <FaBars className="text-gray-700" />
        </button>

        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
          {/* Left Sidebar - Sticky (not fixed), scrolls with page */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block lg:sticky lg:top-20 lg:self-start lg:h-[calc(100vh-5rem)] lg:overflow-y-auto w-full lg:w-80 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg p-6 space-y-6`}>
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FaCoins className="text-yellow-500" />
                Coin History
              </h2>
              <p className="text-sm text-gray-500 mt-1">Track all your coin transactions</p>
            </div>

            {/* Total Available */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Total Available Coins</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Silver</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.silverAvailable}</p>
                </div>
                <div className="h-12 w-px bg-gray-300"></div>
                <div>
                  <p className="text-xs text-gray-500">Gold</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.goldAvailable}</p>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">View History</p>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setActiveTab('all')} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'all' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaHistory />
                  <span>All History</span>
                </button>

                <button 
                  onClick={() => setActiveTab('learning')} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'learning' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaBook />
                  <div className="flex-1 text-left">
                    <p>Learning (Spent)</p>
                    <p className="text-xs opacity-75">{stats.silverSpent}s + {stats.goldSpent}g</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('teaching')} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === 'teaching' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <FaChalkboardTeacher />
                  <div className="flex-1 text-left">
                    <p>Teaching (Earned)</p>
                    <p className="text-xs opacity-75">{stats.silverEarned}s + {stats.goldEarned}g</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Coin Summary</p>
              
              {/* Silver Coins */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <FaCoins className="text-gray-500" />
                    Silver Coins
                  </span>
                  <span className="text-sm font-bold text-gray-800">{stats.silverAvailable}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Spent: {stats.silverSpent}</span>
                  <span>Earned: {stats.silverEarned}</span>
                </div>
              </div>

              {/* Gold Coins */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <FaCoins className="text-yellow-500" />
                    Gold Coins
                  </span>
                  <span className="text-sm font-bold text-yellow-600">{stats.goldAvailable}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Spent: {stats.goldSpent}</span>
                  <span>Earned: {stats.goldEarned}</span>
                </div>
              </div>
            </div>

          </aside>

          {/* Right Content - Scrollable, no left margin on desktop (flexbox handles layout) */}
          <main className="w-full lg:flex-1 pb-12">
            
            {/* Search and Filter Bar */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg p-6">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400" />
                  <input 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search by subject, participant..." 
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

            {/* Events List */}
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow p-8 text-center">
                  <div className="animate-pulse">
                    <div className="h-8 w-48 bg-blue-200 rounded mx-auto mb-4"></div>
                    <div className="h-4 w-64 bg-blue-100 rounded mx-auto"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow p-8 text-center">
                  <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h3>
                  <p className="text-gray-600">{error}</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow p-12 text-center">
                  <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCoins className="text-4xl text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No Transactions Found</h3>
                  <p className="text-gray-600">
                    {search || selectedDate ? 'Try adjusting your filters' : 'Your coin transactions will appear here'}
                  </p>
                </div>
              ) : (
                filteredEvents.map(event => (
                  <div key={event.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg border border-blue-100 overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        
                        {/* Left: Event Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-3xl">
                              {event.sessionType === 'gd' ? '👥' : event.sessionType === 'interview' ? '🎤' : '👤'}
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-900">
                                {event.type === 'spent' ? 'Coins Spent - Learning' : 'Coins Earned - Teaching'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {event.subject || 'Session'} {event.topic && `• ${event.topic}`}
                              </p>
                            </div>
                          </div>

                          {/* Event Details */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
                              <FaClock />
                              {formatTime(event.when)}
                            </span>
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <FaCalendarAlt />
                              {formatDate(event.when)}
                            </span>
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-700 border border-gray-200">
                              ⏱️ {event.duration} min
                            </span>
                          </div>

                          {event.with && (
                            <p className="text-sm text-gray-600">
                              {event.type === 'spent' ? 'Tutor: ' : 'Student: '}{event.with}
                            </p>
                          )}

                          {event.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">{event.notes}</p>
                          )}
                        </div>

                        {/* Right: Coin Badge */}
                        <div className={`px-4 py-3 rounded-xl text-center min-w-[100px] ${
                          event.coinType === 'gold' 
                            ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-2 border-yellow-300' 
                            : 'bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300'
                        }`}>
                          <FaCoins className={`mx-auto text-2xl mb-1 ${
                            event.coinType === 'gold' ? 'text-yellow-600' : 'text-gray-600'
                          }`} />
                          <p className={`text-2xl font-bold ${
                            event.coinType === 'gold' ? 'text-yellow-700' : 'text-gray-700'
                          }`}>
                            {event.type === 'spent' ? '-' : '+'}{(event.type === 'earned' ? (event.coinsEarned ?? event.coinsSpent ?? 0) : (event.coinsSpent || 0))}
                          </p>
                          <p className={`text-xs uppercase font-semibold ${
                            event.coinType === 'gold' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {event.coinType}
                          </p>
                        </div>

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

export default CoinsHistory;

import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { Calendar, Clock, Award, Coins, BookOpen, Users, TrendingUp, Activity, Filter, Search, ChevronDown, ChevronRight, Trophy, Target, Zap } from 'lucide-react';

const ComprehensiveHistory = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all | coins | learning | teaching | quizement | interviews | campus
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // all | today | week | month
  const [expandedItems, setExpandedItems] = useState(new Set());

  // All history data
  const [historyData, setHistoryData] = useState({
    coins: [],
    learning: [],
    teaching: [],
    quizement: [],
    interviews: [],
    campusActivities: [],
    contributions: []
  });

  // Stats
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    quizzesAttempted: 0,
    interviewsConducted: 0,
    contributionStreak: 0
  });

  useEffect(() => {
    fetchAllHistory();
  }, []);

  const fetchAllHistory = async () => {
    try {
      setLoading(true);

      // Fetch all histories in parallel
      const [
        coinsRes,
        learningRes,
        teachingRes,
        quizementRes,
        interviewsRes,
        campusRes,
        contributionsRes
      ] = await Promise.all([
        fetch(`${BACKEND_URL}/api/session-requests/all-coin-history`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/session-requests/learning-history`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/session-requests/teaching-history`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/quizement/attempts/history`, { credentials: 'include' }).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/interview/history`, { credentials: 'include' }).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/campus-ambassador/activity-history`, { credentials: 'include' }).catch(() => ({ ok: false })),
        fetch(`${BACKEND_URL}/api/contributions/history`, { credentials: 'include' }).catch(() => ({ ok: false }))
      ]);

      const data = {
        coins: coinsRes.ok ? await coinsRes.json() : { learning: [], teaching: [] },
        learning: learningRes.ok ? await learningRes.json() : [],
        teaching: teachingRes.ok ? await teachingRes.json() : [],
        quizement: quizementRes.ok ? await quizementRes.json() : [],
        interviews: interviewsRes.ok ? await interviewsRes.json() : [],
        campusActivities: campusRes.ok ? await campusRes.json() : [],
        contributions: contributionsRes.ok ? await contributionsRes.json() : []
      };

      setHistoryData(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    let totalCoinsEarned = 0;
    let totalCoinsSpent = 0;
    let totalSessions = 0;

    // Calculate from coin history
    if (data.coins.teaching) {
      data.coins.teaching.forEach(t => {
        totalCoinsEarned += (t.coinsEarned || t.coinsSpent || 0);
      });
    }
    if (data.coins.learning) {
      data.coins.learning.forEach(l => {
        totalCoinsSpent += (l.coinsSpent || 0);
      });
    }

    // Count sessions
    if (data.learning) {
      data.learning.forEach(entry => {
        totalSessions += entry.sessions?.length || 0;
      });
    }
    if (data.teaching) {
      data.teaching.forEach(entry => {
        totalSessions += entry.sessions?.length || 0;
      });
    }

    setStats({
      totalSessions,
      totalCoinsEarned,
      totalCoinsSpent,
      quizzesAttempted: data.quizement?.length || 0,
      interviewsConducted: data.interviews?.length || 0,
      contributionStreak: calculateStreak(data.contributions)
    });
  };

  const calculateStreak = (contributions) => {
    if (!contributions || contributions.length === 0) return 0;
    
    const sortedDates = contributions
      .map(c => new Date(c.dateKey))
      .sort((a, b) => b - a);
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const date of sortedDates) {
      const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
      if (diffDays === streak) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const filterByDate = (date) => {
    if (dateFilter === 'all') return true;
    
    const itemDate = new Date(date);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      default:
        return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-900 mx-auto mb-4"></div>
          <p className="text-blue-900 font-semibold">Loading your complete history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-900" />
            Complete Activity History
          </h1>
          <p className="text-gray-600 text-sm">Track all your activities, contributions, and achievements in one place</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-semibold text-gray-600">Sessions</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalSessions}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-700" />
              <span className="text-xs font-semibold text-gray-600">Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{stats.totalCoinsEarned}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-orange-700" />
              <span className="text-xs font-semibold text-gray-600">Spent</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.totalCoinsSpent}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-700" />
              <span className="text-xs font-semibold text-gray-600">Quizzes</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{stats.quizzesAttempted}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-indigo-700" />
              <span className="text-xs font-semibold text-gray-600">Interviews</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{stats.interviewsConducted}</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-pink-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-pink-700" />
              <span className="text-xs font-semibold text-gray-600">Streak</span>
            </div>
            <p className="text-2xl font-bold text-pink-700">{stats.contributionStreak} days</p>
          </div>
        </div>

        {/* Contribution Calendar */}
        <ContributionCalendar contributions={historyData.contributions} />

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All Activities', icon: Activity },
              { id: 'coins', label: 'Coin History', icon: Coins },
              { id: 'learning', label: 'Learning', icon: BookOpen },
              { id: 'teaching', label: 'Teaching', icon: Users },
              { id: 'quizement', label: 'Quizzes', icon: Target },
              { id: 'interviews', label: 'Interviews', icon: Trophy },
              { id: 'campus', label: 'Campus Activities', icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* History Timeline */}
        <div className="space-y-4">
          {activeTab === 'all' && <AllActivitiesView historyData={historyData} filterByDate={filterByDate} searchQuery={searchQuery} expandedItems={expandedItems} toggleExpand={toggleExpand} />}
          {activeTab === 'coins' && <CoinHistoryView data={historyData.coins} filterByDate={filterByDate} searchQuery={searchQuery} />}
          {activeTab === 'learning' && <LearningHistoryView data={historyData.learning} filterByDate={filterByDate} searchQuery={searchQuery} />}
          {activeTab === 'teaching' && <TeachingHistoryView data={historyData.teaching} filterByDate={filterByDate} searchQuery={searchQuery} />}
          {activeTab === 'quizement' && <QuizementHistoryView data={historyData.quizement} filterByDate={filterByDate} searchQuery={searchQuery} />}
          {activeTab === 'interviews' && <InterviewHistoryView data={historyData.interviews} filterByDate={filterByDate} searchQuery={searchQuery} />}
          {activeTab === 'campus' && <CampusHistoryView data={historyData.campusActivities} filterByDate={filterByDate} searchQuery={searchQuery} />}
        </div>
      </div>
    </div>
  );
};

// Contribution Calendar Component
const ContributionCalendar = ({ contributions }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Generate last 365 days
  const generateCalendarData = () => {
    const data = [];
    const today = new Date();
    const contributionMap = {};
    
    // Create map of contributions by date
    contributions.forEach(c => {
      contributionMap[c.dateKey] = (contributionMap[c.dateKey] || 0) + 1;
    });
    
    // Generate 52 weeks
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      data.push({
        date,
        dateKey,
        count: contributionMap[dateKey] || 0,
        level: getContributionLevel(contributionMap[dateKey] || 0)
      });
    }
    
    return data;
  };
  
  const getContributionLevel = (count) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };
  
  const calendarData = generateCalendarData();
  const weeks = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7));
  }
  
  const levelColors = [
    'bg-gray-100',
    'bg-green-200',
    'bg-green-400',
    'bg-green-600',
    'bg-green-800'
  ];
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-900" />
          Contribution Calendar
        </h2>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Less</span>
          {levelColors.map((color, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${color} border border-gray-300`}></div>
          ))}
          <span>More</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="flex gap-1" style={{ minWidth: 'fit-content' }}>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${levelColors[day.level]} border border-gray-300 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all`}
                  title={`${day.dateKey}: ${day.count} contribution${day.count !== 1 ? 's' : ''}`}
                  onMouseEnter={() => setSelectedDate(day)}
                  onMouseLeave={() => setSelectedDate(null)}
                ></div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {selectedDate && (
        <div className="mt-4 text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
          <strong>{selectedDate.dateKey}</strong>: {selectedDate.count} contribution{selectedDate.count !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

// All Activities Combined View
const AllActivitiesView = ({ historyData, filterByDate, searchQuery, expandedItems, toggleExpand }) => {
  // Combine all activities into a single timeline
  const allActivities = [];
  
  // Add coin transactions
  if (historyData.coins.learning) {
    historyData.coins.learning.forEach((tx, idx) => {
      allActivities.push({
        type: 'coin-spent',
        id: `coin-spent-${idx}`,
        date: tx.sessionEnd || tx.createdAt,
        title: `Spent ${tx.coinsSpent} ${tx.coinType} coins`,
        subtitle: `Learning session with ${tx.with}`,
        details: tx,
        icon: Coins,
        color: 'orange'
      });
    });
  }
  
  if (historyData.coins.teaching) {
    historyData.coins.teaching.forEach((tx, idx) => {
      allActivities.push({
        type: 'coin-earned',
        id: `coin-earned-${idx}`,
        date: tx.sessionEnd || tx.createdAt,
        title: `Earned ${tx.coinsEarned || tx.coinsSpent} ${tx.coinType} coins`,
        subtitle: `Teaching session with ${tx.with}`,
        details: tx,
        icon: TrendingUp,
        color: 'green'
      });
    });
  }
  
  // Add quizement
  if (historyData.quizement && historyData.quizement.length > 0) {
    historyData.quizement.forEach((quiz, idx) => {
      allActivities.push({
        type: 'quiz',
        id: `quiz-${idx}`,
        date: quiz.finishedAt || quiz.createdAt,
        title: quiz.testName || 'Quiz Attempt',
        subtitle: `Score: ${quiz.score}/${quiz.totalMarks} (${quiz.percentage?.toFixed(1)}%)`,
        details: quiz,
        icon: Target,
        color: 'purple'
      });
    });
  }
  
  // Add interviews
  if (historyData.interviews && historyData.interviews.length > 0) {
    historyData.interviews.forEach((interview, idx) => {
      allActivities.push({
        type: 'interview',
        id: `interview-${idx}`,
        date: interview.scheduledAt || interview.createdAt,
        title: `Interview: ${interview.position || 'Position'}`,
        subtitle: `With ${interview.candidateName || interview.interviewerName}`,
        details: interview,
        icon: Trophy,
        color: 'indigo'
      });
    });
  }
  
  // Sort by date (most recent first)
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Filter
  const filteredActivities = allActivities.filter(activity => {
    if (!filterByDate(activity.date)) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return activity.title.toLowerCase().includes(search) || 
             activity.subtitle.toLowerCase().includes(search);
    }
    return true;
  });
  
  if (filteredActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-md">
        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">No activities found</p>
      </div>
    );
  }
  
  const colorClasses = {
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200'
  };
  
  return (
    <div className="space-y-3">
      {filteredActivities.map((activity) => {
        const Icon = activity.icon;
        const isExpanded = expandedItems.has(activity.id);
        
        return (
          <div key={activity.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleExpand(activity.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${colorClasses[activity.color]} border`}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{activity.title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">{activity.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {isExpanded && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <pre className="text-xs text-gray-700 overflow-auto">
                  {JSON.stringify(activity.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Individual history views (simplified versions)
const CoinHistoryView = ({ data, filterByDate, searchQuery }) => {
  const allTransactions = [...(data.learning || []), ...(data.teaching || [])].sort(
    (a, b) => new Date(b.sessionEnd || b.createdAt) - new Date(a.sessionEnd || a.createdAt)
  );
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Coins className="w-5 h-5 text-orange-600" />
        Coin Transaction History
      </h2>
      {allTransactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No coin transactions yet</p>
      ) : (
        <div className="space-y-2">
          {allTransactions.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">{tx.with}</p>
                <p className="text-xs text-gray-600">{tx.subject || 'Session'}</p>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${tx.coinsEarned ? 'text-green-600' : 'text-orange-600'}`}>
                  {tx.coinsEarned ? '+' : '-'}{tx.coinsEarned || tx.coinsSpent} {tx.coinType}
                </p>
                <p className="text-xs text-gray-500">{new Date(tx.sessionEnd).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const LearningHistoryView = ({ data, filterByDate, searchQuery }) => (
  <div className="bg-white rounded-xl p-6 shadow-md">
    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <BookOpen className="w-5 h-5 text-blue-600" />
      Learning Sessions
    </h2>
    <p className="text-gray-600">Total sessions: {data.reduce((acc, entry) => acc + (entry.sessions?.length || 0), 0)}</p>
  </div>
);

const TeachingHistoryView = ({ data, filterByDate, searchQuery }) => (
  <div className="bg-white rounded-xl p-6 shadow-md">
    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <Users className="w-5 h-5 text-green-600" />
      Teaching Sessions
    </h2>
    <p className="text-gray-600">Total sessions: {data.reduce((acc, entry) => acc + (entry.sessions?.length || 0), 0)}</p>
  </div>
);

const QuizementHistoryView = ({ data, filterByDate, searchQuery }) => (
  <div className="bg-white rounded-xl p-6 shadow-md">
    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <Target className="w-5 h-5 text-purple-600" />
      Quiz Attempts
    </h2>
    <p className="text-gray-600">Total quizzes: {data.length}</p>
  </div>
);

const InterviewHistoryView = ({ data, filterByDate, searchQuery }) => (
  <div className="bg-white rounded-xl p-6 shadow-md">
    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <Trophy className="w-5 h-5 text-indigo-600" />
      Interview History
    </h2>
    <p className="text-gray-600">Total interviews: {data.length}</p>
  </div>
);

const CampusHistoryView = ({ data, filterByDate, searchQuery }) => (
  <div className="bg-white rounded-xl p-6 shadow-md">
    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <Award className="w-5 h-5 text-pink-600" />
      Campus Ambassador Activities
    </h2>
    <p className="text-gray-600">Total activities: {data.length}</p>
  </div>
);

export default ComprehensiveHistory;

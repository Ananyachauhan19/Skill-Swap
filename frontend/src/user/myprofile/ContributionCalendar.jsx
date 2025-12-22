import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import socket from '../../socket';

// Fetch dynamic contributions for the last N days
async function fetchContributions(userId, rangeDays = 365) {
  const res = await api.get(`/api/contributions/${userId}?rangeDays=${rangeDays}`);
  const items = res.data.items || [];
  const stats = res.data.stats || null;
  return { items, stats };
}

// Generate last 12 months
const generateMonths = (currentDate) => {
  const months = [];
  const endDate = new Date(currentDate);
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 364);

  let current = new Date(startDate);
  while (current <= endDate) {
    const monthIndex = current.getMonth();
    const year = current.getFullYear();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const monthName = current.toLocaleString('default', { month: 'short' });

    if (!months.some((m) => m.name === monthName && m.year === year)) {
      months.push({
        name: monthName,
        year: year,
        monthIndex,
        days:
          current.getMonth() === endDate.getMonth() &&
          current.getFullYear() === endDate.getFullYear()
            ? endDate.getDate()
            : daysInMonth,
      });
    }

    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return months;
};

// Prepare a date-key map for the last 365 days and fill from API items
const buildContributionMap = (currentDate, items) => {
  const map = {};
  const endDate = new Date(currentDate);
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 364);

  let current = new Date(startDate);
  while (current <= endDate) {
    // Use UTC day key to align with backend
    const dateStr = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate())).toISOString().slice(0, 10);
    map[dateStr] = 0;
    current.setUTCDate(current.getUTCDate() + 1);
  }

  items.forEach(({ date, count }) => {
    if (date in map) map[date] = count || 0;
  });

  return map;
};

// Color by contribution count with white base and blue gradient for visibility
const getContributionColor = (count) => {
  if (count <= 0) return 'bg-white hover:bg-blue-50 border-gray-300 shadow-sm';
  if (count === 1) return 'bg-blue-100 hover:bg-blue-200 border-blue-200 shadow-sm';
  if (count === 2) return 'bg-blue-200 hover:bg-blue-300 border-blue-300 shadow';
  if (count === 3) return 'bg-blue-300 hover:bg-blue-400 border-blue-400 shadow';
  if (count === 4) return 'bg-blue-400 hover:bg-blue-500 border-blue-500 shadow-md';
  if (count === 5) return 'bg-blue-500 hover:bg-blue-600 border-blue-600 shadow-md';
  if (count === 6) return 'bg-blue-600 hover:bg-blue-700 border-blue-700 shadow-md';
  if (count >= 10) return 'bg-blue-900 hover:bg-blue-800 border-blue-900 shadow-lg';
  return 'bg-blue-700 hover:bg-blue-800 border-blue-800 shadow-md'; // 7-9
};

// Get intensity label
const getIntensityLabel = (count) => {
  if (count <= 0) return 'No activity';
  if (count <= 2) return 'Low activity';
  if (count <= 5) return 'Moderate activity';
  if (count <= 9) return 'High activity';
  return 'Very high activity';
};

const ContributionCalendar = ({ userId: propUserId }) => {
  const [contributions, setContributions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [contributionStats, setContributionStats] = useState({
    total: 0,
    maxStreak: 0,
    currentStreak: 0,
    activeDays: 0,
    totalDays: 365,
    oneOnOneSessions: 0,
    interviewSessions: 0,
    skillMateConnections: 0,
    dailyLogins: 0,
    questionsPosted: 0,
    videosUploaded: 0,
  });
  const { user } = useAuth();
  const effectiveUserId = propUserId || (user && user._id);
  
  // Memoize current date and months to prevent unnecessary recalculations
  const currentDate = useMemo(() => new Date(), []);
  const months = useMemo(() => generateMonths(currentDate), [currentDate]);

  // Memoize streak calculation function
  const calculateStreaks = useCallback((contribMap) => {
    const dates = Object.keys(contribMap).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (let i = dates.length - 1; i >= 0; i--) {
      if (contribMap[dates[i]] > 0) {
        tempStreak++;
        if (i === dates.length - 1 || contribMap[dates[i + 1]] > 0) {
          currentStreak = tempStreak;
        }
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        if (i === dates.length - 1) currentStreak = 0;
        tempStreak = 0;
      }
    }

    return { currentStreak, maxStreak };
  }, []);

  // Fetch contribution history with abort controller for cleanup
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const controller = new AbortController();
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const { items, stats } = await fetchContributions(effectiveUserId, 365);
        
        if (!isMounted) return;
        
        const contribMap = buildContributionMap(currentDate, items);
        setContributions(contribMap);
        
        // Calculate statistics
        const total = Object.values(contribMap).reduce((sum, count) => sum + count, 0);
        const streaks = calculateStreaks(contribMap);
        const activeDays = Object.values(contribMap).filter((c) => c > 0).length;
        const totalDays = Object.keys(contribMap).length;
        setContributionStats({
          total,
          ...streaks,
          activeDays,
          totalDays,
          oneOnOneSessions: stats?.oneOnOneSessions || 0,
          interviewSessions: stats?.interviewSessions || 0,
          skillMateConnections: stats?.skillMateConnections || 0,
          dailyLogins: stats?.dailyLogins || 0,
          questionsPosted: stats?.questionsPosted || 0,
          videosUploaded: stats?.videosUploaded || 0,
        });
      } catch (e) {
        if (!isMounted || e.name === 'AbortError') return;
        console.error('Failed to fetch contributions', e);
        setError('Failed to load contributions');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    run();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [effectiveUserId, currentDate, calculateStreaks]);

  // Live updates: listen for backend contribution-updated events
  useEffect(() => {
    if (!effectiveUserId) return;
    
    let timeoutId;
    const handler = async () => {
      // Debounce rapid updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        try {
          const { items, stats } = await fetchContributions(effectiveUserId, 365);
          const contribMap = buildContributionMap(currentDate, items);
          setContributions(contribMap);
          
          // Update statistics
          const total = Object.values(contribMap).reduce((sum, count) => sum + count, 0);
          const streaks = calculateStreaks(contribMap);
          const activeDays = Object.values(contribMap).filter((c) => c > 0).length;
          const totalDays = Object.keys(contribMap).length;
          setContributionStats({
            total,
            ...streaks,
            activeDays,
            totalDays,
            oneOnOneSessions: stats?.oneOnOneSessions || 0,
            interviewSessions: stats?.interviewSessions || 0,
            skillMateConnections: stats?.skillMateConnections || 0,
            dailyLogins: stats?.dailyLogins || 0,
            questionsPosted: stats?.questionsPosted || 0,
            videosUploaded: stats?.videosUploaded || 0,
          });
        } catch {
          // non-blocking
        }
      }, 300); // 300ms debounce
    };
    
    socket.on('contribution-updated', handler);
    return () => {
      clearTimeout(timeoutId);
      socket.off('contribution-updated', handler);
    };
  }, [effectiveUserId, currentDate, calculateStreaks]);

  return (
    <>
      {loading ? (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4 sm:p-5 animate-pulse">
          <div className="h-6 bg-blue-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 mb-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-blue-100 rounded-lg p-2 h-16"></div>
            ))}
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="min-w-[50px] space-y-1">
                <div className="h-3 bg-blue-100 rounded mb-2"></div>
                {[...Array(7)].map((_, j) => (
                  <div key={j} className="flex gap-1">
                    {[...Array(5)].map((_, k) => (
                      <div key={k} className="w-3 h-3 bg-blue-100 rounded-sm"></div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : (
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4 sm:p-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
            <h3 className="text-base sm:text-lg font-bold text-blue-900">Contribution Activity</h3>
            <select
              className="bg-white border border-gray-300 text-gray-700 text-xs px-2.5 py-1.5 rounded-lg hover:border-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}
              onChange={(e) => e.preventDefault()}
            >
              <option>{`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}</option>
            </select>
          </div>

          {/* Compact Statistics Grid - Unified Light Blue Theme */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 mb-3">
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">Active Days</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.activeDays}</p>
              <p className="text-[9px] text-blue-600">of {contributionStats.totalDays}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">Current Streak</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.currentStreak}</p>
              <p className="text-[9px] text-blue-600">days</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">Best Streak</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.maxStreak}</p>
              <p className="text-[9px] text-blue-600">days</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">1:1 Sessions</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.oneOnOneSessions}</p>
              <p className="text-[9px] text-blue-600">completed</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">Interviews</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.interviewSessions}</p>
              <p className="text-[9px] text-blue-600">completed</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">SkillMates</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.skillMateConnections}</p>
              <p className="text-[9px] text-blue-600">connections</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">Daily Logins</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.dailyLogins}</p>
              <p className="text-[9px] text-blue-600">days</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">Questions</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.questionsPosted}</p>
              <p className="text-[9px] text-blue-600">posted</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5">Videos</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.videosUploaded}</p>
              <p className="text-[9px] text-blue-600">uploaded</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 hover:border-blue-300 transition-colors">
              <p className="text-[10px] text-blue-700 mb-0.5 font-medium">Total</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{contributionStats.total}</p>
              <p className="text-[9px] text-blue-600">contributions</p>
            </div>
          </div>

          {/* Activity Legend */}
          <div className="flex items-center justify-center gap-2 mb-3 text-xs font-medium text-blue-700">
            <span>Less</span>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 bg-white rounded border border-gray-300 shadow-sm"></div>
              <div className="w-3 h-3 bg-blue-200 rounded border border-blue-200 shadow-sm"></div>
              <div className="w-3 h-3 bg-blue-400 rounded border border-blue-400 shadow"></div>
              <div className="w-3 h-3 bg-blue-600 rounded border border-blue-600 shadow-md"></div>
              <div className="w-3 h-3 bg-blue-900 rounded border border-blue-900 shadow-md"></div>
            </div>
            <span>More</span>
          </div>

          {/* Calendar Grid - Compact & Professional */}
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex gap-1 sm:gap-1.5 py-1" style={{maxWidth: '100%'}}>
              {months.map((month, monthIdx) => {
                const { name, year, days, monthIndex } = month;

                const firstDay = new Date(year, monthIndex, 1).getDay();
                const weeks = Math.ceil((firstDay + days) / 7);

                // Create empty grid
                const grid = Array(7)
                  .fill()
                  .map(() => Array(weeks).fill(null));

                // Fill grid with day numbers
                for (let day = 1; day <= days; day++) {
                  const dayIndex = (firstDay + day - 1) % 7;
                  const weekIndex = Math.floor((firstDay + day - 1) / 7);
                  grid[dayIndex][weekIndex] = day;
                }

                const boxClass = "w-2.5 h-2.5 rounded transition-all duration-200";

                return (
                  <div key={monthIdx} className="flex-shrink-0">
                    {/* Month label */}
                    <div className="text-[9px] text-blue-700 font-semibold text-center mb-1.5">
                      {name}
                    </div>

                    {/* Week rows */}
                    <div className="flex flex-col gap-0.5">
                      {grid.map((week, rowIdx) => (
                        <div key={rowIdx} className="flex gap-0.5">
                          {week.map((day, colIdx) => {
                            if (day === null) {
                              return (
                                <div
                                  key={colIdx}
                                  className={`${boxClass} bg-transparent`}
                                />
                              );
                            }

                            // Format date string in UTC to match backend keys (YYYY-MM-DD)
                            const dateStr = new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);

                            const count = contributions[dateStr] || 0;

                            return (
                              <div
                                key={colIdx}
                                className={`${boxClass} ${getContributionColor(
                                  count
                                )} hover:scale-110 hover:z-10 cursor-pointer relative group`}
                                title={`${name} ${day}, ${year}\n${count} contribution${count !== 1 ? 's' : ''}\n${getIntensityLabel(count)}`}
                                onMouseEnter={() => setHoveredDay({ date: dateStr, count, label: `${name} ${day}, ${year}` })}
                                onMouseLeave={() => setHoveredDay(null)}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hover Tooltip */}
          {hoveredDay && (
            <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900">{hoveredDay.label}</p>
              <p className="text-[10px] text-blue-700 mt-0.5">
                <span className="font-bold text-sm text-blue-700">{hoveredDay.count}</span> contribution{hoveredDay.count !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-blue-600 mt-0.5">{getIntensityLabel(hoveredDay.count)}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default React.memo(ContributionCalendar);
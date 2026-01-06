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

// Professional blue heatmap with clean, minimal separation
const getContributionColor = (count) => {
  // Empty day: white cell with subtle outline (premium, not noisy)
  if (count <= 0) return 'bg-white ring-1 ring-gray-200';
  if (count <= 2) return 'bg-blue-200 hover:bg-blue-300';
  if (count <= 5) return 'bg-blue-400 hover:bg-blue-500';
  if (count <= 9) return 'bg-blue-600 hover:bg-blue-700';
  return 'bg-blue-800 hover:bg-blue-900';
};

// Get intensity label
const getIntensityLabel = (count) => {
  if (count <= 0) return 'No activity';
  if (count <= 2) return 'Low activity';
  if (count <= 5) return 'Moderate activity';
  if (count <= 9) return 'High activity';
  return 'Very high activity';
};

const ContributionCalendar = ({ userId: propUserId, variant = 'card' }) => {
  const [contributions, setContributions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dayPopover, setDayPopover] = useState(null);
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
  const isTransparent = variant === 'transparent';

  const statCardClass =
    'bg-blue-50 rounded-lg sm:rounded-2xl p-1.5 sm:p-3 border border-blue-100 ring-1 ring-blue-100/40 shadow-sm min-w-0 ' +
    'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200';

  const showDayPopover = useCallback((e, payload, preferredPlacement) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const tooltipWidth = 220;
    const gutter = 10;

    let left = rect.left + rect.width / 2;
    const minLeft = gutter + tooltipWidth / 2;
    const maxLeft = window.innerWidth - gutter - tooltipWidth / 2;
    left = Math.max(minLeft, Math.min(maxLeft, left));

    let placement = preferredPlacement || 'top';
    if (placement !== 'bottom' && rect.top < 90) placement = 'bottom';

    const top = placement === 'bottom' ? rect.bottom + 10 : rect.top - 10;

    setDayPopover({
      ...payload,
      left,
      top,
      placement,
    });
  }, []);

  const hideDayPopover = useCallback(() => setDayPopover(null), []);
  
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
        <div className={isTransparent ? "bg-transparent p-0 animate-pulse" : "bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 animate-pulse"}>
          <div className="h-7 bg-gray-200 rounded w-56 mb-5"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl p-3 h-20"></div>
            ))}
          </div>
          <div className={isTransparent ? "flex gap-2 overflow-hidden bg-transparent rounded-xl p-0" : "flex gap-2 overflow-hidden bg-gray-50 rounded-xl p-4"}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="min-w-[60px] space-y-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                {[...Array(7)].map((_, j) => (
                  <div key={j} className="flex gap-1">
                    {[...Array(5)].map((_, k) => (
                      <div key={k} className="w-3 h-3 bg-gray-200 rounded-sm"></div>
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
        <div
          className={
            isTransparent
              ? "bg-transparent border-0 shadow-none p-0"
              : "bg-white rounded-none sm:rounded-2xl border-0 sm:border border-gray-200 shadow-none sm:shadow-sm p-3 sm:p-7"
          }
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
            <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900">Contribution Activity</h3>
            <select
              className={
                isTransparent
                  ? "bg-transparent border border-gray-300 text-gray-700 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg hover:border-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                  : "bg-white border border-gray-300 text-gray-700 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg hover:border-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              }
              value={`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}
              onChange={(e) => e.preventDefault()}
            >
              <option>{`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}</option>
            </select>
          </div>

          {/* Compact Statistics Grid - Mobile/Tablet: 5 cols per row */}
          <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-5 gap-1.5 sm:gap-3 mb-5 sm:mb-7">
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Active Days</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.activeDays}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">of {contributionStats.totalDays}</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Current Streak</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.currentStreak}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">days</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Best Streak</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.maxStreak}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">days</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">1:1 Sessions</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.oneOnOneSessions}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">completed</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Interviews</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.interviewSessions}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">completed</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">SkillMates</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.skillMateConnections}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">connections</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Daily Logins</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.dailyLogins}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">days</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Questions</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.questionsPosted}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">posted</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Videos</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.videosUploaded}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">uploaded</p>
            </div>
            <div className={statCardClass}>
              <p className="text-[9px] sm:text-xs text-gray-500 font-medium mb-0.5 sm:mb-1 truncate">Total</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">{contributionStats.total}</p>
              <p className="text-[7px] sm:text-[10px] text-gray-500 truncate">contributions</p>
            </div>
          </div>

          {/* Activity Legend */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 mb-3 sm:mb-5 text-[10px] sm:text-sm font-medium text-gray-600">
            <span>Less</span>
            <div className="flex gap-1 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-gray-100 rounded"></div>
              <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-blue-200 rounded"></div>
              <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-blue-400 rounded"></div>
              <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-blue-600 rounded"></div>
              <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-blue-800 rounded"></div>
            </div>
            <span>More</span>
          </div>

          {/* Calendar Grid - Compact & Professional */}
          <div
            className={
              isTransparent
                ? "overflow-x-auto bg-transparent rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200 shadow-sm"
                : "overflow-x-auto bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200 shadow-sm"
            }
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-1 sm:gap-2.5 py-1" style={{maxWidth: '100%'}}>
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

                const boxClass = "w-2 h-2 sm:w-3 sm:h-3 rounded-sm transition-all duration-200";

                return (
                  <div key={monthIdx} className="flex-shrink-0">
                    {/* Month label */}
                    <div className="text-[9px] sm:text-xs text-gray-700 font-bold text-center mb-1 sm:mb-2">
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

                            const payload = {
                              date: dateStr,
                              count,
                              label: `${name} ${day}, ${year}`,
                            };

                            return (
                              <div
                                key={colIdx}
                                className={`${boxClass} ${getContributionColor(count)} ${isTransparent ? 'cursor-pointer relative group' : 'hover:scale-110 hover:z-10 cursor-pointer relative group'}`}
                                onMouseEnter={(e) => showDayPopover(e, payload)}
                                onMouseLeave={hideDayPopover}
                                onClick={(e) => {
                                  if (dayPopover && dayPopover.date === payload.date) {
                                    setDayPopover(null);
                                    return;
                                  }
                                  showDayPopover(e, payload, 'bottom');
                                }}
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

            {/* Day details popover (single tooltip only) */}
            {dayPopover && (
              <div
                className="fixed z-50 w-[220px]"
                style={{ left: dayPopover.left, top: dayPopover.top, transform: dayPopover.placement === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)' }}
                onMouseLeave={hideDayPopover}
              >
                <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-2">
                  <p className="text-xs font-bold text-gray-900">{dayPopover.label}</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    <span className="font-bold text-sm text-blue-600">{dayPopover.count}</span> contribution{dayPopover.count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{getIntensityLabel(dayPopover.count)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(ContributionCalendar);
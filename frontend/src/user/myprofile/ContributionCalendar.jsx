import React, { useState, useEffect } from 'react';
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

// Color by contribution count with professional teal gradient
const getContributionColor = (count) => {
  if (count <= 0) return 'bg-slate-100 hover:bg-slate-200';
  if (count === 1) return 'bg-teal-100 hover:bg-teal-200';
  if (count === 2) return 'bg-teal-200 hover:bg-teal-300';
  if (count === 3) return 'bg-teal-300 hover:bg-teal-400';
  if (count === 4) return 'bg-teal-400 hover:bg-teal-500';
  if (count === 5) return 'bg-teal-500 hover:bg-teal-600';
  if (count === 6) return 'bg-teal-600 hover:bg-teal-700';
  if (count >= 10) return 'bg-teal-700 hover:bg-teal-800';
  return 'bg-teal-700 hover:bg-teal-800'; // 7-9
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
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

  // Set current date + calendar update
  useEffect(() => {
    const updateDate = () => {
      const newDate = new Date();
      setCurrentDate(newDate);
      setMonths(generateMonths(newDate));
    };

    updateDate();
    const interval = setInterval(updateDate, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate streaks
  const calculateStreaks = (contribMap) => {
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
  };

  // Fetch contribution history
  useEffect(() => {
    const run = async () => {
      if (!effectiveUserId) return;
      setLoading(true);
      setError(null);
      try {
        const { items, stats } = await fetchContributions(effectiveUserId, 365);
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
        console.error('Failed to fetch contributions', e);
        setError('Failed to load contributions');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [currentDate, effectiveUserId]);

  // Live updates: listen for backend contribution-updated events and refetch
  useEffect(() => {
    if (!effectiveUserId) return;
    const handler = async () => {
      try {
        const { items, stats } = await fetchContributions(effectiveUserId, 365);
        const contribMap = buildContributionMap(new Date(), items);
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
    };
    socket.on('contribution-updated', handler);
    return () => socket.off('contribution-updated', handler);
  }, [effectiveUserId]);

  return (
    <>
      {loading ? (
        <p className="text-slate-500 text-sm">Loading contribution calendar...</p>
      ) : error ? (
        <p className="text-rose-600 text-sm">{error}</p>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <h3 className="text-lg font-bold text-black">Contribution Activity</h3>
            <select
              className="bg-white border border-slate-300 text-slate-700 text-sm px-3 py-1.5 rounded-md hover:border-teal-500 transition focus:outline-none focus:ring-2 focus:ring-teal-500"
              value={`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}
              onChange={(e) => e.preventDefault()}
            >
              <option>{`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}</option>
            </select>
          </div>

          {/* Compact Statistics Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Active Days</p>
              <p className="text-xl font-bold text-black">
                {contributionStats.activeDays}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">of {contributionStats.totalDays}</p>
            </div>
            <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
              <p className="text-xs text-teal-700 mb-1">Current Streak</p>
              <p className="text-xl font-bold text-black">{contributionStats.currentStreak}</p>
              <p className="text-[10px] text-teal-600 mt-1">days</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-700 mb-1">Best Streak</p>
              <p className="text-xl font-bold text-black">{contributionStats.maxStreak}</p>
              <p className="text-[10px] text-purple-600 mt-1">days</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
              <p className="text-xs text-emerald-700 mb-1">1:1 Sessions</p>
              <p className="text-xl font-bold text-black">{contributionStats.oneOnOneSessions}</p>
              <p className="text-[10px] text-emerald-600 mt-1">completed</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs text-amber-700 mb-1">Interviews</p>
              <p className="text-xl font-bold text-black">{contributionStats.interviewSessions}</p>
              <p className="text-[10px] text-amber-600 mt-1">completed</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-700 mb-1">SkillMates</p>
              <p className="text-xl font-bold text-black">{contributionStats.skillMateConnections}</p>
              <p className="text-[10px] text-blue-600 mt-1">connections</p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
              <p className="text-xs text-indigo-700 mb-1">Daily Logins</p>
              <p className="text-xl font-bold text-black">{contributionStats.dailyLogins}</p>
              <p className="text-[10px] text-indigo-600 mt-1">days</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-200">
              <p className="text-xs text-rose-700 mb-1">Questions</p>
              <p className="text-xl font-bold text-black">{contributionStats.questionsPosted}</p>
              <p className="text-[10px] text-rose-600 mt-1">posted</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
              <p className="text-xs text-cyan-700 mb-1">Videos</p>
              <p className="text-xl font-bold text-black">{contributionStats.videosUploaded}</p>
              <p className="text-[10px] text-cyan-600 mt-1">uploaded</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Total</p>
              <p className="text-xl font-bold text-black">{contributionStats.total}</p>
              <p className="text-[10px] text-slate-500 mt-1">contributions</p>
            </div>
          </div>

          {/* Activity Legend */}
          <div className="flex items-center gap-2 mb-4 text-xs text-slate-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-slate-100 rounded-sm border border-slate-200"></div>
              <div className="w-3 h-3 bg-teal-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-teal-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-teal-600 rounded-sm"></div>
              <div className="w-3 h-3 bg-teal-700 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto hide-scrollbar pb-2">
            <div className="flex gap-2 sm:gap-3 md:gap-4 min-w-max">
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

                const boxClass = "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm";

                return (
                  <div key={monthIdx} className="min-w-[50px] sm:min-w-[60px]">
                    {/* Month label */}
                    <div className="text-[10px] text-slate-700 font-medium text-center mb-2">
                      {name} {year}
                    </div>

                    {/* Week rows */}
                    <div className="flex flex-col gap-1">
                      {grid.map((week, rowIdx) => (
                        <div key={rowIdx} className="flex gap-1">
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
                                )} hover:ring-2 hover:ring-teal-500 hover:ring-offset-1 transition-all duration-200 cursor-pointer relative group border border-slate-200/50`}
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
            <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm font-semibold text-black">{hoveredDay.label}</p>
              <p className="text-xs text-slate-700 mt-1">
                <span className="font-bold text-lg text-teal-700">{hoveredDay.count}</span> contribution{hoveredDay.count !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-slate-600 mt-1">{getIntensityLabel(hoveredDay.count)}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ContributionCalendar;
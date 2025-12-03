import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import socket from '../../socket';

// Fetch dynamic contributions for the last N days
async function fetchContributions(userId, rangeDays = 365) {
  const res = await api.get(`/api/contributions/${userId}?rangeDays=${rangeDays}`);
  return res.data.items || [];
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

// Color by contribution count with enhanced gradient
const getContributionColor = (count) => {
  if (count <= 0) return 'bg-gray-100 hover:bg-gray-200';
  if (count === 1) return 'bg-blue-200 hover:bg-blue-300';
  if (count === 2) return 'bg-blue-300 hover:bg-blue-400';
  if (count === 3) return 'bg-blue-400 hover:bg-blue-500';
  if (count === 4) return 'bg-blue-500 hover:bg-blue-600';
  if (count === 5) return 'bg-blue-600 hover:bg-blue-700';
  if (count === 6) return 'bg-blue-700 hover:bg-blue-800';
  if (count >= 10) return 'bg-gradient-to-br from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950';
  return 'bg-blue-800 hover:bg-blue-900'; // 7-9
};

// Get intensity label
const getIntensityLabel = (count) => {
  if (count <= 0) return 'No activity';
  if (count <= 2) return 'Low activity';
  if (count <= 5) return 'Moderate activity';
  if (count <= 9) return 'High activity';
  return 'Very high activity';
};

const ContributionCalendar = () => {
  const [contributions, setContributions] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [contributionStats, setContributionStats] = useState({ total: 0, maxStreak: 0, currentStreak: 0 });
  const { user } = useAuth();

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
      if (!user || !user._id) return;
      setLoading(true);
      setError(null);
      try {
        const items = await fetchContributions(user._id, 365);
        const contribMap = buildContributionMap(currentDate, items);
        setContributions(contribMap);
        
        // Calculate statistics
        const total = Object.values(contribMap).reduce((sum, count) => sum + count, 0);
        const streaks = calculateStreaks(contribMap);
        setContributionStats({ total, ...streaks });
      } catch (e) {
        console.error('Failed to fetch contributions', e);
        setError('Failed to load contributions');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [currentDate, user]);

  // Live updates: listen for backend contribution-updated events and refetch
  useEffect(() => {
    if (!user || !user._id) return;
    const handler = async () => {
      try {
        const items = await fetchContributions(user._id, 365);
        const contribMap = buildContributionMap(new Date(), items);
        setContributions(contribMap);
        
        // Update statistics
        const total = Object.values(contribMap).reduce((sum, count) => sum + count, 0);
        const streaks = calculateStreaks(contribMap);
        setContributionStats({ total, ...streaks });
      } catch {
        // non-blocking
      }
    };
    socket.on('contribution-updated', handler);
    return () => socket.off('contribution-updated', handler);
  }, [user]);

  return (
    <>
      {loading ? (
        <p className="text-gray-500">Loading contribution calendar...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-blue-900">Contribution Activity</h3>
            <select
              className="bg-transparent border border-blue-600 text-gray-700 text-sm px-3 py-1.5 rounded-md hover:bg-blue-600 hover:text-white transition"
              value={`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}
              onChange={(e) => e.preventDefault()}
            >
              <option>{`${currentDate.getFullYear() - 1}-${currentDate.getFullYear()}`}</option>
            </select>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-600 font-medium mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-900">{contributionStats.total}</p>
              <p className="text-[10px] text-blue-600">contributions</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
              <p className="text-xs text-green-600 font-medium mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-green-900">{contributionStats.currentStreak}</p>
              <p className="text-[10px] text-green-600">days</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">Best Streak</p>
              <p className="text-2xl font-bold text-purple-900">{contributionStats.maxStreak}</p>
              <p className="text-[10px] text-purple-600">days</p>
            </div>
          </div>

          {/* Activity Legend */}
          <div className="flex items-center gap-2 mb-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded-sm border border-gray-200"></div>
              <div className="w-3 h-3 bg-blue-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-600 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-800 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex gap-4">
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

                const boxClass = "w-3 h-2 rounded-sm";

                return (
                  <div key={monthIdx} className="min-w-[60px]">
                    {/* Month label */}
                    <div className="text-[10px] text-blue-900 font-medium text-center mb-2">
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
                                )} hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all duration-200 cursor-pointer relative group`}
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
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">{hoveredDay.label}</p>
              <p className="text-xs text-blue-700 mt-1">
                <span className="font-bold text-lg">{hoveredDay.count}</span> contribution{hoveredDay.count !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-600 mt-1">{getIntensityLabel(hoveredDay.count)}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ContributionCalendar;
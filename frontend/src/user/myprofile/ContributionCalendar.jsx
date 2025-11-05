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

// Color by contribution count
const getContributionColor = (count) => {
  if (count <= 0) return 'bg-gray-100';
  if (count === 1) return 'bg-blue-200';
  if (count === 2) return 'bg-blue-300';
  if (count === 3) return 'bg-blue-400';
  if (count === 4) return 'bg-blue-500';
  if (count === 5) return 'bg-blue-600';
  if (count === 6) return 'bg-blue-700';
  return 'bg-blue-800'; // 7+
};

const ContributionCalendar = () => {
  const [contributions, setContributions] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  // Fetch contribution history
  useEffect(() => {
    const run = async () => {
      if (!user || !user._id) return;
      setLoading(true);
      setError(null);
      try {
        const items = await fetchContributions(user._id, 365);
        setContributions(buildContributionMap(currentDate, items));
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
        setContributions(buildContributionMap(new Date(), items));
      } catch {
        // non-blocking
      }
    };
    socket.on('contribution-updated', handler);
    return () => socket.off('contribution-updated', handler);
  }, [user]);

  const totalContributions = Object.values(contributions).reduce(
    (sum, count) => sum + count,
    0
  );

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

          {/* Total Contributions */}
          <p className="text-sm text-gray-700 mb-4">
            {totalContributions} Contributions in the last year
          </p>

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
                                )} hover:border hover:border-blue-300 transition cursor-pointer`}
                                title={`${name} ${day}, ${year} - ${count} contribution${count !== 1 ? 's' : ''}`}
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
        </div>
      )}
    </>
  );
};

export default ContributionCalendar;
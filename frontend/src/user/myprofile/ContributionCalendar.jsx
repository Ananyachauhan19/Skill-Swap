import React, { useState, useEffect } from 'react';

// Static history simulation
async function fetchUserHistory() {
  try {
    const staticHistory = [
      { date: '2025-07-09', sessions: ['React Workshop', 'Node.js Q&A'] },
      { date: '2025-07-08', sessions: ['JavaScript Basics'] },
    ];
    return staticHistory;
  } catch {
    throw new Error('Failed to fetch history');
  }
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

// Generate contribution counts by date
const generateContributionData = (currentDate, history) => {
  const contributions = {};
  const endDate = new Date(currentDate);
  const startDate = new Date(currentDate);
  startDate.setDate(startDate.getDate() - 364);

  let current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    contributions[dateStr] = 0;
    current.setDate(current.getDate() + 1);
  }

  history.forEach((entry) => {
    const dateStr = entry.date;
    if (contributions[dateStr] !== undefined) {
      contributions[dateStr] += entry.sessions.length;
    }
  });

  return contributions;
};

// Color by contribution count
const getContributionColor = (count) => {
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-blue-200';
  if (count === 2) return 'bg-blue-400';
  if (count === 3) return 'bg-blue-600';
  return 'bg-blue-800';
};

const ContributionCalendar = () => {
  const [history, setHistory] = useState([]);
  const [contributions, setContributions] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    setLoading(true);
    fetchUserHistory()
      .then((data) => {
        setHistory(data);
        setContributions(generateContributionData(currentDate, data));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentDate]);

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
                const { name, year, days } = month;

                const monthIndex = months.findIndex(
                  (m) => m.name === name && m.year === year
                );

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

                            // Format date string
                            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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
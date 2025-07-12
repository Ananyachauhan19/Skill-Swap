import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import CoinsBadges from '../myprofile/CoinsBadges';
import { fetchSilverCoinBalance, fetchGoldenCoinBalance } from '../settings/CoinBalance.jsx';
import { BACKEND_URL } from '../../config.js';

// --- Helper to fetch user history from backend ---
async function fetchUserHistory() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/history`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user history');
    }

    const data = await response.json();
    
    // Transform backend data to match frontend expectations
    // If the backend doesn't have this endpoint yet, return empty array
    return data.history || data.sessions || [];
  } catch (error) {
    console.error('Error fetching user history:', error);
    // Return empty array if endpoint doesn't exist yet
    return [];
  }
}

// --- Helper to generate dynamic months for the past 365 days ---
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

    if (!months.some(m => m.name === monthName && m.year === year)) {
      months.push({
        name: monthName,
        year: year,
        days: current.getMonth() === endDate.getMonth() && current.getFullYear() === endDate.getFullYear()
          ? endDate.getDate()
          : daysInMonth,
      });
    }
    current.setMonth(current.getMonth() + 1);
    current.setDate(1);
  }

  return months;
};

// --- Generate contribution data for the past 365 days ---
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

  history.forEach(entry => {
    const dateStr = entry.date;
    if (contributions[dateStr] !== undefined) {
      contributions[dateStr] += entry.sessions.length;
    }
  });

  return contributions;
};

// --- Helper to get contribution color ---
const getContributionColor = (count) => {
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-blue-200';
  if (count === 2) return 'bg-blue-400';
  if (count === 3) return 'bg-blue-600';
  return 'bg-blue-800';
};

const HomePage = () => {
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [history, setHistory] = useState([]);
  const [contributions, setContributions] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [months, setMonths] = useState(generateMonths(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Fetch coin balances ---
  useEffect(() => {
    async function loadCoins() {
      try {
        const silverData = await fetchSilverCoinBalance();
        setSilver(silverData.silver ?? 0);
        const goldData = await fetchGoldenCoinBalance();
        setGold(goldData.gold ?? 0);
      } catch {
        toast.error('Failed to fetch coin balances.');
      }
    }
    loadCoins();
  }, []);

  // --- Daily update for current date and calendar ---
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

  // --- Fetch history and update contributions ---
  useEffect(() => {
    setLoading(true);
    fetchUserHistory()
      .then(data => {
        setHistory(data);
        setContributions(generateContributionData(currentDate, data));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentDate]);

  // --- Render Contribution Calendar ---
  const renderContributionCalendar = () => {
    const totalContributions = Object.values(contributions).reduce(
      (sum, count) => sum + count,
      0
    );

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
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

        <p className="text-sm text-gray-700 mb-4">
          {totalContributions} Contributions in the last year
        </p>

        <div className="overflow-x-auto hide-scrollbar">
          <div className="flex gap-4">
            {months.map((month, idx) => {
              const { name, year, days } = month;
              const firstDay = new Date(year, months.findIndex(m => m.name === name && m.year === year), 1).getDay();
              const weeks = Math.ceil((firstDay + days) / 7);

              const grid = Array(7)
                .fill()
                .map(() => Array(weeks).fill(null));

              for (let day = 1; day <= days; day++) {
                const dayIndex = (firstDay + day - 1) % 7;
                const weekIndex = Math.floor((firstDay + day - 1) / 7);
                grid[dayIndex][weekIndex] = day;
              }

              const boxClass = "w-3 h-2 rounded-none";

              return (
                <div key={idx} className="min-w-[60px]">
                  <div className="text-[10px] text-blue-900 font-medium text-center mb-2">
                    {name} {year}
                  </div>
                  <div className="flex flex-col gap-1">
                    {grid.map((week, rowIndex) => (
                      <div key={rowIndex} className="flex gap-1">
                        {week.map((day, colIndex) => {
                          if (day === null) {
                            return (
                              <div key={colIndex} className={`${boxClass} bg-transparent`} />
                            );
                          }

                          const dateStr = `${year}-${String(
                            months.findIndex(m => m.name === name && m.year === year) + 1
                          ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

                          const count = contributions[dateStr] || 0;

                          return (
                            <div
                              key={colIndex}
                              className={`${boxClass} ${getContributionColor(count)} hover:border hover:border-blue-300 transition cursor-pointer`}
                              title={`${name} ${day}, ${year} - ${count} contributions`}
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
    );
  };

  return (
    <div className="min-h-screen bg-blue-50 pt-24 px-2 sm:px-4 md:px-8 lg:px-12 py-8">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Coin System */}
        <CoinsBadges silver={silver} gold={gold} profile={{ badges: ['Starter', 'Helper'], rank: 'Bronze', credits: 1200 }} />
        {/* Contribution Calendar */}
        {loading ? (
          <p>Loading contributions...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          renderContributionCalendar()
        )}
      </div>
    </div>
  );
};

export default HomePage;
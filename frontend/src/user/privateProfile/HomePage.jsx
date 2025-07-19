import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import CoinsBadges from '../myprofile/CoinsBadges';
import ContributionCalendar from '../myprofile/ContributionCalendar';
import { BACKEND_URL } from '../../config.js';
import socket from '../../socket.js'; // Import socket for real-time updates

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
  const [activeTab, setActiveTab] = useState('coins');

  // Fetch coin data and set up socket listener
  useEffect(() => {
    async function loadCoins() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/coins`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch coin balances');
        }
        const data = await response.json();
        setSilver(data.silver || 0);
        setGold(data.golden || 0);
      } catch {
        toast.error('Failed to fetch coin balances.');
      }
    }
    loadCoins();

    // Listen for real-time coin updates
    socket.on('coin-update', (data) => {
      if (typeof data.silverCoins === 'number') {
        setSilver(data.silverCoins);
      }
    });

    // Cleanup socket listener on unmount
    return () => {
      socket.off('coin-update');
    };
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 pt-24 px-2 sm:px-4 md:px-8 lg:px-12 py-8">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {/* Nav Tabs */}
        <div className="flex gap-4 border-b border-blue-200 mb-4">
          <button
            onClick={() => setActiveTab('coins')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${
              activeTab === 'coins'
                ? 'bg-white text-blue-900 border border-blue-300 border-b-transparent'
                : 'text-gray-600 hover:text-blue-800'
            }`}
          >
            Coins & Badges
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 text-sm font-medium rounded-t-md ${
              activeTab === 'calendar'
                ? 'bg-white text-blue-900 border border-blue-300 border-b-transparent'
                : 'text-gray-600 hover:text-blue-800'
            }`}
          >
            Contribution Calendar
          </button>
        </div>

        {/* Tabs Content */}
        {activeTab === 'coins' && (
          <CoinsBadges
            silver={silver}
            gold={gold}
            profile={{
              badges: ['Starter', 'Helper'],
              rank: 'Bronze',
              credits: 1200,
            }}
          />
        )}

        {activeTab === 'calendar' && <ContributionCalendar />}
      </div>
    </div>
  );
};

export default HomePage;
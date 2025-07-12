import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import CoinsBadges from '../myprofile/CoinsBadges';
import ContributionCalendar from '../myprofile/ContributionCalendar';
import {
  fetchSilverCoinBalance,
  fetchGoldenCoinBalance,
} from '../settings/CoinBalance.jsx';

const HomePage = () => {
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [activeTab, setActiveTab] = useState('coins');

  // Fetch coin data
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
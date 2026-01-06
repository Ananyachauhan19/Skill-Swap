import React, { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { BACKEND_URL } from '../../config.js';
import socket from '../../socket.js';
import PrivateCoinsBadges from './PrivateCoinsBadges.jsx';

const HomePage = () => {
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [bronze, setBronze] = useState(0);
  const [rank, setRank] = useState('Unranked');
  const [badges, setBadges] = useState([]);

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
        setBronze(data.bronze || 0);
      } catch {
        toast.error('Failed to fetch coin balances.');
      }
    }

    async function loadBadgesAndRank() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return;
        const data = await response.json();
        setRank(data.rank || 'Unranked');
        setBadges(Array.isArray(data.badges) ? data.badges : []);
      } catch {
        // Non-blocking
      }
    }

    loadCoins();
    loadBadgesAndRank();

    // Listen for real-time coin updates
    socket.on('coin-update', (data) => {
      if (typeof data.silverCoins === 'number') {
        setSilver(data.silverCoins);
      }
      if (typeof data.goldCoins === 'number') {
        setGold(data.goldCoins);
      }
      if (typeof data.bronzeCoins === 'number') {
        setBronze(data.bronzeCoins);
      }
    });

    // Cleanup socket listener on unmount
    return () => {
      socket.off('coin-update');
    };
  }, []);

  return (
    <div className="w-full">
      <Toaster position="top-center" />
      <div className="py-3 sm:py-4">
        <PrivateCoinsBadges silver={silver} gold={gold} bronze={bronze} rank={rank} badges={badges} />
      </div>
    </div>
  );
};

export default HomePage;
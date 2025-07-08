import React, { useState, useEffect } from "react";
import { fetchSilverCoinBalance, fetchGoldenCoinBalance } from '../../user/settings/CoinBalance';

const Credits = ({ isLoggedIn }) => {
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCoins() {
      try {
        const silverData = await fetchSilverCoinBalance();
        setSilver(silverData.silver ?? 0);
        const goldData = await fetchGoldenCoinBalance();
        setGold(goldData.gold ?? 0);
      } catch {
        setError("Failed to load coin balances.");
      }
    }
    if (isLoggedIn) loadCoins();
  }, [isLoggedIn]);

  if (!isLoggedIn) return null;
  return (
    <div className="flex gap-2 sm:gap-4 items-center">
      {error && <div className="text-red-600 text-xs">{error}</div>}
      <div
        className="flex items-center gap-2 text-base font-medium px-3 py-1 rounded-md bg-yellow-400 text-yellow-900 transition-all duration-300 hover:bg-yellow-300 hover:shadow-lg hover:scale-105"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" fill="#FFD700" />
          <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#fff">G</text>
        </svg>
        <span>{gold} Golden</span>
      </div>
      <div
        className="flex items-center gap-2 text-base font-medium px-3 py-1 rounded-md bg-gray-200 text-blue-900 transition-all duration-300 hover:bg-gray-100 hover:shadow-lg hover:scale-105"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" fill="#C0C0C0" />
          <text x="12" y="16" textAnchor="middle" fontSize="12" fill="#333">S</text>
        </svg>
        <span>{silver} Silver</span>
      </div>
    </div>
  );
};

export default Credits;

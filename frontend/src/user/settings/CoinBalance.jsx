import React, { useState, useEffect } from "react";
import { BACKEND_URL } from '../../config.js';

// --- Backend function: Fetch current silver coin balance ---
async function fetchSilverCoinBalance() {
  const res = await fetch(`${BACKEND_URL}/api/coins/silver`);
  if (!res.ok) throw new Error('Failed to fetch silver coin balance');
  return res.json();
}
// --- Backend function: Fetch current golden coin balance ---
async function fetchGoldenCoinBalance() {
  const res = await fetch(`${BACKEND_URL}/api/coins/golden`);
  if (!res.ok) throw new Error('Failed to fetch golden coin balance');
  return res.json();
}

const CoinBalance = () => {
  const [silver, setSilver] = useState(0);
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBalances() {
      setLoading(true);
      setError("");
      try {
        const silverData = await fetchSilverCoinBalance();
        setSilver(silverData.silver ?? 0);
        const goldData = await fetchGoldenCoinBalance();
        setGold(goldData.gold ?? 0);
      } catch (err) {
        setError("Failed to load coin balances.");
      } finally {
        setLoading(false);
      }
    }
    loadBalances();
  }, []);

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-md w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto text-center">
        <h2 className="text-xl font-bold mb-4">Current Silver & Golden Coin Balance</h2>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <div className="flex items-center gap-2 text-lg">
              <span className="text-yellow-500 font-bold">🪙 Silver:</span> <span>{silver}</span>
            </div>
            <div className="flex items-center gap-2 text-lg">
              <span className="text-yellow-700 font-bold">🏅 Gold:</span> <span>{gold}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Only export fetchSilverCoinBalance and fetchGoldenCoinBalance for backend-driven display
export { fetchSilverCoinBalance, fetchGoldenCoinBalance };

export default CoinBalance;

import React, { useState, useEffect } from "react";

// --- Backend function: Fetch current silver coin balance ---
async function fetchSilverCoinBalance() {
  const res = await fetch('/api/coins/silver');
  if (!res.ok) throw new Error('Failed to fetch silver coin balance');
  return res.json();
}
// --- Backend function: Fetch current golden coin balance ---
async function fetchGoldenCoinBalance() {
  const res = await fetch('/api/coins/golden');
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
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100 text-center">
        <h2 className="text-2xl font-semibold text-blue-900 mb-6">Current Coin Balance</h2>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        {loading ? (
          <div className="text-blue-600 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        ) : (
          <div className="flex flex-col gap-4 items-center">
            <div className="flex items-center gap-2 text-lg">
              <span className="text-yellow-600 font-semibold">🪙 Silver:</span>
              <span className="text-blue-900">{silver}</span>
            </div>
            <div className="flex items-center gap-2 text-lg">
              <span className="text-yellow-700 font-semibold">🏅 Gold:</span>
              <span className="text-blue-900">{gold}</span>
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
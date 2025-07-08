import React, { useState, useEffect } from "react";

// Backend function: Fetch coin spending/usage history
// async function fetchCoinSpendingHistory() {
//   return fetch('/api/coins/spending-history').then(res => res.json());
// }
const FILTERS = ["Daily", "Weekly", "Monthly"];

function groupHistory(history, filter) {
  if (!history.length) return {};
  return history.reduce((acc, item) => {
    let key;
    if (filter === "Daily") {
      key = item.date;
    } else if (filter === "Weekly") {
      const d = new Date(item.date);
      const year = d.getFullYear();
      const week = getWeekNumber(d);
      key = `${year}-W${week}`;
    } else if (filter === "Monthly") {
      const d = new Date(item.date);
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    }
    if (!acc[key]) acc[key] = { date: key, silver: 0, golden: 0, types: [] };
    if (item.coinType === "silver") acc[key].silver += 1;
    if (item.coinType === "golden") acc[key].golden += 1;
    acc[key].types.push(item.type);
    return acc;
  }, {});
}

function getWeekNumber(d) {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

const CoinSpendingHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Daily");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchCoinSpendingHistory();
        // setHistory(data);
        setHistory([
          { date: '2025-07-02', coinType: 'silver', type: 'Session Booking' },
          { date: '2025-07-02', coinType: 'golden', type: 'Session Booking' },
          { date: '2025-06-29', coinType: 'silver', type: 'Resource Purchase' },
          { date: '2025-06-29', coinType: 'silver', type: 'Resource Purchase' },
        ]); // Remove when backend is ready
      } catch (err) {
        setError("Failed to load spending history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const grouped = groupHistory(history, filter);
  const groupedArr = Object.entries(grouped)
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Coin Spending / Usage History</h2>
        <div className="flex justify-center mb-4 gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : groupedArr.length === 0 ? (
          <div className="text-center text-gray-500">No spending history found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-blue-900">
                <th className="py-2">{filter === 'Daily' ? 'Date' : filter === 'Weekly' ? 'Week' : 'Month'}</th>
                <th className="py-2">Silver Coins</th>
                <th className="py-2">Golden Coins</th>
                <th className="py-2">Types</th>
              </tr>
            </thead>
            <tbody>
              {groupedArr.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{item.date}</td>
                  <td className="py-2">{item.silver}</td>
                  <td className="py-2">{item.golden}</td>
                  <td className="py-2">{[...new Set(item.types)].join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CoinSpendingHistory;

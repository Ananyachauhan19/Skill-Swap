
import React, { useState, useEffect } from "react";

// Backend function: Fetch coin spending/usage history
// async function fetchCoinSpendingHistory() {
//   return fetch('/api/coins/spending-history').then(res => res.json());
// }
const CoinSpendingHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchCoinSpendingHistory();
        // setHistory(data);
        setHistory([
          { date: '2025-07-02', amount: -8, type: 'Session Booking' },
          { date: '2025-06-29', amount: -3, type: 'Resource Purchase' },
        ]); // Remove when backend is ready
      } catch (err) {
        setError("Failed to load spending history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Coin Spending / Usage History</h2>
        {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500">No spending history found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-blue-900">
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Type</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{item.date}</td>
                  <td className="py-2">{item.amount}</td>
                  <td className="py-2">{item.type}</td>
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

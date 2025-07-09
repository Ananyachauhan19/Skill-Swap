import React, { useState, useEffect } from "react";

// Backend function: Fetch coin earning history
// async function fetchCoinEarningHistory() {
//   return fetch('/api/coins/earning-history').then(res => res.json());
// }

const CoinEarningHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchCoinEarningHistory();
        // setHistory(data);
        setHistory([
          { date: '2025-07-01', amount: 10, type: 'Session Completed' },
          { date: '2025-06-28', amount: 5, type: 'Referral Bonus' },
        ]); // Remove when backend is ready
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError("Failed to load earning history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Coin Earning History</h2>
        {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-blue-600 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-blue-600">No earning history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-blue-900 bg-blue-50">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Type</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr key={i} className="border-t border-blue-100">
                    <td className="py-3 px-4 text-blue-900">{item.date}</td>
                    <td className="py-3 px-4 text-blue-900">{item.amount}</td>
                    <td className="py-3 px-4 text-blue-900">{item.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoinEarningHistory;
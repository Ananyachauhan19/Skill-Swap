import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

// Backend function: Fetch coin earning history
// async function fetchCoinEarningHistory() {
//   return fetch('/api/coins/earning-history').then(res => res.json());
// }

const CoinEarningHistory = () => {
  const [history, setHistory] = useState([]);
  const [displayedHistory, setDisplayedHistory] = useState([]);
  const [view, setView] = useState("Daily"); // Default view
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to aggregate data based on view
  const aggregateHistory = (data, viewType) => {
    // Only allow three types
    const allowedTypes = [
      "One-on-one session",
      "Live session unlock",
      "Uploaded video unlock"
    ];
    const filtered = data.filter(item => allowedTypes.includes(item.type));
    if (viewType === "Daily") {
      // Map each item to gold/silver columns
      return filtered.map(item => ({
        date: item.date,
        gold: ["Live session unlock", "Uploaded video unlock"].includes(item.type) ? item.amount : 0,
        silver: item.type === "One-on-one session" ? item.amount : 0,
        type: item.type
      }));
    }

    const grouped = {};
    filtered.forEach((item) => {
      const date = new Date(item.date);
      let key;

      if (viewType === "Weekly") {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split("T")[0];
      } else if (viewType === "Monthly") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, gold: 0, silver: 0, types: [] };
      }
      if (["Live session unlock", "Uploaded video unlock"].includes(item.type)) {
        grouped[key].gold += item.amount;
      } else if (item.type === "One-on-one session") {
        grouped[key].silver += item.amount;
      }
      grouped[key].types.push(item.type);
    });

    return Object.values(grouped).map((item) => ({
      date: item.date,
      gold: item.gold,
      silver: item.silver,
      type: item.types.join(", "),
    }));
  };

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchCoinEarningHistory();
        // setHistory(data);
        const sampleData = [
          { date: "2025-07-01", amount: 10, type: "One-on-one session" },
          { date: "2025-06-28", amount: 5, type: "Live session unlock" },
          { date: "2025-06-27", amount: 7, type: "Uploaded video unlock" },
        ]; // Remove when backend is ready
        setHistory(sampleData);
        setDisplayedHistory(aggregateHistory(sampleData, view));
      } catch (err) {
        setError("Failed to load earning history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Update displayed history when view changes
  useEffect(() => {
    setDisplayedHistory(aggregateHistory(history, view));
  }, [view, history]);

  // Delete a single row
  const handleDelete = (idx) => {
    setHistory((prev) => {
      const newHistory = prev.filter((_, i) => i !== idx);
      setDisplayedHistory(aggregateHistory(newHistory, view));
      return newHistory;
    });
  };

  // Clear all history
  const handleClearAll = () => {
    setHistory([]);
    setDisplayedHistory([]);
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-900 text-center flex-1">Coin Earning History</h2>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="ml-4 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs"
              title="Clear All"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            {["Daily", "Weekly", "Monthly"].map((viewType) => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-4 py-2 text-sm font-medium ${
                  view === viewType
                    ? "bg-blue-600 text-white"
                    : "bg-white text Sistine Chapel text-blue-900 hover:bg-blue-50"
                } border border-blue-200 ${
                  viewType === "Daily" ? "rounded-l-md" : viewType === "Monthly" ? "rounded-r-md" : ""
                }`}
              >
                {viewType}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-blue-600 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </div>
        ) : displayedHistory.length === 0 ? (
          <div className="text-center text-blue-600">No earning history found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-blue-900 bg-blue-50">
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Gold Coins</th>
                  <th className="py-3 px-4 text-left">Silver Coins</th>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-center w-8"></th>
                </tr>
              </thead>
              <tbody>
                {displayedHistory.map((item, i) => (
                  <tr key={i} className="border-t border-blue-100">
                    <td className="py-3 px-4 text-blue-900">{item.date}</td>
                    <td className="py-3 px-4 text-blue-900">{item.gold || 0}</td>
                    <td className="py-3 px-4 text-blue-900">{item.silver || 0}</td>
                    <td className="py-3 px-4 text-blue-900">{item.type}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(i)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <FaTimes />
                      </button>
                    </td>
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
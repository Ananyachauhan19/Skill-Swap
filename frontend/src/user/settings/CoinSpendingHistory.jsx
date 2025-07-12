import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";

const CoinSpendingHistory = () => {
  const [history, setHistory] = useState([]);
  const [displayedHistory, setDisplayedHistory] = useState([]);
  const [view, setView] = useState("Daily");
  const [activeTab, setActiveTab] = useState("Coins");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Aggregate data based on view
  const aggregateHistory = (data, viewType) => {
    if (viewType === "Daily") {
      return data;
    }

    const grouped = {};
    data.forEach((item) => {
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
        grouped[key] = { date: key, gold: 0, silver: 0, amount: 0, types: [] };
      }
      if (item.type === "One-on-one session") {
        grouped[key].silver += item.amount;
      } else if (item.type === "Live session unlock" || item.type === "Uploaded video unlock") {
        grouped[key].gold += item.amount;
      } else {
        grouped[key].amount += item.amount;
      }
      grouped[key].types.push(item.type);
    });

    return Object.values(grouped).map((item) => ({
      date: item.date,
      gold: item.gold,
      silver: item.silver,
      amount: item.amount,
      type: item.types.join(", "),
    }));
  };

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        const sampleData = [
         { date: "2025-07-02", silver: -10, type: "One-on-one session" },
          { date: "2025-07-03", gold: -5, type: "Live session unlock" },
          { date: "2025-07-04", gold: -7, type: "Uploaded video unlock" },
          { date: "2025-07-05", amount: 1500, type: "GD" },
          { date: "2025-07-06", amount: 500, type: "Interview" },
        ];
        setHistory(sampleData);
        setDisplayedHistory(aggregateHistory(sampleData.filter(item => 
          activeTab === "Coins" ? !["GD", "Interview"].includes(item.type) : ["GD", "Interview"].includes(item.type)
        ), view));
      } catch (err) {
        setError("Failed to load history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [activeTab]);

  useEffect(() => {
    setDisplayedHistory(aggregateHistory(history.filter(item => 
      activeTab === "Coins" ? !["GD", "Interview"].includes(item.type) : ["GD", "Interview"].includes(item.type)
    ), view));
  }, [view, history]);

  const handleDelete = (idx) => {
    setHistory((prev) => {
      const newHistory = prev.filter((_, i) => i !== idx);
      setDisplayedHistory(aggregateHistory(newHistory.filter(item => 
        activeTab === "Coins" ? !["GD", "Interview"].includes(item.type) : ["GD", "Interview"].includes(item.type)
      ), view));
      return newHistory;
    });
  };

  const handleClearAll = () => {
    setHistory([]);
    setDisplayedHistory([]);
  };

  const gdSessions = displayedHistory.filter(item => item.type === "GD");
  const interviewSessions = displayedHistory.filter(item => item.type === "Interview");
  const gdTotal = gdSessions.reduce((sum, item) => sum + item.amount, 0);
  const interviewTotal = interviewSessions.reduce((sum, item) => sum + item.amount, 0);

  const goldCoins = displayedHistory.reduce((sum, item) => sum + (item.gold || 0), 0);
  const silverCoins = displayedHistory.reduce((sum, item) => sum + (item.silver || 0), 0);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-blue-900 text-center flex-1">
            Coin/Payment History
          </h2>
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
            {["Coins", "Payments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-white text-blue-900 hover:bg-blue-50"
                } border border-blue-200 ${
                  tab === "Coins" ? "rounded-l-md" : "rounded-r-md"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
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
                    : "bg-white text-blue-900 hover:bg-blue-50"
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
          <div className="text-center text-blue-600">No {activeTab.toLowerCase()} history found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-blue-900 bg-blue-50">
                    <th className="py-3 px-4 text-left">Date</th>
                    {activeTab === "Coins" ? (
                      <>
                        <th className="py-3 px-4 text-left">Gold Coins</th>
                        <th className="py-3 px-4 text-left">Silver Coins</th>
                      </>
                    ) : (
                      <th className="py-3 px-4 text-left">Amount (₹)</th>
                    )}
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedHistory.map((item, i) => (
                    <tr key={i} className="border-t border-blue-100">
                      <td className="py-3 px-4 text-blue-900">{item.date}</td>
                      {activeTab === "Coins" ? (
                        <>
                          <td className="py-3 px-4 text-blue-900">{item.gold}</td>
                          <td className="py-3 px-4 text-blue-900">{item.silver}</td>
                        </>
                      ) : (
                        <td className="py-3 px-4 text-blue-900">{item.amount}</td>
                      )}
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
            {activeTab === "Payments" && (
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Payment Summary</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span>GD Sessions (₹1500 each):</span>
                    <span>{gdSessions.length} session{gdSessions.length !== 1 ? 's' : ''} — <span className="font-semibold">₹{gdTotal}</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interview Sessions (₹500 each):</span>
                    <span>{interviewSessions.length} session{interviewSessions.length !== 1 ? 's' : ''} — <span className="font-semibold">₹{interviewTotal}</span></span>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Coins" && (
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Coin Summary</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span>Total Gold Coins:</span>
                    <span className="font-semibold">{goldCoins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Silver Coins:</span>
                    <span className="font-semibold">{silverCoins}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoinSpendingHistory;
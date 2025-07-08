import React, { useEffect, useState } from "react";

// Backend function: Fetch support history
// async function fetchSupportHistory() {
//   const res = await fetch('/api/support/history');
//   return res.json();
// }

const SupportHistory = () => {
  // Static fallback data for development/demo
  const [history, setHistory] = useState([]);

  // useEffect(() => {
  //   fetchSupportHistory().then(setHistory);
  // }, []);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded-xl shadow border border-blue-100 mt-8">
      <h1 className="text-2xl font-bold mb-6 text-blue-900 text-center">Support History</h1>
      <div className="bg-blue-50 rounded p-4 min-h-[60px] text-sm">
        {history.length ? history.map(h => (
          <div key={h.id} className="mb-2">
            <div className="font-bold text-blue-900">{h.subject}</div>
            <div className="text-gray-700">{h.description}</div>
            <div className="text-xs text-gray-500">Status: {h.status}</div>
          </div>
        )) : <span className="text-gray-500">No support history found.</span>}
      </div>
    </div>
  );
};

export default SupportHistory;

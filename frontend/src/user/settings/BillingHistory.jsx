import React, { useState, useEffect } from "react";

// Backend function: Fetch billing history
// async function fetchBillingHistory() {
//   return fetch('/api/payments/billing-history').then(res => res.json());
// }
const BillingHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchBillingHistory();
        // setHistory(data);
        setHistory([]); // Remove when backend is ready
      } catch (err) {
        setError("Failed to load billing history.");
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center pt-16 md:pt-[72px] lg:pt-20">
      <div className="max-w-2xl w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Billing History</h2>
        {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500">No billing history found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-blue-900">
                <th className="py-2">Date</th>
                <th className="py-2">Description</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{item.date}</td>
                  <td className="py-2">{item.description}</td>
                  <td className="py-2">{item.amount}</td>
                  <td className="py-2">{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BillingHistory;

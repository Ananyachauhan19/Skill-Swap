import React, { useState, useEffect } from "react";

// Backend function: Fetch active subscriptions/packages
// async function fetchActiveSubscriptions() {
//   return fetch('/api/payments/subscriptions').then(res => res.json());
// }
const ActiveSubscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubs() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchActiveSubscriptions();
        // setSubs(data);
        setSubs([]); // Remove when backend is ready
      } catch (err) {
        setError("Failed to load subscriptions.");
      } finally {
        setLoading(false);
      }
    }
    loadSubs();
  }, []);

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center pt-16 md:pt-[72px] xl:pt-20">
      <div className="max-w-2xl w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Active Subscriptions / Packages</h2>
        {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : subs.length === 0 ? (
          <div className="text-center text-gray-500">No active subscriptions.</div>
        ) : (
          <ul className="flex flex-col gap-4 mb-6">
            {subs.map((s, i) => (
              <li key={i} className="flex flex-col gap-1 border-b pb-2">
                <span className="font-semibold text-blue-900">{s.name}</span>
                <span className="text-xs text-gray-500">{s.status} • {s.renewalDate}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ActiveSubscriptions;

import React, { useState, useEffect } from "react";

// Backend function: Fetch saved payment methods
// async function fetchPaymentMethods() {
//   return fetch('/api/payments/methods').then(res => res.json());
// }
const SavedPaymentMethods = () => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMethods() {
      setLoading(true);
      setError("");
      try {
        // const data = await fetchPaymentMethods();
        // setMethods(data);
        setMethods([]); // Remove when backend is ready
      } catch (err) {
        setError("Failed to load payment methods.");
      } finally {
        setLoading(false);
      }
    }
    loadMethods();
  }, []);

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-lg w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Saved Payment Methods</h2>
        {error && <div className="text-red-600 text-sm mb-2 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : methods.length === 0 ? (
          <div className="text-center text-gray-500">No saved payment methods.</div>
        ) : (
          <ul className="flex flex-col gap-4 mb-6">
            {methods.map((m, i) => (
              <li key={i} className="flex flex-col gap-1 border-b pb-2">
                <span className="font-semibold text-blue-900">{m.type} •••• {m.last4}</span>
                <span className="text-xs text-gray-500">Expires: {m.expiry}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SavedPaymentMethods;

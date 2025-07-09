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
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Saved Payment Methods</h2>
        {error && <div className="text-red-600 text-sm mb-4 text-center">{error}</div>}
        {loading ? (
          <div className="text-center text-blue-600 flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center text-blue-600">No saved payment methods.</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {methods.map((m, i) => (
              <li key={i} className="flex flex-col gap-1 border-b border-blue-100 pb-3">
                <span className="font-semibold text-blue-900">{m.type} •••• {m.last4}</span>
                <span className="text-xs text-blue-600">Expires: {m.expiry}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SavedPaymentMethods;
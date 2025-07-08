import React, { useEffect, useState } from 'react';
import BuyRedeemCoins from './settings/BuyRedeemCoins';
import ActiveSubscriptions from './settings/ActiveSubscriptions';

const PackageHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('/api/package/history')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch package history');
        return res.json();
      })
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load package history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full max-w-4xl mx-auto mt-10 mb-16 bg-white rounded-xl shadow border border-blue-100 p-6">
      <h2 className="text-xl font-bold mb-4 text-blue-900">Package Purchase History</h2>
      {loading ? (
        <div className="text-blue-700 text-lg font-semibold py-8 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-lg font-semibold py-8 text-center">{error}</div>
      ) : history.length === 0 ? (
        <div className="text-gray-500 text-center">No package history found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-100">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase">Package</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase">Coins</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase">Value</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50">
              {history.map((pkg, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 text-blue-900 font-medium">{pkg.name}</td>
                  <td className="px-4 py-2">{pkg.coins}</td>
                  <td className="px-4 py-2">{pkg.value}</td>
                  <td className="px-4 py-2">{pkg.date ? new Date(pkg.date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

const Package = () => (
  <div className="w-full min-h-screen bg-blue-50 pb-10">
    <ActiveSubscriptions/>
    {/*Redeem Plan */}
    <BuyRedeemCoins />
    {/*History of past packages */}
    <PackageHistory />
  </div>
);

export default Package;

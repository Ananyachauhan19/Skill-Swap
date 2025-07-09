import React, { useState, useEffect } from "react";

// Backend function: Fetch offers from backend (admin panel)
// async function fetchOffers() {
//   const res = await fetch('/api/offers');
//   return res.json();
// }
// Backend function: Buy coins
// async function buyCoins(offerId) {
//   return fetch('/api/purchase', { method: 'POST', body: JSON.stringify({ offerId }) });
// }

// Static fallback data for development/demo
const staticOffers = [
  {
    id: "silver_1m",
    name: "Silver Starter (1 Month)",
    coins: "200 Silver Coins",
    value: "₹50",
    type: "silver"
  },
  {
    id: "golden_1m",
    name: "Golden Pro (1 Month)",
    coins: "50 Golden Coins",
    value: "₹100",
    type: "golden"
  },
  {
    id: "combo_1m",
    name: "Combo Pack (1 Month)",
    coins: "100 Silver + 20 Golden",
    value: "₹60",
    type: "combo"
  },
  {
    id: "silver_6m",
    name: "Silver Starter (6 Months)",
    coins: "1200 Silver Coins",
    value: "₹270",
    type: "silver"
  },
  {
    id: "combo_12m",
    name: "Combo Pack (1 Year)",
    coins: "1200 Silver + 240 Golden",
    value: "₹720",
    type: "combo"
  }
];

const BuyRedeemCoins = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [offers, setOffers] = useState(staticOffers);
  const [previous, setPrevious] = useState(staticOffers[0]); // Simulate previous offer
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Fetch offers from backend (uncomment when backend is ready)
  // useEffect(() => {
  //   fetchOffers().then(setOffers);
  // }, []);

  const handleBuy = async (offerId) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await buyCoins(offerId);
      const offer = offers.find(o => o.id === offerId);
      setMessage(`Purchased ${offer.name} successfully!`);
      setPrevious(offer);
    } catch (err) {
      setError("Failed to purchase coins.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPlan = async () => {
    setCancelLoading(true);
    setCancelMsg("");
    setCancelError("");
    try {
      const res = await fetch('/api/cancel-plan', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to cancel plan');
      setCancelMsg('Plan cancelled successfully.');
    } catch (err) {
      setCancelError('Failed to cancel plan.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
        <h2 className="text-2xl font-semibold text-blue-900 text-center mb-6">Buy More Coins</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Buy previous offer again */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col items-center">
            <h4 className="text-lg font-semibold text-blue-800 mb-3">Buy Previous Offer Again</h4>
            <p className="text-2xl font-bold text-blue-900 mb-1">{previous.coins}</p>
            <p className="text-base text-blue-600 mb-2">Worth {previous.value}</p>
            <span className="text-xs text-blue-700 mb-4">Your last purchased offer</span>
            <button
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
              onClick={() => handleBuy(previous.id)}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                'Buy Again'
              )}
            </button>
            <button
              className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold shadow hover:bg-red-700 transition duration-200 disabled:bg-red-400 mt-4"
              onClick={handleCancelPlan}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </div>
              ) : (
                'Cancel Current Plan'
              )}
            </button>
            {cancelMsg && <p className="text-green-600 text-sm mt-3 text-center">{cancelMsg}</p>}
            {cancelError && <p className="text-red-600 text-sm mt-3 text-center">{cancelError}</p>}
          </div>
          {/* Option 2: Buy another offer (show all offers except previous) */}
          <div className="bg-white border border-blue-200 rounded-lg p-6 flex flex-col">
            <h4 className="text-lg font-semibold text-blue-800 mb-3 text-center">Buy Another Offer</h4>
            <div className="grid grid-cols-1 gap-4">
              {offers.filter(pkg => pkg.id !== previous.id).map((pkg) => (
                <div key={pkg.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center">
                  <span className="font-semibold text-blue-800">{pkg.name}</span>
                  <span className="text-blue-900 font-bold">{pkg.coins}</span>
                  <span className="text-blue-600">Worth {pkg.value}</span>
                  <button
                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition duration-200 disabled:bg-blue-400 mt-2"
                    onClick={() => handleBuy(pkg.id)}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </div>
                    ) : (
                      `Purchase ${pkg.name}`
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default BuyRedeemCoins;
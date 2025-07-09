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
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center justify-center">
      <div className="max-w-8xl w-full p-6 bg-white rounded-xl shadow border border-blue-100 mt-8 mx-auto">
        <h2 className="text-xl font-bold mb-4 text-center">Buy More Coins</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {/* Option 1: Buy previous offer again */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col items-center">
            <h4 className="font-bold text-lg text-blue-800 mb-2">Buy Previous Offer Again</h4>
            <p className="text-2xl font-bold text-blue-900 mb-1">{previous.coins}</p>
            <p className="text-base text-gray-700 mb-2">Worth {previous.value}</p>
            <span className="text-xs text-blue-700 mb-3">Your last purchased offer</span>
            <button className="bg-blue-700 text-white px-6 py-2 rounded font-semibold mt-2 shadow hover:bg-blue-800 transition-all duration-200" onClick={() => handleBuy(previous.id)} disabled={loading}>
              {loading ? 'Processing...' : 'Buy Again'}
            </button>
            <button className="bg-red-600 text-white px-6 py-2 rounded font-semibold mt-4 shadow hover:bg-red-700 transition-all duration-200 w-full" onClick={handleCancelPlan} disabled={cancelLoading}>
              {cancelLoading ? 'Cancelling...' : 'Cancel Current Plan'}
            </button>
            {cancelMsg && <p className="text-green-600 text-sm mt-2 text-center">{cancelMsg}</p>}
            {cancelError && <p className="text-red-600 text-sm mt-2 text-center">{cancelError}</p>}
          </div>
          {/* Option 2: Buy another offer (show all offers except previous) */}
          <div className="bg-white border border-blue-200 rounded-lg p-6 flex flex-col items-center">
            <h4 className="font-bold text-lg text-blue-900 mb-2">Buy Another Offer</h4>
            <div className="grid grid-cols-1 gap-4 w-full">
              {offers.filter(pkg => pkg.id !== previous.id).map((pkg) => (
                <div key={pkg.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center">
                  <span className="font-bold text-blue-800">{pkg.name}</span>
                  <span className="text-blue-900 font-bold">{pkg.coins}</span>
                  <span className="text-gray-700">Worth {pkg.value}</span>
                  <button className="bg-blue-700 text-white px-6 py-2 rounded font-semibold mt-2 shadow hover:bg-blue-800 transition-all duration-200" onClick={() => handleBuy(pkg.id)} disabled={loading}>
                    {loading ? 'Processing...' : `Purchase ${pkg.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default BuyRedeemCoins;

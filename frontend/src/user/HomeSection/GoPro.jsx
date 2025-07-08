import React, { useState, useEffect } from "react";

// Backend function: Fetch offers from backend (admin panel)
// async function fetchOffers() {
//   const res = await fetch('/api/offers');
//   return res.json();
// }
// Backend function: Buy coins
// async function purchasePackage(offerId) {
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

const GoPro = () => {
  const [offers, setOffers] = useState(staticOffers);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch offers from backend (uncomment when backend is ready)
  // useEffect(() => {
  //   fetchOffers().then(setOffers);
  // }, []);

  const handlePurchase = async (offerId) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // await purchasePackage(offerId);
      const offer = offers.find(o => o.id === offerId);
      setMessage(`Purchased ${offer.name} successfully!`);
    } catch (err) {
      setError("Failed to purchase package.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-10xl mx-auto p-8 sm:p-12 my-12 bg-white rounded-xl shadow-lg border border-blue-100 text-gray-800">
      <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-6 text-center">SkillSwapHub Pro Features</h1>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">Skill Coin Packages</h2>
        <ul className="list-disc list-inside space-y-3 text-base">
          <li><b>Silver Coin Packages:</b> Buy Silver Skill Coins for live 1-on-1 sessions. <b>Worth:</b> ₹0.25 per Silver Skill Coin. (Package sizes and bonus coins coming soon!)</li>
          <li><b>Golden Coin Packages:</b> Buy Golden Skill Coins for unlocking premium content and live/recorded sessions. <b>Worth:</b> ₹2 per Golden Skill Coin. (Package sizes and bonus coins coming soon!)</li>
          <li><b>Combo Packages:</b> Get a mix of Golden and Silver Skill Coins at a special price. (Details about combo offers will be available soon!)</li>
        </ul>
        <p className="mt-3 text-sm text-yellow-800">Stay tuned for more details and the ability to purchase packages directly from your dashboard!</p>
      </section>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">How Skill Coins Work</h2>
        <ul className="list-disc list-inside space-y-3 text-base">
          <li><b>Two types of Skill Coins:</b> <br />
            - <b>Golden Skill Coin</b>: Worth ₹2 per coin.<br />
            - <b>Silver Skill Coin</b>: Worth ₹0.25 per coin.
          </li>
          <li><b>1-on-1 Live Sessions:</b> Book using Silver Skill Coins. 1 Silver Skill Coin per minute. At session end, total coins (duration in minutes) are transferred from learner to tutor.</li>
          <li><b>Group Discussions (GD):</b> GDs are job-based. Search for your job and book a GD. Price: ₹1500 per head for each GD.</li>
          <li><b>Interview Rounds:</b> Book by job type with an expert. Price: ₹500 per head per interview session.</li>
          <li><b>Go Live or Upload Recorded Sessions:</b> Unlock a recorded session: 2 Golden Skill Coins. Watch a full live session: 2 Golden Skill Coins.</li>
          <li><b>Referral Rewards:</b> Bring your friends and earn Skill Coins for each successful referral!</li>
        </ul>
      </section>
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-blue-800">Why Go Pro?</h2>
        <ul className="list-disc list-inside space-y-3 text-base">
          <li>Unlock exclusive Skill Coin packages and bonus offers.</li>
          <li>Access premium content and live/recorded sessions.</li>
          <li>Enjoy priority support and early access to new features.</li>
          <li>Track your Skill Coin usage and payment history in your dashboard.</li>
          <li>Special combo deals for power users and professionals.</li>
        </ul>
      </section>
      <div className="text-center mt-8">
        <h3 className="text-xl font-semibold mb-4 text-blue-900">Available Packages</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {offers.map((offer) => (
            <div key={offer.id} className={`bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col items-center`}>
              <h4 className="font-bold text-lg text-blue-800 mb-2">{offer.name}</h4>
              <p className="text-2xl font-bold text-blue-900 mb-1">{offer.coins}</p>
              <p className="text-base text-gray-700 mb-2">Worth {offer.value}</p>
              <span className="text-xs text-blue-700 mb-3">{offer.type === 'combo' ? 'Best for all-rounders' : offer.type === 'silver' ? 'For 1-on-1 sessions' : 'For premium content'}</span>
              <button className="bg-blue-700 text-white px-6 py-2 rounded font-semibold mt-2 shadow hover:bg-blue-800 transition-all duration-200" onClick={() => handlePurchase(offer.id)} disabled={loading}>
                {loading ? 'Processing...' : `Purchase ${offer.name}`}
              </button>
            </div>
          ))}
        </div>
        {message && <p className="text-green-600 text-sm mt-2 text-center">{message}</p>}
        {error && <p className="text-red-600 text-sm mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default GoPro;

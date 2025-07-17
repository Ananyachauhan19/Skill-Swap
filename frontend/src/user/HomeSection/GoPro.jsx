import React, { useState, useEffect } from "react";

// Static offers data (replace with API call when backend is ready)
const staticOffers = [
  {
    id: "silver-100",
    name: "Silver Starter",
    type: "silver",
    coins: "100 Silver Coins",
    value: "₹25",
  },
  {
    id: "golden-50",
    name: "Golden Pro",
    type: "golden",
    coins: "50 Golden Coins",
    value: "₹100",
  },
  {
    id: "combo-1",
    name: "Combo Elite",
    type: "combo",
    coins: "50 Silver + 25 Golden Coins",
    value: "₹75",
  },
];

// Backend function: Fetch offers from backend (admin panel)
// async function fetchOffers() {
//   const res = await fetch('/api/offers');
//   return res.json();
// }
// Backend function: Buy coins
// async function purchasePackage(offerId) {
//   return fetch('/api/purchase', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ offerId }),
//   }).then(res => res.json());
// }

const GoPro = () => {
  const [offers, setOffers] = useState(staticOffers);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);

  // Uncomment this when backend API is ready
  // useEffect(() => {
  //   const loadOffers = async () => {
  //     try {
  //       const data = await fetchOffers();
  //       setOffers(data);
  //     } catch (err) {
  //       setError("Failed to load offers. Please try again later.");
  //     }
  //   };
  //   loadOffers();
  // }, []);

  const handlePurchase = async (offerId) => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const offer = offers.find((o) => o.id === offerId);
      if (!offer) throw new Error("Offer not found");
      setSelectedOffer(offerId);
      // Simulate API delay for better UX (replace with actual API call)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // Uncomment when backend is ready
      // await purchasePackage(offerId);
      setMessage(`Purchased ${offer.name} successfully!`);
    } catch (err) {
      setError("Failed to purchase package. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setSelectedOffer(null), 2000);
    }
  };

  // Badge component for offer types
  const OfferBadge = ({ type }) => {
    const typeStyles = {
      silver: "bg-gray-100 text-gray-800 border-gray-300",
      golden: "bg-yellow-100 text-yellow-800 border-yellow-300",
      combo: "bg-purple-100 text-purple-800 border-purple-300",
    };

    return (
      <span
        className={`text-xs font-semibold px-3 py-1 rounded-full border ${
          typeStyles[type] || typeStyles.silver
        }`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-4 tracking-tight">
            SkillSwapHub <span className="text-blue-600">Pro</span> Features
          </h1>
          <p className="text-lg text-blue-800 max-w-3xl mx-auto">
            Unlock premium features and maximize your learning potential with our
            exclusive Skill Coin packages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          {/* Left Column */}
          <div className="space-y-12">
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-900">
                  Skill Coin Packages
                </h2>
              </div>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Silver Coin Packages:</b> Buy Silver Skill Coins for live
                    1-on-1 sessions. <b>Worth:</b> ₹0.25 per Silver Skill Coin.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Golden Coin Packages:</b> Buy Golden Skill Coins for
                    unlocking premium content. <b>Worth:</b> ₹2 per Golden Skill
                    Coin.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Combo Packages:</b> Get a mix of Golden and Silver Skill
                    Coins at a special price.
                  </p>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Stay tuned for more details and the ability to purchase packages
                  directly from your dashboard!
                </p>
              </div>
            </section>

            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-900">Why Go Pro?</h2>
              </div>
              <ul className="space-y-4 text-gray-700">
                {[
                  "Unlock exclusive Skill Coin packages and bonus offers",
                  "Access premium content and live/recorded sessions",
                  "Enjoy priority support and early access to new features",
                  "Track your Skill Coin usage and payment history",
                  "Special combo deals for power users and professionals",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="ml-3">{item}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right Column */}
          <div>
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-100 mb-12 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start mb-4">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue-900">
                  How Skill Coins Work
                </h2>
              </div>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Two types of Skill Coins:</b>
                    <br />- <b>Golden Skill Coin</b>: Worth ₹2 per coin
                    <br />- <b>Silver Skill Coin</b>: Worth ₹0.25 per coin
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>1-on-1 Live Sessions:</b> Book using Silver Skill Coins (1
                    coin per minute)
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Group Discussions:</b> ₹1500 per head for each GD session
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Interview Rounds:</b> ₹500 per head per interview session
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Premium Content:</b> 2 Golden Coins to unlock recorded or
                    live sessions
                  </p>
                </li>
              </ul>
            </section>
          </div>
        </div>

        {/* Packages Section */}
        <section className="text-center">
          <h3 className="text-3xl font-bold text-blue-900 mb-4">
            Available Packages
          </h3>
          <p className="text-blue-800 max-w-2xl mx-auto mb-12">
            Choose the perfect package for your learning journey. All packages
            come with bonus coins and exclusive benefits.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`bg-white rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300 hover:-translate-y-2 ${
                  selectedOffer === offer.id
                    ? "border-blue-500 shadow-xl ring-4 ring-blue-100"
                    : "border-blue-100"
                }`}
              >
                <div
                  className={`p-1 ${
                    offer.type === "silver"
                      ? "bg-gray-300"
                      : offer.type === "golden"
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-300"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500"
                  }`}
                ></div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <OfferBadge type={offer.type} />
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {offer.type === "combo" ? "POPULAR" : "LIMITED"}
                    </span>
                  </div>

                  <h4 className="font-bold text-xl text-blue-900 mb-2">
                    {offer.name}
                  </h4>
                  <p className="text-3xl font-bold text-blue-800 mb-1">
                    {offer.coins}
                  </p>
                  <p className="text-base text-gray-700 mb-2">
                    Worth {offer.value}
                  </p>

                  <div className="my-6">
                    <button
                      className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                        selectedOffer === offer.id
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg"
                          : "bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 shadow-md"
                      }`}
                      onClick={() => handlePurchase(offer.id)}
                      disabled={loading}
                    >
                      {loading && selectedOffer === offer.id ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        `Purchase for ${offer.value}`
                      )}
                    </button>
                  </div>

                  <ul className="text-left text-sm text-gray-600 space-y-2 mt-4">
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {offer.type === "combo"
                        ? "Silver + Golden coins"
                        : `${
                            offer.type.charAt(0).toUpperCase() +
                            offer.type.slice(1)
                          } coins only`}
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {offer.id.includes("6m") || offer.id.includes("12m")
                        ? "Long-term validity"
                        : "30 days validity"}
                    </li>
                    <li className="flex items-center">
                      <svg
                        className="h-5 w-5 text-green-500 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {offer.type === "combo"
                        ? "Bonus coins included"
                        : "No expiration"}
                    </li>
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {message && (
            <div className="animate-fadeIn fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-6 py-3 rounded-xl shadow-lg">
              <div className="flex items-center">
                <svg
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{message}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="animate-fadeIn fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-xl shadow-lg">
              <div className="flex items-center">
                <svg
                  className="h-6 w-6 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GoPro;
import React, { useState, useEffect } from "react";
import PackageCard from "../../components/PackageCard";
import { BACKEND_URL } from "../../config";

const GoPro = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Fetch active packages from backend
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/packages`, {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
          setPackages(data.data);
        } else {
          setError('Failed to load packages');
        }
      } catch (err) {
        console.error('Error fetching packages:', err);
        setError('Failed to load packages. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handlePurchase = async (packageId) => {
    setPurchaseLoading(true);
    setError("");
    setMessage("");
    setSelectedPackageId(packageId);
    
    try {
      const selectedPackage = packages.find((p) => p._id === packageId);
      if (!selectedPackage) throw new Error("Package not found");
      
      // Simulate API delay for better UX (replace with actual payment gateway API call)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // TODO: Integrate payment gateway here
      // await fetch(`${BACKEND_URL}/api/purchase`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ packageId }),
      //   credentials: 'include'
      // });
      
      setMessage(`Successfully purchased ${selectedPackage.name}!`);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Failed to purchase package. Please try again.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setPurchaseLoading(false);
      setTimeout(() => setSelectedPackageId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-16 sm:pt-20 pb-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4 tracking-tight">
            SkillSwapHub <span className="text-blue-600">Pro</span> Features
          </h1>
          <p className="text-base sm:text-lg text-blue-800 max-w-3xl mx-auto">
            Unlock premium features and maximize your learning potential with our
            exclusive Skill Coin packages
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-16">
          {/* Left Column */}
          <div className="space-y-8">
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start mb-4">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700"
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
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">
                  Skill Coin Packages
                </h2>
              </div>
              <ul className="space-y-4 text-gray-700 text-sm sm:text-base">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Silver Coin Packages:</b> Buy Silver Skill Coins for live
                    1-on-1 sessions.
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Golden Coin Packages:</b> Buy Golden Skill Coins for
                    unlocking premium content. 
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
                    className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600"
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

            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start mb-4">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700"
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
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Why Go Pro?</h2>
              </div>
              <ul className="space-y-4 text-gray-700 text-sm sm:text-base">
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
            <section className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-blue-100 mb-8 md:mb-12 transition-all duration-300 hover:shadow-xl">
              <div className="flex items-start mb-4">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-6 sm:w-6 text-blue-700"
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
                <h2 className="text-xl sm:text-2xl font-bold text-blue-900">
                  How Skill Coins Work
                </h2>
              </div>
              <ul className="space-y-4 text-gray-700 text-sm sm:text-base">
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
                    <b>Group Discussions:</b> ₹500 per head for each GD session
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <p className="ml-3">
                    <b>Interview Rounds:</b> ₹1500 per head per interview session
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
          <h3 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-4">
            Available Packages
          </h3>
          <p className="text-blue-800 max-w-2xl mx-auto mb-8 sm:mb-12 text-sm sm:text-base">
            Choose the perfect package for your learning journey. All packages
            come with instant delivery and exclusive benefits.
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg
                className="animate-spin h-10 w-10 text-blue-600"
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
            </div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No packages available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for new offers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg._id}
                  package={pkg}
                  onPurchase={handlePurchase}
                  isLoading={purchaseLoading}
                  selectedPackageId={selectedPackageId}
                />
              ))}
            </div>
          )}

          {message && (
            <div className="animate-fadeIn fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg w-11/12 sm:w-auto">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 mr-2"
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
                <span className="font-medium text-sm sm:text-base">{message}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="animate-fadeIn fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg w-11/12 sm:w-auto">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 mr-2"
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
                <span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default GoPro;
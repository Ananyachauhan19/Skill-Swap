import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
        
        console.log('Packages API Response:', data);
        
        if (data.success) {
          console.log('Package data:', data.data);
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

  // Separate packages by type
  const silverPackages = packages.filter(pkg => 
    pkg.type === 'Silver' || pkg.type === 'ONLY_SILVER'
  );
  const goldenPackages = packages.filter(pkg => 
    pkg.type === 'Golden' || pkg.type === 'ONLY_GOLDEN'
  );
  const comboPackages = packages.filter(pkg => 
    pkg.type === 'Combo' || pkg.type === 'COMBO'
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 sm:pt-24 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5" />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-6 leading-tight">
              Upgrade to SkillSwapHub Pro
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
              Unlock premium content, connect with top experts, and accelerate your learning journey with Skill Coins
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
              onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
            >
              Upgrade Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* 3-Step Process Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Three simple steps to unlock your full learning potential
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Buy Skill Coins",
                description: "Choose from Silver, Golden, or Combo packages that fit your learning goals. Silver coins (₹0.25 each) for one-on-one sessions. Golden coins (₹2 each) for uploaded videos and live arena access.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "02",
                title: "Use Your Coins",
                description: "Silver coins: 1 coin per minute for personalized one-on-one sessions. Golden coins: Access premium uploaded videos, join live arena sessions, and unlock exclusive content.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                color: "from-indigo-500 to-indigo-600"
              },
              {
                step: "03",
                title: "Grow Faster",
                description: "Learn from experts, earn recognition, and achieve your career goals. Get personalized mentorship and access to premium resources.",
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
                color: "from-purple-500 to-purple-600"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6 text-white p-3 group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <div className="absolute top-4 right-4 text-6xl font-bold text-gray-100 group-hover:text-gray-200 transition-colors">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Package
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Flexible pricing to match your learning needs. All packages come with instant delivery.
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <svg
                className="animate-spin h-12 w-12 text-blue-600"
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
            <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 text-xl font-semibold mb-2">No packages available</p>
              <p className="text-gray-500">Check back soon for new offers!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {packages.map((pkg, idx) => {
                const isGolden = pkg.type === 'Golden' || pkg.type === 'ONLY_GOLDEN';
                const isSilver = pkg.type === 'Silver' || pkg.type === 'ONLY_SILVER';
                const isCombo = pkg.type === 'Combo' || pkg.type === 'COMBO';
                const isMostPopular = isGolden && goldenPackages.length > 0 && pkg._id === goldenPackages[0]._id;
                
                // Normalize type display
                const displayType = isGolden ? 'Golden' : isSilver ? 'Silver' : 'Combo';
                
                // Get price - try different possible field names
                const displayPrice = pkg.priceInINR || pkg.price || pkg.amount || pkg.cost || 0;
                const displayOriginalPrice = pkg.originalPriceInINR || pkg.originalPrice || pkg.originalAmount || null;
                
                // Get coin counts - try different possible field names
                const goldenCoins = pkg.goldenCoins || pkg.goldCoins || pkg.coins || 0;
                const silverCoins = pkg.silverCoins || pkg.coins || 0;
                
                // Debug log for first package
                if (idx === 0) {
                  console.log('Package data structure:', pkg);
                  console.log('Display price:', displayPrice);
                  console.log('Golden coins:', goldenCoins);
                  console.log('Silver coins:', silverCoins);
                }
                
                // Define color schemes for each package type
                const colorSchemes = {
                  silver: {
                    badge: 'bg-gradient-to-br from-slate-400 via-slate-300 to-slate-500',
                    border: 'border-slate-200 hover:border-slate-400',
                    accentRing: 'ring-slate-200',
                    buttonBg: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800',
                    coinText: 'text-slate-700',
                    iconBg: 'bg-slate-50',
                    shadow: 'hover:shadow-slate-200/50'
                  },
                  golden: {
                    badge: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500',
                    border: 'border-amber-200 hover:border-amber-400',
                    accentRing: 'ring-amber-200',
                    buttonBg: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
                    coinText: 'text-amber-700',
                    iconBg: 'bg-amber-50',
                    shadow: 'hover:shadow-amber-200/50'
                  },
                  combo: {
                    badge: 'bg-gradient-to-br from-slate-300 via-amber-300 to-orange-400',
                    border: 'border-gradient-to-r from-slate-300 to-amber-300 hover:border-purple-400',
                    accentRing: 'ring-purple-200',
                    buttonBg: 'bg-gradient-to-r from-slate-600 via-purple-600 to-amber-600 hover:from-slate-700 hover:via-purple-700 hover:to-amber-700',
                    coinText: 'text-purple-700',
                    iconBg: 'bg-gradient-to-br from-slate-50 to-amber-50',
                    shadow: 'hover:shadow-purple-200/50'
                  }
                };
                
                const colors = isGolden ? colorSchemes.golden : isSilver ? colorSchemes.silver : colorSchemes.combo;
                
                return (
                  <motion.div
                    key={pkg._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="h-full flex"
                  >
                    <motion.div
                      whileHover={{ y: -8, scale: isMostPopular ? 1.03 : 1.02 }}
                      className={`relative bg-white rounded-3xl shadow-xl border-2 transition-all duration-300 overflow-hidden flex flex-col w-full
                        ${isMostPopular ? 'ring-4 ring-purple-200 shadow-2xl' : colors.border} 
                        ${colors.shadow}`}
                    >
                      {/* Most Popular Badge */}
                      {isMostPopular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white text-center py-2.5 text-xs font-bold uppercase tracking-wider z-10">
                          ⭐ Most Popular Choice
                        </div>
                      )}
                      
                      {/* Card Content */}
                      <div className={`flex flex-col flex-1 p-8 ${isMostPopular ? 'pt-16' : 'pt-8'}`}>
                        {/* Package Type Badge */}
                        <div className="flex items-center justify-between mb-5">
                          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-lg ${colors.badge}`}>
                            {isGolden && (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                            {isSilver && (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                              </svg>
                            )}
                            {isCombo && (
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                            {displayType}
                          </span>
                        </div>

                        {/* Package Name & Description */}
                        <div className="flex-grow">
                          <h3 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">{pkg.name || 'Package'}</h3>
                          <p className="text-gray-600 text-sm leading-relaxed h-12 overflow-hidden">{pkg.description || 'Skill coins package'}</p>
                        </div>

                        {/* Pricing */}
                        <div className="my-6 py-4 border-y border-gray-100">
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="text-4xl font-black text-gray-900">₹{displayPrice}</span>
                            {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                              <span className="text-base text-gray-400 line-through font-medium">₹{displayOriginalPrice}</span>
                            )}
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${colors.iconBg} ${colors.coinText}`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                            </svg>
                            {isGolden && (
                              <span>{goldenCoins} Golden Coins</span>
                            )}
                            {isSilver && (
                              <span>{silverCoins} Silver Coins</span>
                            )}
                            {isCombo && (
                              <span>
                                {goldenCoins} Golden + {silverCoins} Silver
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Purchase Button */}
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handlePurchase(pkg._id)}
                          disabled={purchaseLoading && selectedPackageId === pkg._id}
                          className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 shadow-lg hover:shadow-xl
                            ${colors.buttonBg}
                            text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {purchaseLoading && selectedPackageId === pkg._id ? (
                            <span className="flex items-center justify-center gap-2">
                              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Purchase Now
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </span>
                          )}
                        </motion.button>

                        {/* Features List */}
                        {pkg.features && pkg.features.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-gray-100">
                            <ul className="space-y-3">
                              {pkg.features.slice(0, 4).map((feature, fIdx) => (
                                <li key={fIdx} className="flex items-start gap-3 text-sm text-gray-700">
                                  <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="leading-tight">{feature}</span>
                                </li>
                              ))}
                              {pkg.features.length > 4 && (
                                <li className="text-xs text-gray-500 italic pl-8">
                                  +{pkg.features.length - 4} more features
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Compare Coin Types
            </h2>
            <p className="text-lg text-gray-600">
              Choose the right coins for your learning goals
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">Silver Coins</span>
                        <span className="text-xs text-gray-500 mt-1">₹0.25 each</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">
                      <div className="flex flex-col items-center">
                        <span className="text-lg">Golden Coins</span>
                        <span className="text-xs text-yellow-700 mt-1">₹2 each</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: '1-on-1 Live Sessions (per minute)', silver: '1 Silver Coin', golden: '-' },
                    { feature: 'Uploaded Videos', silver: '-', golden: 'Golden Coins' },
                    { feature: 'Live Arena', silver: '-', golden: 'Golden Coins' },
                    { feature: 'Group Discussions', silver: '-', golden: 'Rs. 500' },
                    { feature: 'Interview Rounds', silver: '-', golden: 'Rs. 1500' },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.silver === 'string' ? (
                          <span className="text-sm font-semibold text-gray-700">{row.silver}</span>
                        ) : row.silver === true ? (
                          <svg className="w-6 h-6 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : row.silver === '-' ? (
                          <span className="text-gray-400 font-medium">-</span>
                        ) : (
                          <svg className="w-6 h-6 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof row.golden === 'string' ? (
                          <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">{row.golden}</span>
                        ) : row.golden === true ? (
                          <svg className="w-6 h-6 text-yellow-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : row.golden === '-' ? (
                          <span className="text-gray-400 font-medium">-</span>
                        ) : (
                          <svg className="w-6 h-6 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Safe & Secure
            </h2>
            <p className="text-lg text-gray-600">
              Your trust is our priority
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: "Secure Payments",
                description: "Bank-grade encryption protects every transaction"
              },
              {
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Instant Delivery",
                description: "Coins are added to your account immediately"
              },
              {
                icon: (
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: "No Auto-Renewal",
                description: "Buy once, use anytime. Complete control over purchases"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow duration-300"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 p-3">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Toast Notifications */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-11/12 sm:w-auto"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{message}</span>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-11/12 sm:w-auto"
        >
          <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <svg className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GoPro;
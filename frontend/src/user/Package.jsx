import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BACKEND_URL } from '../config';
import { FaCoins } from 'react-icons/fa';
import { GiTwoCoins } from 'react-icons/gi';

const Package = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 pt-16 sm:pt-20 pb-10">
      {/* Enhanced Hero Section */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white py-12 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white font-lora mb-6"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Premium <span className="text-gray-300">Silver</span> SkillCoins
          </motion.h1>
          <motion.p 
            className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed font-nunito"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Unlock exclusive benefits with our premium SkillCoin packages. 
            Elevate your experience with priority access, exclusive content, and premium support.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-8 sm:mt-10"
          >
            <div className="inline-flex bg-blue-700 bg-opacity-50 rounded-full p-1">
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white px-5 sm:px-6 py-2 sm:py-3 rounded-full font-bold flex items-center font-nunito text-sm sm:text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 sm:h-6 w-5 sm:w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4 2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4 2 2 0 00-2-2H5z" />
                </svg>
                Silver SkillCoins
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Package Offers */}
      <BuyRedeemCoins />
      
      {/* Package History */}
      <PackageHistory />
    </div>
  );
};

const BuyRedeemCoins = () => {
  const [showMore, setShowMore] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  // Fetch packages from backend
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
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

  const handlePurchase = async (pkg) => {
    setPurchaseLoading(true);
    setSelectedPackage(pkg);
    
    try {
      // Simulate purchase process (integrate with payment gateway)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // TODO: Integrate actual payment gateway
      // const response = await fetch(`${BACKEND_URL}/api/purchase`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ packageId: pkg._id }),
      //   credentials: 'include'
      // });
      
      alert(`Successfully purchased ${pkg.name}!`);
    } catch (err) {
      console.error('Purchase error:', err);
      alert('Failed to purchase package. Please try again.');
    } finally {
      setPurchaseLoading(false);
    }
  };
  
  const getPackageColor = (type) => {
    switch(type) {
      case "ONLY_GOLDEN": 
        return {
          bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
          border: "border-yellow-300",
          text: "text-yellow-700",
          button: "from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
        };
      case "ONLY_SILVER": 
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-100",
          border: "border-gray-300",
          text: "text-gray-700",
          button: "from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
        };
      case "COMBO":
      default: 
        return {
          bg: "bg-gradient-to-br from-blue-50 to-blue-100",
          border: "border-blue-300",
          text: "text-blue-700",
          button: "from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
        };
    }
  };

  const getCoinIcon = (type, hasGolden, hasSilver) => {
    if (type === "ONLY_GOLDEN" || (hasGolden && !hasSilver)) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.049l1.715-5.349L11 6.477V5h2a1 1 0 110 2H9a1 1 0 010-2h1V3a1 1 0 011-1zm-6 8a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 019 21a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.049l1.715-5.349L5 12.477V11a1 1 0 011-1z" />
        </svg>
      );
    } else if (type === "COMBO") {
      return (
        <div className="flex -space-x-2">
          <FaCoins className="h-6 w-6 text-gray-500" />
          <GiTwoCoins className="h-6 w-6 text-yellow-500" />
        </div>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95a1 1 0 001.715 1.029z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  const formatCoinDisplay = (pkg) => {
    if (pkg.type === 'COMBO') {
      return `${pkg.silverCoins} Silver + ${pkg.goldenCoins} Golden SkillCoins`;
    } else if (pkg.type === 'ONLY_SILVER') {
      return `${pkg.silverCoins} Silver SkillCoins`;
    } else if (pkg.type === 'ONLY_GOLDEN') {
      return `${pkg.goldenCoins} Golden SkillCoins`;
    }
    return 'SkillCoins Package';
  };

  const getPackageFeatures = (pkg) => {
    const features = [];
    
    if (pkg.type === 'COMBO') {
      features.push('Silver + Golden benefits', 'Best value package', 'Flexible usage');
    } else if (pkg.type === 'ONLY_GOLDEN') {
      features.push('Premium features access', 'Priority support', 'Exclusive content');
    } else if (pkg.type === 'ONLY_SILVER') {
      features.push('Basic features access', 'Standard support', 'Long-term savings');
    }
    
    return features;
  };

  return (
    <section className="w-full max-w-7xl mx-auto mt-8 sm:mt-10 mb-12 sm:mb-16 px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 sm:mb-12"
      >
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 mb-4 font-lora"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Choose Your <span className="text-blue-700">SkillCoin Package</span>
        </motion.h2>
        <motion.p 
          className="text-blue-600 max-w-2xl mx-auto text-sm sm:text-base font-nunito"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Select a package that suits your needs and unlock exclusive benefits
        </motion.p>
      </motion.div>

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
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No packages available at the moment.</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon for new offers!</p>
        </div>
      ) : (
        <>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, staggerChildren: 0.2 }}
          >
            {packages.slice(0, 3).map((pkg) => {
              const colors = getPackageColor(pkg.type);
              const isPopular = pkg.type === 'COMBO';
              return (
                <motion.div
                  key={pkg._id}
                  className={`${colors.bg} rounded-2xl shadow-xl p-4 sm:p-6 border ${colors.border} relative overflow-hidden h-full flex flex-col`}
                  whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {isPopular && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 font-nunito">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="bg-white p-2 sm:p-3 rounded-full shadow-md mr-3 sm:mr-4">
                      {getCoinIcon(pkg.type, pkg.goldenCoins > 0, pkg.silverCoins > 0)}
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-900 font-lora">{pkg.name}</h3>
                  </div>
                  
                  <div className="mb-3 sm:mb-4">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800 mb-1">{formatCoinDisplay(pkg)}</div>
                    <div className="text-blue-600 text-sm sm:text-base font-nunito">Worth <span className="font-semibold">₹{pkg.priceInINR.toFixed(2)}</span></div>
                  </div>
                  
                  <div className="mb-1">
                    <p className="text-blue-600 text-sm font-nunito">{pkg.description}</p>
                  </div>
                  
                  <ul className="mb-4 sm:mb-6 mt-3 sm:mt-4 space-y-2 flex-grow">
                    {getPackageFeatures(pkg).map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-blue-600 text-sm font-nunito">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <motion.button
                    className={`w-full bg-gradient-to-r ${colors.button} text-white py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-md mt-auto font-nunito text-sm sm:text-base ${
                      purchaseLoading && selectedPackage?._id === pkg._id ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                    whileHover={{ scale: purchaseLoading ? 1 : 1.03 }}
                    whileTap={{ scale: purchaseLoading ? 1 : 0.98 }}
                    onClick={() => !purchaseLoading && handlePurchase(pkg)}
                    disabled={purchaseLoading}
                  >
                    {purchaseLoading && selectedPackage?._id === pkg._id ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Purchase Package'
                    )}
                  </motion.button>
                </motion.div>
              )
            })}
          </motion.div>

          {packages.length > 3 && (
            <>
              <motion.div
                className="text-center mb-12 sm:mb-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <motion.button
                  className="bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold py-2 sm:py-3 px-6 sm:px-8 rounded-full shadow-lg hover:from-blue-500 hover:to-blue-700 transition-all duration-300 flex items-center mx-auto font-nunito text-sm sm:text-base"
                  onClick={() => setShowMore(!showMore)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showMore ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Show Less Offers
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Show More Offers
                    </>
                  )}
                </motion.button>
              </motion.div>

              <AnimatePresence>
                {showMore && (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {packages.slice(3).map((pkg) => {
                      const colors = getPackageColor(pkg.type);
                      const isPopular = pkg.type === 'COMBO';
                      return (
                        <motion.div
                          key={pkg._id}
                          className={`${colors.bg} rounded-2xl shadow-xl p-4 sm:p-6 border ${colors.border} relative overflow-hidden h-full flex flex-col`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          transition={{ duration: 0.5 }}
                        >
                          {isPopular && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full font-nunito">
                              POPULAR
                            </div>
                          )}
                          
                          <div className="flex items-center mb-3 sm:mb-4">
                            <div className="bg-white p-2 sm:p-3 rounded-full shadow-md mr-3 sm:mr-4">
                              {getCoinIcon(pkg.type, pkg.goldenCoins > 0, pkg.silverCoins > 0)}
                            </div>
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-900 font-lora">{pkg.name}</h3>
                          </div>
                          
                          <div className="mb-3 sm:mb-4">
                            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800 mb-1">{formatCoinDisplay(pkg)}</div>
                            <div className="text-blue-600 text-sm sm:text-base font-nunito">Worth <span className="font-semibold">₹{pkg.priceInINR.toFixed(2)}</span></div>
                          </div>
                          
                          <div className="mb-1">
                            <p className="text-blue-600 text-sm font-nunito">{pkg.description}</p>
                          </div>
                          
                          <ul className="mb-4 sm:mb-6 mt-3 sm:mt-4 space-y-2 flex-grow">
                            {getPackageFeatures(pkg).map((feature, idx) => (
                              <li key={idx} className="flex items-start">
                                <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-blue-600 text-sm font-nunito">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          
                          <motion.button
                            className={`w-full bg-gradient-to-r ${colors.button} text-white py-2 sm:py-3 rounded-xl transition-all duration-300 shadow-md mt-auto font-nunito text-sm sm:text-base ${
                              purchaseLoading && selectedPackage?._id === pkg._id ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                            whileHover={{ scale: purchaseLoading ? 1 : 1.03 }}
                            whileTap={{ scale: purchaseLoading ? 1 : 0.98 }}
                            onClick={() => !purchaseLoading && handlePurchase(pkg)}
                            disabled={purchaseLoading}
                          >
                            {purchaseLoading && selectedPackage?._id === pkg._id ? (
                              <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </span>
                            ) : (
                              'Purchase Package'
                            )}
                          </motion.button>
                        </motion.div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </>
      )}

      {/* Current Plan Section */}
      <motion.div
        className="mt-12 sm:mt-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 mb-6 sm:mb-8 text-center font-lora">Your Current Plan</h2>
        
        <motion.div 
          className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl shadow-xl p-6 sm:p-8 border border-blue-300 max-w-4xl mx-auto relative overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full opacity-10 -mt-16 -mr-16"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 rounded-full opacity-10 -mb-20 -ml-20"></div>
          
          <div className="flex flex-col md:flex-row items-center relative z-10">
            <div className="mb-4 md:mb-0 md:mr-6 sm:mr-8">
              <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 p-3 sm:p-4 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 sm:h-16 w-12 sm:w-16 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
            
            <div className="text-center md:text-left">
              {/* <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-900 mb-2 font-lora">Gold Pro SkillCoin</h3>
              <div className="inline-flex items-center bg-blue-100 text-blue-800 px-3 sm:px-4 py-1 rounded-full mb-3 sm:mb-4 font-nunito text-sm sm:text-base">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">Active</span>
              </div>
              
              <div className="flex items-center justify-center md:justify-start mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600 mr-2">50</span>
                <span className="text-base sm:text-lg md:text-xl text-blue-600 font-nunito">Gold SkillCoin Available</span>
              </div> */}
              
              <div className="mb-4 sm:mb-6 bg-white bg-opacity-20 backdrop-blur-lg p-3 sm:p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-blue-600 text-sm sm:text-base font-nunito">Started:</span>
                  <span className="font-medium text-blue-900 text-sm sm:text-base font-nunito">Aug 15, 2023</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600 text-sm sm:text-base font-nunito">Renews:</span>
                  <span className="font-medium text-blue-900 text-sm sm:text-base font-nunito">Sep 15, 2023</span>
                </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <motion.button
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-lg shadow hover:from-blue-500 hover:to-blue-700 transition-all duration-300 flex items-center font-nunito text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zm7-10a1 1 0 01.967.744L14.146 7.2 13.047 14.01c-.04.3-.068.598-.068.9a3 3 0 11-3-3c.302 0 .598.028.9.067l1.757-1.42-3.2-6.4a1 1 0 01.9-1.37z" clipRule="evenodd" />
                  </svg>
                  Upgrade Plan
                </motion.button>
                <motion.button
                  className="px-4 sm:px-6 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg shadow hover:from-gray-600 hover:to-gray-700 transition-all duration-300 flex items-center font-nunito text-sm sm:text-base"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  Manage
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Package Detail Modal */}
      <AnimatePresence>
        {selectedPackage && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 border border-blue-100"
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-blue-900 font-lora">{selectedPackage.name}</h3>
                <button 
                  onClick={() => setSelectedPackage(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 sm:h-6 w-5 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="mr-3">
                  {getCoinIcon(selectedPackage.type, selectedPackage.goldenCoins > 0, selectedPackage.silverCoins > 0)}
                </div>
                <div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-800 font-lora">{formatCoinDisplay(selectedPackage)}</div>
                  <div className="text-blue-600 text-sm sm:text-base font-nunito">Worth ₹{selectedPackage.priceInINR.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="mb-3 sm:mb-4">
                <p className="text-blue-600 text-sm font-nunito">{selectedPackage.description}</p>
              </div>
              
              <ul className="mb-4 sm:mb-6 space-y-2">
                {getPackageFeatures(selectedPackage).map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-blue-600 text-sm font-nunito">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 bg-blue-100 text-blue-800 py-2 sm:py-3 rounded-lg hover:bg-blue-200 transition-colors font-nunito text-sm sm:text-base"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPackage(null)}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 text-white py-2 sm:py-3 rounded-lg hover:from-blue-500 hover:to-blue-700 transition-all font-nunito text-sm sm:text-base disabled:opacity-70"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePurchase(selectedPackage)}
                  disabled={purchaseLoading}
                >
                  {purchaseLoading ? 'Processing...' : 'Confirm Purchase'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const PackageHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API call with mock data
    setTimeout(() => {
      const mockData = [
        // { id: 1, name: "Gold Pro SkillCoin", coins: "50 Gold SkillCoin", value: "₹100", date: "2023-08-15", status: "completed", details: "Payment method: Credit Card · Transaction ID: TXN-789456" },
        { id: 2, name: "Silver Starter SkillCoin", coins: "1200 Silver SkillCoin", value: "₹270", date: "2023-07-10", status: "completed", details: "Payment method: PayPal · Transaction ID: TXN-123789" },
        // { id: 3, name: "Combo SkillCoin", coins: "100 Silver + 20 Gold SkillCoin", value: "₹60", date: "2023-06-05", status: "completed", details: "Payment method: UPI · Transaction ID: TXN-456123" },
        // { id: 4, name: "Gold Elite SkillCoin", coins: "180 Gold SkillCoin", value: "₹280", date: "2023-05-20", status: "completed", details: "Payment method: Credit Card · Transaction ID: TXN-987321" },
        { id: 5, name: "Combo Elite SkillCoin", coins: "1200 Silver + 240 Gold SkillCoin", value: "₹720", date: "2023-04-12", status: "cancelled", details: "Payment was refunded on 2023-04-15" },
      ];
      
      setHistory(mockData);
      setLoading(false);
    }, 1500);
  }, []);

  const getStatusColor = (status) => {
    return status === "completed" 
      ? "bg-blue-100 text-blue-700" 
      : "bg-red-100 text-red-800";
  };

  const getStatusIcon = (status) => {
    return status === "completed" ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    );
  };

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const deleteRow = (id) => {
    setHistory(history.filter(pkg => pkg.id !== id));
  };

  const clearAllHistory = () => {
    setHistory([]);
  };

  return (
    <section className="w-full max-w-7xl mx-auto mb-12 sm:mb-16 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-100 p-4 sm:p-6 px-4 sm:px-6">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <motion.h2
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-900 text-center font-lora"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Your <span className="text-blue-700">Purchase</span> History
        </motion.h2>
        {history.length > 0 && (
          <motion.button
            className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold py-2 px-4 sm:px-6 rounded-full shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center font-nunito text-sm sm:text-base"
            onClick={clearAllHistory}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M4 7h16" />
            </svg>
            Clear All
          </motion.button>
        )}
      </div>
      
      <AnimatePresence>
        {loading ? (
          <motion.div
            className="py-10 sm:py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-block animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-blue-700 font-semibold text-sm sm:text-base font-nunito">Loading your purchase history...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            className="py-10 sm:py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-red-500 mb-4">
              <svg className="inline-block h-10 sm:h-12 w-10 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold text-sm sm:text-base font-nunito">{error}</p>
          </motion.div>
        ) : history.length === 0 ? (
          <motion.div
            className="py-10 sm:py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-blue-400 mb-4">
              <svg className="inline-block h-10 sm:h-12 w-10 sm:w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-blue-600 text-sm sm:text-base font-nunito">No package history found.</p>
          </motion.div>
        ) : (
          <motion.div
            className="overflow-x-auto rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <table className="min-w-full divide-y divide-blue-100">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider font-nunito">Package</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider font-nunito">SkillCoins</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider font-nunito">Value</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider font-nunito">Date</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider font-nunito">Status</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-blue-700 uppercase tracking-wider font-nunito">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white bg-opacity-20 backdrop-blur-lg divide-y divide-blue-50">
                <AnimatePresence>
                  {history.map((pkg) => (
                    <React.Fragment key={pkg.id}>
                      <motion.tr 
                        className="hover:bg-blue-50 cursor-pointer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => toggleRow(pkg.id)}
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 sm:h-10 w-8 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {pkg.name.includes("Gold") ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.049l1.715-5.349L11 6.477V5h2a1 1 0 110 2H9a1 1 0 010-2h1V3a1 1 0 011-1zm-6 8a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 019 21a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.049l1.715-5.349L5 12.477V11a1 1 0 011-1z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95a1 1 0 001.715 1.029z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm sm:text-base font-medium text-blue-900 font-nunito">{pkg.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm sm:text-base text-blue-900 font-semibold font-nunito">{pkg.coins}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-base text-blue-900 font-semibold font-nunito">
                          {pkg.value}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm sm:text-base text-blue-600 font-nunito">
                          {new Date(pkg.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs sm:text-sm font-semibold rounded-full ${getStatusColor(pkg.status)} font-nunito`}>
                            {getStatusIcon(pkg.status)}
                            {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <motion.button
                            className="text-red-600 hover:text-red-800"
                            onClick={(e) => { e.stopPropagation(); deleteRow(pkg.id); }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </td>
                      </motion.tr>
                      
                      {expandedRow === pkg.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-blue-50"
                        >
                          <td colSpan="6" className="px-4 sm:px-6 py-4">
                            <div className="text-sm text-blue-600 font-nunito">
                              <p>{pkg.details}</p>
                              <button 
                                className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center font-nunito"
                                onClick={() => toggleRow(pkg.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                </svg>
                                Show less
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Package;
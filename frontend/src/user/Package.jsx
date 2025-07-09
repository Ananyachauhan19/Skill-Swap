<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Package = () => {
  return (
   <div className="min-h-screen bg-[#e6f0ff] pb-10">

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            SkillCoins Packages
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Unlock exclusive benefits with our Gold and Silver Skillcoins. 
            Choose the perfect package to enhance your experience and maximize your rewards.
          </motion.p>
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
  
  const offers = [
    {
      id: 1,
      name: 'Golden Pro ',
      coins: '50 Golden Coins',
      value: '₹100',
      type: 'gold',
      popular: true,
      features: ['Premium features access', 'Priority support', 'Exclusive content']
    },
    {
      id: 2,
      name: 'Silver Starter ',
      coins: '1200 Silver Coins',
      value: '₹270',
      type: 'silver',
      features: ['Basic features access', 'Standard support']
    },
    {
      id: 3,
      name: 'Combo Pack ',
      coins: '100 Silver + 20 Golden',
      value: '₹60',
      type: 'combo',
      features: ['Silver + Gold benefits', 'Flexible usage']
    },
    {
      id: 4,
      name: 'Combo Pack',
      coins: '1200 Silver + 240 Golden',
      value: '₹720',
      type: 'combo',
      popular: true,
      features: ['All premium features', 'VIP support', 'Exclusive events']
    },
    {
      id: 5,
      name: 'Gold Elite',
      coins: '180 Golden Coins',
      value: '₹280',
      type: 'gold',
      features: ['Extended premium access', 'Priority customer service']
    },
    {
      id: 6,
      name: 'Silver Plus ',
      coins: '2400 Silver Coins',
      value: '₹480',
      type: 'silver',
      features: ['Long-term savings', 'All standard features']
    }
  ];

  const getPackageColor = (type) => {
    switch(type) {
      case "gold": 
        return "from-yellow-100 to-yellow-50 border-yellow-300";
      case "silver": 
        return "from-gray-100 to-gray-50 border-gray-300";
      default: 
        return "from-blue-100 to-indigo-50 border-blue-300";
    }
  };

  const getCoinIcon = (type) => {
    return type === "gold" ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <section className="w-full max-w-6xl mx-auto mt-10 mb-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl font-bold text-blue-900 mb-4">Choose Your skillCoins Package</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select a package that suits your needs and unlock exclusive benefits with your Skillcoins purchase.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, staggerChildren: 0.2 }}
      >
        {offers.slice(0, 3).map((offer) => (
          <motion.div
            key={offer.id}
            className={`bg-gradient-to-br ${getPackageColor(offer.type)} rounded-2xl shadow-xl p-6 border-2 relative overflow-hidden`}
            whileHover={{ y: -10 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {offer.popular && (
              <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}
            
            <div className="flex items-center mb-4">
              <div className="bg-white p-2 rounded-full shadow mr-3">
                {getCoinIcon(offer.type)}
              </div>
              <h3 className="text-xl font-bold text-blue-900">{offer.name}</h3>
            </div>
            
            <div className="mb-6">
              <div className="text-2xl font-bold text-blue-800 mb-1">{offer.coins}</div>
              <div className="text-gray-600">Worth <span className="font-semibold">{offer.value}</span></div>
            </div>
            
            <ul className="mb-6 space-y-2">
              {offer.features.map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            
            <motion.button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-md"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Purchase Package
            </motion.button>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <motion.button
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
          onClick={() => setShowMore(!showMore)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showMore ? 'Show Less Offers' : 'Show More Offers'}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showMore && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {offers.slice(3).map((offer) => (
              <motion.div
                key={offer.id}
                className={`bg-gradient-to-br ${getPackageColor(offer.type)} rounded-2xl shadow-xl p-6 border-2 relative overflow-hidden`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
              >
                {offer.popular && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    POPULAR
                  </div>
                )}
                
                <div className="flex items-center mb-4">
                  <div className="bg-white p-2 rounded-full shadow mr-3">
                    {getCoinIcon(offer.type)}
                  </div>
                  <h3 className="text-xl font-bold text-blue-900">{offer.name}</h3>
                </div>
                
                <div className="mb-6">
                  <div className="text-2xl font-bold text-blue-800 mb-1">{offer.coins}</div>
                  <div className="text-gray-600">Worth <span className="font-semibold">{offer.value}</span></div>
                </div>
                
                <ul className="mb-6 space-y-2">
                  {offer.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <motion.button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 shadow-md"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Purchase Package
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Plan Section */}
      <motion.div
        className="mt-16"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-blue-900 mb-8 text-center">Your Current Plan</h2>
        
        <motion.div 
          className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl shadow-2xl p-8 border-2 border-blue-300 max-w-4xl mx-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex flex-col md:flex-row items-center">
            <div className="mb-6 md:mb-0 md:mr-8">
              <div className="bg-white p-4 rounded-full shadow-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 4a1 1 0 011-1h6a1 1 0 100-2H7a1 1 0 100 2h1.26c1.188 0 2.132.734 2.59 1.75H6a1 1 0 000 2h5.22c-.4.873-1.29 1.5-2.32 1.5H6a1 1 0 000 2h3v2H8a1 1 0 100 2h2a1 1 0 001-1v-2.1c1.715-.415 3-2 3-3.9 0-2.21-1.79-4-4-4H6z" clipRule="evenodd" />
  </svg>
              </div>
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Golden Pro</h3>
              <p className="text-xl font-semibold text-yellow-600 mb-4">50 Golden Coins</p>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">Active until: <span className="font-semibold">October 15, 2023</span></p>
                <p className="text-gray-700">Renewal: <span className="font-semibold">₹100/</span></p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4">
                <motion.button
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg shadow hover:from-blue-700 hover:to-indigo-800 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Upgrade Plan
                </motion.button>
                <motion.button
                  className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Manage Subscription
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
=======
import React, { useEffect, useState } from 'react';
import BuyRedeemCoins from './settings/BuyRedeemCoins';
import ActiveSubscriptions from './settings/ActiveSubscriptions';
>>>>>>> 72534f60c383fe58c005219c841f83d3b27a1096

const PackageHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Simulate API call with mock data
    setTimeout(() => {
      const mockData = [
        { id: 1, name: "Golden Pro ", coins: "50 Golden Coins", value: "₹100", date: "2023-08-15", status: "completed" },
        { id: 2, name: "Silver Starter ", coins: "1200 Silver Coins", value: "₹270", date: "2023-07-10", status: "completed" },
        { id: 3, name: "Combo Pack", coins: "100 Silver + 20 Golden", value: "₹60", date: "2023-06-05", status: "completed" },
        { id: 4, name: "Gold Elite", coins: "180 Golden Coins", value: "₹280", date: "2023-05-20", status: "completed" },
        { id: 5, name: "Combo Pack", coins: "1200 Silver + 240 Golden", value: "₹720", date: "2023-04-12", status: "cancelled" },
      ];
      
      setHistory(mockData);
      setLoading(false);
    }, 1500);
  }, []);

  const getStatusColor = (status) => {
    return status === "completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  return (
    <section className="w-full max-w-6xl mx-auto mb-16 bg-white rounded-2xl shadow-xl border border-blue-100 p-6 px-4">
      <motion.h2
        className="text-2xl font-bold text-blue-900 mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Your Plan History
      </motion.h2>
      
      <AnimatePresence>
        {loading ? (
          <motion.div
            className="py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-blue-700 font-semibold">Loading your purchase history...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            className="py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-red-500 mb-4">
              <svg className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold text-lg">{error}</p>
          </motion.div>
        ) : history.length === 0 ? (
          <motion.div
            className="py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-gray-400 mb-4">
              <svg className="inline-block h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500">No package history found.</p>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Coins</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-blue-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-50">
                <AnimatePresence>
                  {history.map((pkg) => (
                    <motion.tr 
                      key={pkg.id}
                      className="hover:bg-blue-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {pkg.name.includes("Golden") || pkg.name.includes("Gold") ? (
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
                            <div className="text-sm font-medium text-blue-900">{pkg.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">{pkg.coins}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {pkg.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pkg.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(pkg.status)}`}>
                          {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                        </span>
                      </td>
                    </motion.tr>
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

<<<<<<< HEAD
export default Package;
=======
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
>>>>>>> 72534f60c383fe58c005219c841f83d3b27a1096

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaStar, FaFire, FaCoins, FaUserGraduate, FaChalkboardTeacher, FaMedal, FaCrown } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

const TopPerformersSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useModal();

  const handleNavigate = (path) => {
    if (!user) {
      openLogin();
      return;
    }
    navigate(path);
  };
  const [performers, setPerformers] = useState({
    allStars: [],
    mostActive: [],
    topRated: [],
    topEarners: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        // Determine limit based on screen size
        const isMobile = window.innerWidth < 768;
        const limit = isMobile ? 4 : 3;
        const response = await axios.get(`${backendUrl}/api/sessions/top-performers?limit=${limit}`);
        setPerformers(response.data);
      } catch (error) {
        console.error('Error fetching top performers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();

    // Re-fetch on window resize to adjust user count with debounce
    let resizeTimer;
    let previousLimit = window.innerWidth < 768 ? 4 : 3;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        const newLimit = isMobile ? 4 : 3;
        // Only fetch if limit actually changed
        if (newLimit !== previousLimit) {
          previousLimit = newLimit;
          setLoading(true);
          fetchTopPerformers();
        }
      }, 300); // Debounce for 300ms
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const tabs = [
    { id: 'all', label: 'All Stars', icon: <FaCrown /> },
    { id: 'active', label: 'Most Active', icon: <FaFire /> },
    { id: 'rated', label: 'Top Rated', icon: <FaStar /> },
    { id: 'earner', label: 'Top Earners', icon: <FaCoins /> }
  ];

  const getRankBadge = (index) => {
    const badges = [
      { color: 'from-yellow-400 to-yellow-600', icon: '🥇', label: '1st' },
      { color: 'from-gray-300 to-gray-500', icon: '🥈', label: '2nd' },
      { color: 'from-orange-400 to-orange-600', icon: '🥉', label: '3rd' }
    ];
    return badges[index] || badges[2];
  };

  const getDisplayCards = () => {
    let usersToDisplay = [];

    switch (activeTab) {
      case 'all':
        usersToDisplay = Array.isArray(performers?.allStars) ? performers.allStars.map((user, idx) => ({
          ...user,
          type: 'all',
          title: 'All-Star Performer',
          icon: <FaCrown className="text-yellow-500" />,
          // No score number displayed per requirement
          stat: null,
          metrics: [
            { label: 'Sessions', value: user.sessionCount },
            { label: 'Avg Rating', value: user.avgTutorRating },
            { label: 'Tutors', value: user.distinctTutorsCount }
          ],
          subtext: 'Outstanding overall engagement',
          color: 'blue',
          badge: 'All-Star',
          rank: idx
        })) : [];
        break;
      case 'active':
        usersToDisplay = Array.isArray(performers?.mostActive) ? performers.mostActive.map((user, idx) => ({
          ...user,
          type: 'active',
          title: 'Most Active Learner',
          icon: <FaFire className="text-orange-500" />,
            stat: `${user.sessionCount} Sessions`,
          subtext: 'Consistently learning',
          color: 'orange',
          badge: 'Dedicated',
          rank: idx
        })) : [];
        break;
      case 'rated':
        usersToDisplay = Array.isArray(performers?.topRated) ? performers.topRated.map((user, idx) => ({
          ...user,
          type: 'rated',
          title: 'Top Rated Tutor',
          icon: <FaStar className="text-yellow-500" />,
          stat: `${user.rating} ★`,
          subtext: `From ${user.ratingCount} reviews`,
          color: 'yellow',
          badge: 'Expert',
          rank: idx
        })) : [];
        break;
      case 'earner':
        usersToDisplay = Array.isArray(performers?.topEarners) ? performers.topEarners.map((user, idx) => ({
          ...user,
          type: 'earner',
          title: 'Top Earner',
          icon: <FaCoins className="text-green-500" />,
          stat: `${user.totalEarnings} Coins`,
          subtext: `Silver: ${user.silverEarnings} • Gold: ${user.goldEarnings}`,
          color: 'green',
          badge: 'Pro',
          rank: idx
        })) : [];
        break;
    }

    return usersToDisplay;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    },
    hover: {
      y: -10,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      scale: 1.02
    }
  };

  return (
    <section className="py-6 sm:py-8 bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-[#0A2540] mb-2"
          >
            Top Performers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm text-gray-600"
          >
            Recognizing our community leaders
          </motion.p>
        </div>

        {/* Tabs - Desktop: Minimal Design */}
        <div className="hidden md:flex justify-center mb-6 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === tab.id
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tabs - Mobile: All Tabs in One Row with Better Readability */}
        <div className="md:hidden mb-6 px-1">
          <div className="flex justify-center gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center py-2.5 px-1.5 rounded-lg text-[9px] font-semibold transition-all duration-200 ${activeTab === tab.id
                  ? 'bg-blue-900 text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 border border-gray-200'
                  }`}
              >
                <span className="text-sm mb-1">{tab.icon}</span>
                <span className="leading-tight text-center w-full text-[10px]">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 font-medium">Loading top performers...</p>
            </div>
          </div>
        ) : getDisplayCards().length === 0 ? (
          <div className="text-center py-12">
            <FaTrophy className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No performers found in this category yet.</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to make it to the leaderboard!</p>
          </div>
        ) : (
          <>
          {/* Desktop: Grid Layout */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {getDisplayCards().map((card, index) => {
                const rankBadge = getRankBadge(card.rank);
                return (
                  <motion.div
                    key={`${card._id}-${card.type}`}
                    layout
                    variants={cardVariants}
                    whileHover="hover"
                    onClick={() => handleNavigate(`/profile/${card.username}`)}
                    className="bg-white rounded-xl p-4 border border-gray-200 relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    {/* Rank Badge - Top Left */}
                    <div className="absolute top-3 left-3 z-20">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${rankBadge.color} flex items-center justify-center shadow-md`}>
                        <span className="text-base">{rankBadge.icon}</span>
                      </div>
                    </div>

                    <div className="relative z-10 pt-10">

                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-full border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={card.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.firstName)}+${encodeURIComponent(card.lastName)}&background=random&size=128`}
                            alt={card.username}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.firstName)}+${encodeURIComponent(card.lastName)}&background=random&size=128`;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 truncate">
                            {card.firstName} {card.lastName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">@{card.username}</p>
                        </div>
                      </div>

                      {/* Stats / Metrics */}
                      {card.type === 'all' ? (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-2">
                            {card.metrics.map(m => (
                              <div key={m.label} className="text-center">
                                <p className="text-[10px] text-gray-500 font-medium">{m.label}</p>
                                <p className="text-base font-bold text-[#0A2540]">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="pt-3 border-t border-gray-100">
                          <div className="text-center">
                            <span className="text-2xl font-bold text-[#0A2540]">
                              {card.stat}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Mobile: Compact Grid */}
          <div className="md:hidden">
            <div className="grid grid-cols-2 gap-3 px-2">
              <AnimatePresence mode="popLayout">
                {getDisplayCards().map((card, index) => {
                  const rankBadge = getRankBadge(card.rank);
                  return (
                    <motion.div
                      key={`${card._id}-${card.type}-mobile`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleNavigate(`/profile/${card.username}`)}
                      className="bg-white rounded-lg p-3 border border-gray-200 relative overflow-hidden shadow-sm cursor-pointer"
                    >
                      {/* Rank Badge */}
                      <div className="absolute top-2 left-2 z-20">
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${rankBadge.color} flex items-center justify-center shadow-sm`}>
                          <span className="text-xs">{rankBadge.icon}</span>
                        </div>
                      </div>

                      <div className="relative z-10">
                        {/* User Avatar - Centered */}
                        <div className="flex flex-col items-center pt-6 mb-2">
                          <div className="w-16 h-16 rounded-full border-2 border-gray-200 shadow-sm overflow-hidden bg-gray-100 mb-2">
                            <img
                              src={card.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.firstName)}+${encodeURIComponent(card.lastName)}&background=random&size=64`}
                              alt={card.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.firstName)}+${encodeURIComponent(card.lastName)}&background=random&size=64`;
                              }}
                            />
                          </div>
                          
                          {/* User Name */}
                          <h3 className="font-semibold text-sm text-gray-900 truncate w-full text-center">
                            {card.firstName} {card.lastName}
                          </h3>
                          <p className="text-xs text-gray-500 truncate w-full text-center">@{card.username}</p>
                        </div>

                        {/* Stats - Compact */}
                        {card.type === 'all' ? (
                          <div className="text-center pt-2 border-t border-gray-100">
                            <div className="grid grid-cols-3 gap-1">
                              {card.metrics.map(m => (
                                <div key={m.label} className="text-center">
                                  <p className="text-[9px] text-gray-500 font-medium">{m.label}</p>
                                  <p className="text-xs font-bold text-[#0A2540]">{m.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center pt-2 border-t border-gray-100">
                            <span className="text-base font-bold text-[#0A2540] block">
                              {card.stat}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          </>
        )}
      </div>
    </section>
  );
};

export default TopPerformersSection;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaStar, FaFire, FaCoins, FaUserGraduate, FaChalkboardTeacher, FaMedal, FaCrown } from 'react-icons/fa';
import axios from 'axios';

const TopPerformersSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
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
        const response = await axios.get(`${backendUrl}/api/sessions/top-performers`);
        setPerformers(response.data);
      } catch (error) {
        console.error('Error fetching top performers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();
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
        usersToDisplay = performers.allStars.map((user, idx) => ({
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
        }));
        break;
      case 'active':
        usersToDisplay = performers.mostActive.map((user, idx) => ({
          ...user,
          type: 'active',
          title: 'Most Active Learner',
          icon: <FaFire className="text-orange-500" />,
            stat: `${user.sessionCount} Sessions`,
          subtext: 'Consistently learning',
          color: 'orange',
          badge: 'Dedicated',
          rank: idx
        }));
        break;
      case 'rated':
        usersToDisplay = performers.topRated.map((user, idx) => ({
          ...user,
          type: 'rated',
          title: 'Top Rated Tutor',
          icon: <FaStar className="text-yellow-500" />,
          stat: `${user.rating} ★`,
          subtext: `From ${user.ratingCount} reviews`,
          color: 'yellow',
          badge: 'Expert',
          rank: idx
        }));
        break;
      case 'earner':
        usersToDisplay = performers.topEarners.map((user, idx) => ({
          ...user,
          type: 'earner',
          title: 'Top Earner',
          icon: <FaCoins className="text-green-500" />,
          stat: `${user.totalEarnings} Coins`,
          subtext: `Silver: ${user.silverEarnings} • Gold: ${user.goldEarnings}`,
          color: 'green',
          badge: 'Pro',
          rank: idx
        }));
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
    <section className="py-4 sm:py-6 bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block mb-3 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100"
          >
            <span className="text-sm font-semibold text-blue-600 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" /> Hall of Fame
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-[#0A2540] mb-4"
          >
            Meet Our Top Performers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Recognizing the most dedicated learners and exceptional tutors in our community.
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10 flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                ? 'bg-gradient-to-r from-[#0A2540] to-blue-600 text-white shadow-lg scale-105 transform'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300'
                }`}
            >
              <span className={activeTab === tab.id ? 'text-white' : 'text-gray-500'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
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
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                    onClick={() => navigate(`/profile/${card.username}`)}
                    className="bg-white rounded-2xl p-6 border-2 border-gray-100 relative overflow-hidden group shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  >
                    {/* Rank Badge - Top Left */}
                    <div className="absolute top-4 left-4 z-20">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankBadge.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                        <span className="text-2xl">{rankBadge.icon}</span>
                      </div>
                    </div>

                    {/* Background Gradient Decoration */}
                    <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${
                      card.color === 'orange' ? 'from-orange-50 to-orange-100' :
                      card.color === 'yellow' ? 'from-yellow-50 to-yellow-100' :
                      card.color === 'green' ? 'from-green-50 to-green-100' :
                      'from-blue-50 to-blue-100'
                    } rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-150 duration-700 opacity-50`} />

                    <div className="relative z-10">
                      {/* Icon and Badge */}
                      <div className="flex justify-between items-start mb-6 pt-16">
                        <div className={`p-3 rounded-xl shadow-md ${
                          card.color === 'orange' ? 'bg-orange-100' :
                          card.color === 'yellow' ? 'bg-yellow-100' :
                          card.color === 'green' ? 'bg-green-100' :
                          'bg-blue-100'
                        } text-3xl transform group-hover:rotate-12 transition-transform duration-300`}>
                          {card.icon}
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          card.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                          card.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          card.color === 'green' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {card.badge}
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100">
                            <img
                              src={card.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(card.firstName)}+${encodeURIComponent(card.lastName)}&background=random&size=128`}
                              alt={card.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.firstName)}+${encodeURIComponent(card.lastName)}&background=random&size=128`;
                              }}
                            />
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md">
                            {card.role === 'teacher' || card.role === 'both' ? 
                              <FaChalkboardTeacher className="text-purple-600 text-sm" /> : 
                              <FaUserGraduate className="text-blue-600 text-sm" />
                            }
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate">
                            {card.firstName} {card.lastName}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">@{card.username}</p>
                          <p className="text-xs text-gray-400 mt-0.5 capitalize">
                            {card.role === 'both' ? 'Tutor & Learner' : card.role}
                          </p>
                        </div>
                        {/* Explore Opportunity quick CTA */}
                        <div className="ml-auto">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate('/StartSkillSwap'); }}
                            className="px-3 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600"
                          >
                            Explore Opportunity
                          </button>
                        </div>
                      </div>

                      {/* Stats / Metrics */}
                      {card.type === 'all' ? (
                        <div className="pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">
                            {card.title}
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {card.metrics.map(m => (
                              <div key={m.label} className="text-center">
                                <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wide">{m.label}</p>
                                <p className="text-lg font-bold text-[#0A2540]">{m.value}</p>
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600 mt-4 font-medium">{card.subtext}</p>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                            {card.title}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-[#0A2540]">
                              {card.stat}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{card.subtext}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default TopPerformersSection;
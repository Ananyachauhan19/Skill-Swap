import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaStar, FaFire, FaCoins, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';
import axios from 'axios';

const TopPerformersSection = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [performers, setPerformers] = useState({
    mostActive: null,
    topRated: null,
    topEarner: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.get(`${backendUrl}/api/sessions/top-performers`);

        // If data is missing, try fallback search to at least show some users
        if (!response.data.mostActive && !response.data.topRated) {
          const fallbackResponse = await axios.get(`${backendUrl}/api/auth/search/users?limit=3`);
          const users = fallbackResponse.data.results || [];
          setPerformers({
            mostActive: users[0] ? { ...users[0], sessionCount: 0 } : null,
            topRated: users[1] ? { ...users[1], rating: 5.0, ratingCount: 0 } : null,
            topEarner: users[2] ? { ...users[2], earnings: 0 } : null,
          });
        } else {
          setPerformers(response.data);
        }
      } catch (error) {
        console.error('Error fetching top performers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();
  }, []);

  const tabs = [
    { id: 'all', label: 'All Stars' },
    { id: 'active', label: 'Most Active' },
    { id: 'rated', label: 'Top Rated' },
    { id: 'earner', label: 'Top Earners' }
  ];

  const getDisplayCards = () => {
    const cards = [];
    if (performers.mostActive && (activeTab === 'all' || activeTab === 'active')) {
      cards.push({
        ...performers.mostActive,
        type: 'active',
        title: 'Most Active Learner',
        icon: <FaFire className="text-orange-500" />,
        stat: `${performers.mostActive.sessionCount || 0} Sessions`,
        subtext: 'Consistently learning',
        color: 'orange',
        badge: 'Dedicated'
      });
    }
    if (performers.topRated && (activeTab === 'all' || activeTab === 'rated')) {
      cards.push({
        ...performers.topRated,
        type: 'rated',
        title: 'Top Rated Tutor',
        icon: <FaStar className="text-yellow-500" />,
        stat: `${performers.topRated.rating || 5.0} Rating`,
        subtext: `(${performers.topRated.ratingCount || 0} reviews)`,
        color: 'yellow',
        badge: 'Expert'
      });
    }
    if (performers.topEarner && (activeTab === 'all' || activeTab === 'earner')) {
      cards.push({
        ...performers.topEarner,
        type: 'earner',
        title: 'Top Earner',
        icon: <FaCoins className="text-green-500" />,
        stat: `${performers.topEarner.earnings || 0} Coins`,
        subtext: 'Earned from teaching',
        color: 'green',
        badge: 'Pro'
      });
    }
    return cards;
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
        <div className="flex justify-center mb-10 flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeTab === tab.id
                ? 'bg-[#0A2540] text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {getDisplayCards().map((card) => (
                <motion.div
                  key={`${card._id}-${card.type}`}
                  layout
                  variants={cardVariants}
                  whileHover="hover"
                  className="bg-white rounded-2xl p-6 border border-gray-100 relative overflow-hidden group"
                >
                  {/* Background Gradient Decoration */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${card.color}-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500`} />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 rounded-xl bg-${card.color}-50 text-2xl`}>
                        {card.icon}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${card.color}-100 text-${card.color}-700`}>
                        {card.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <img
                          src={card.profilePic || `https://ui-avatars.com/api/?name=${card.firstName}+${card.lastName}&background=random`}
                          alt={card.username}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                          {card.type === 'active' ? <FaUserGraduate className="text-blue-500 text-xs" /> : <FaChalkboardTeacher className="text-purple-500 text-xs" />}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{card.firstName} {card.lastName}</h3>
                        <p className="text-sm text-gray-500">@{card.username}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold">{card.title}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#0A2540]">{card.stat}</span>
                      </div>
                      <p className="text-sm text-gray-400">{card.subtext}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default TopPerformersSection;
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BACKEND_URL } from "../../config.js";

const TopPerformersSection = () => {
  const [performers, setPerformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'active', 'rated', 'earner'

  useEffect(() => {
    const fetchTopPerformers = async () => {
      setLoading(true);
      try {
        // Try to fetch from dedicated top performers endpoint
        let res = await fetch(`${BACKEND_URL}/api/sessions/top-performers`, { 
          credentials: 'include' 
        });

        if (res.ok) {
          const data = await res.json();
          setPerformers(formatPerformersData(data));
        } else {
          // Fallback: fetch sessions and calculate top performers
          res = await fetch(`${BACKEND_URL}/api/sessions/search`, {
            credentials: 'include',
          });

          if (res.ok) {
            const sessions = await res.json();
            const calculated = calculateTopPerformers(sessions);
            setPerformers(calculated);
          } else {
            // Use empty data if both fail
            setPerformers(getEmptyPerformers());
          }
        }
      } catch (error) {
        console.error('Failed to fetch top performers:', error);
        setPerformers(getEmptyPerformers());
      } finally {
        setLoading(false);
      }
    };

    fetchTopPerformers();
  }, []);

  const formatPerformersData = (data) => {
    // Format backend data into our display format
    return [
      {
        img: data.mostActive?.profilePic || data.mostActive?.creator?.profilePic,
        imgFallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.mostActive?.firstName || data.mostActive?.username || 'User')}&background=3b82f6&color=fff&bold=true`,
        alt: "Most Active",
        title: "Most Active Learner",
        name: `${data.mostActive?.firstName || ''} ${data.mostActive?.lastName || ''}`.trim() || data.mostActive?.username || 'N/A',
        stat: `${data.mostActive?.sessionCount || 0} sessions`,
        type: 'active'
      },
      {
        img: data.topRated?.profilePic || data.topRated?.creator?.profilePic,
        imgFallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.topRated?.firstName || data.topRated?.username || 'User')}&background=3b82f6&color=fff&bold=true`,
        alt: "Top Tutor",
        title: "Highest Rated Tutor",
        name: `${data.topRated?.firstName || ''} ${data.topRated?.lastName || ''}`.trim() || data.topRated?.username || 'N/A',
        rating: data.topRated?.rating || 0,
        extra: (
          <div className="flex items-center justify-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`${i < Math.floor(data.topRated?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'} text-lg`}>
                ★
              </span>
            ))}
          </div>
        ),
        type: 'rated'
      },
      {
        img: data.topEarner?.profilePic || data.topEarner?.creator?.profilePic,
        imgFallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.topEarner?.firstName || data.topEarner?.username || 'User')}&background=3b82f6&color=fff&bold=true`,
        alt: "Top Earner",
        title: "Top Earner",
        name: `${data.topEarner?.firstName || ''} ${data.topEarner?.lastName || ''}`.trim() || data.topEarner?.username || 'N/A',
        stat: (
          <span className="font-semibold text-sm sm:text-base text-[#2563eb]">
            ₹ {(data.topEarner?.earnings || 0).toLocaleString()} Earned
          </span>
        ),
        type: 'earner'
      },
    ];
  };

  const calculateTopPerformers = (sessions) => {
    // Calculate top performers from sessions data
    const userStats = new Map();

    sessions.forEach(session => {
      const creator = session.creator;
      if (!creator) return;

      const userId = creator._id || creator;
      const userKey = String(userId);

      if (!userStats.has(userKey)) {
        userStats.set(userKey, {
          user: creator,
          sessionCount: 0,
          totalRating: 0,
          ratingCount: 0,
          earnings: 0
        });
      }

      const stats = userStats.get(userKey);
      stats.sessionCount += 1;

      if (session.rating) {
        stats.totalRating += session.rating;
        stats.ratingCount += 1;
      }

      // Calculate earnings (example: 0.25 rupees per minute)
      if (session.duration) {
        stats.earnings += session.duration * 0.25;
      }
    });

    const usersArray = Array.from(userStats.values());

    // Find top performers
    const mostActive = usersArray.sort((a, b) => b.sessionCount - a.sessionCount)[0] || {};
    const topRated = usersArray
      .filter(u => u.ratingCount > 0)
      .sort((a, b) => (b.totalRating / b.ratingCount) - (a.totalRating / a.ratingCount))[0] || {};
    const topEarner = usersArray.sort((a, b) => b.earnings - a.earnings)[0] || {};

    return [
      {
        img: mostActive.user?.profilePic,
        imgFallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(mostActive.user?.firstName || mostActive.user?.username || 'User')}&background=3b82f6&color=fff&bold=true`,
        alt: "Most Active",
        title: "Most Active Learner",
        name: `${mostActive.user?.firstName || ''} ${mostActive.user?.lastName || ''}`.trim() || mostActive.user?.username || 'N/A',
        stat: `${mostActive.sessionCount || 0} sessions`,
        type: 'active'
      },
      {
        img: topRated.user?.profilePic,
        imgFallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(topRated.user?.firstName || topRated.user?.username || 'User')}&background=3b82f6&color=fff&bold=true`,
        alt: "Top Tutor",
        title: "Highest Rated Tutor",
        name: `${topRated.user?.firstName || ''} ${topRated.user?.lastName || ''}`.trim() || topRated.user?.username || 'N/A',
        rating: topRated.ratingCount > 0 ? topRated.totalRating / topRated.ratingCount : 0,
        extra: (
          <div className="flex items-center justify-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className={`${i < Math.floor(topRated.ratingCount > 0 ? topRated.totalRating / topRated.ratingCount : 0) ? 'text-yellow-400' : 'text-gray-300'} text-lg`}>
                ★
              </span>
            ))}
          </div>
        ),
        type: 'rated'
      },
      {
        img: topEarner.user?.profilePic,
        imgFallback: `https://ui-avatars.com/api/?name=${encodeURIComponent(topEarner.user?.firstName || topEarner.user?.username || 'User')}&background=3b82f6&color=fff&bold=true`,
        alt: "Top Earner",
        title: "Top Earner",
        name: `${topEarner.user?.firstName || ''} ${topEarner.user?.lastName || ''}`.trim() || topEarner.user?.username || 'N/A',
        stat: (
          <span className="font-semibold text-sm sm:text-base text-[#2563eb]">
            ₹ {(topEarner.earnings || 0).toLocaleString()} Earned
          </span>
        ),
        type: 'earner'
      },
    ];
  };

  const getEmptyPerformers = () => {
    return [
      {
        img: null,
        imgFallback: 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&bold=true',
        alt: "Most Active",
        title: "Most Active Learner",
        name: "No data yet",
        stat: "0 sessions",
        type: 'active'
      },
      {
        img: null,
        imgFallback: 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&bold=true',
        alt: "Top Tutor",
        title: "Highest Rated Tutor",
        name: "No data yet",
        rating: 0,
        extra: (
          <div className="flex items-center justify-center gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-gray-300 text-lg">★</span>
            ))}
          </div>
        ),
        type: 'rated'
      },
      {
        img: null,
        imgFallback: 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&bold=true',
        alt: "Top Earner",
        title: "Top Earner",
        name: "No data yet",
        stat: (
          <span className="font-semibold text-sm sm:text-base text-[#2563eb]">
            ₹ 0 Earned
          </span>
        ),
        type: 'earner'
      },
    ];
  };

  const cardVariants = {
    hover: {
      y: -5,
      boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.98 },
  };

  // Filter performers based on active tab
  const displayPerformers = activeTab === 'all' 
    ? performers 
    : performers.filter(p => p.type === activeTab);

  if (loading) {
    return (
      <section className="py-10 sm:py-16 px-4 sm:px-8 bg-gradient-to-br from-[#FFFFFF] to-[#F5F8FF]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#3b82f6] border-t-transparent mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading top performers...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-8 bg-gradient-to-br from-[#FFFFFF] to-[#F5F8FF]">
      <div className="max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
          {[
            { key: 'all', label: '🏆 All Top 3', icon: '🏆' },
            { key: 'active', label: '🔥 Most Active', icon: '🔥' },
            { key: 'rated', label: '⭐ Top Rated', icon: '⭐' },
            { key: 'earner', label: '💰 Top Earner', icon: '💰' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white shadow-lg scale-105'
                  : 'bg-white text-[#1e3a8a] border-2 border-blue-200 hover:border-[#3b82f6] hover:scale-105'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.icon}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {displayPerformers.map((p, idx) => (
            <motion.div
              key={p.title + idx}
              className={`relative ${idx === 2 && displayPerformers.length === 3 ? 'col-span-2 sm:col-span-1' : ''}`}
              initial={{ opacity: 0, y: 20, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: idx * 0.2, duration: 0.5, type: "spring" }}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-lg shadow-blue-100/50 border-2 border-white relative overflow-hidden">
                {/* Accent bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#3b82f6] to-[#2563eb]"></div>

                <div className="relative z-10 text-center">
                  <div className="relative mx-auto mb-3 sm:mb-4 w-16 h-16 sm:w-20 sm:h-20">
                    <img
                      src={p.img || p.imgFallback}
                      alt={p.alt}
                      onError={(e) => { e.target.src = p.imgFallback; }}
                      className="w-full h-full rounded-full object-cover border-2 border-blue-100 shadow-sm"
                      loading="lazy"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border-2 border-white flex items-center justify-center shadow-md">
                      {p.type === 'active' ? (
                        <span className="text-xs font-bold text-white">🔥</span>
                      ) : p.type === 'rated' ? (
                        <span className="text-xs font-bold text-white">⭐</span>
                      ) : (
                        <span className="text-xs font-bold text-white">₹</span>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-xs sm:text-sm text-[#1e3a8a]">{p.title}</p>
                  <p className="font-extrabold text-sm sm:text-lg text-[#1e3a8a] mt-1">{p.name}</p>

                  <div className="mt-2 min-h-[20px]">
                    {p.stat && <div className="text-xs sm:text-sm font-medium text-[#2563eb]">{p.stat}</div>}
                    {p.extra}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopPerformersSection;
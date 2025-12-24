import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUsers, FaChalkboardTeacher, FaLayerGroup, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const ActivityStatsSection = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSessions: 0,
    expertUsers: 0,
    expertInterviewers: 0
  });
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  useEffect(() => {
    const fetchActivityStats = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        // Try to fetch from the new public stats endpoint
        const response = await axios.get(`${backendUrl}/api/auth/stats/public`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching activity stats:', error);
        // No static fallback data - show 0 or error state if fetch fails
        setStats({
          totalUsers: 0,
          totalSessions: 0,
          expertUsers: 0,
          expertInterviewers: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActivityStats();
  }, []);

  const statCards = [
    {
      id: 1,
      label: 'Active Learners',
      value: stats.totalUsers,
      icon: <FaUsers className="text-white" />,
      color: 'blue',
      description: 'Join our growing community',
      backgroundImage: 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589380/webimages/activesession/activeusers.jpeg'
    },
    {
      id: 2,
      label: 'Expert Tutors',
      value: stats.expertUsers,
      icon: <FaChalkboardTeacher className="text-white" />,
      color: 'purple',
      description: 'Learn from the best',
      backgroundImage: 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589380/webimages/activesession/availableexpert.jpeg'
    },
    {
      id: 3,
      label: 'Expert Interviewers',
      value: stats.expertInterviewers,
      icon: <FaUsers className="text-white" />,
      color: 'indigo',
      description: 'Practice with professionals',
      backgroundImage: 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589380/webimages/activesession/availableexpert.jpeg'
    },
    {
      id: 4,
      label: 'Sessions Completed',
      value: stats.totalSessions,
      icon: <FaLayerGroup className="text-white" />,
      color: 'green',
      description: 'Knowledge shared daily',
      backgroundImage: 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589381/webimages/activesession/completesession.jpeg'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <section className="py-6 sm:py-8 bg-home-bg" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-4 mb-8 lg:mb-0"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
              Our Impact
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0A2540] leading-tight">
              Empowering Learning <br />
              <span className="text-blue-600">Through Connection</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              SkillSwap Hub is growing fast. See how our community is making a difference in education through peer-to-peer learning and expert mentorship.
            </p>

            <div className="pt-4">
              {/* Removed static button if it doesn't lead anywhere useful, or keep as CTA */}
              <button className="group flex items-center gap-2 text-[#0A2540] font-semibold hover:text-blue-600 transition-colors">
                View detailed reports <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Right Stats Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid grid-cols-2 gap-3 sm:gap-6"
          >
            {statCards.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                className="relative p-2 sm:p-6 rounded-lg sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 min-h-[120px] sm:min-h-[180px]"
                style={{
                  backgroundImage: card.backgroundImage ? `url(${card.backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Subtle overlay for readability */}
                <div className={`absolute inset-0 ${card.backgroundImage ? 'bg-gradient-to-br from-black/60 via-black/50 to-black/65' : `bg-${card.color}-50`}`}></div>
                
                {/* Content Layout */}
                <div className="relative z-10 h-full flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                  {/* Top/Left: Count with Icon */}
                  <div className="flex-shrink-0 w-full sm:w-auto">
                    <div className={`relative w-full sm:w-20 h-14 sm:h-20 rounded-lg sm:rounded-xl ${card.backgroundImage ? 'bg-white/10 backdrop-blur-md border border-white/20' : `bg-${card.color}-100`} flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-0 shadow-lg`}>
                      <div className="text-base sm:text-2xl sm:mb-1">
                        {card.icon}
                      </div>
                      <div className={`text-base sm:text-xl font-bold ${card.backgroundImage ? 'text-white' : 'text-gray-900'}`}>
                        {inView ? <CountUp end={card.value} duration={2.5} separator="," /> : '0'}+
                      </div>
                    </div>
                  </div>

                  {/* Bottom/Right: Title & Description */}
                  <div className="flex-1 space-y-0.5 sm:space-y-2 text-center sm:text-left">
                    <h3 className={`text-xs sm:text-lg md:text-xl font-bold leading-tight ${card.backgroundImage ? 'text-white' : 'text-[#0A2540]'}`}>
                      {card.label}
                    </h3>
                    <p className={`text-[10px] sm:text-sm leading-tight sm:leading-relaxed hidden sm:block ${card.backgroundImage ? 'text-gray-200' : 'text-gray-600'}`}>
                      {card.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default ActivityStatsSection;
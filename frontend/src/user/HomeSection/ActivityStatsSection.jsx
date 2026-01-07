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
    expertInterviewers: 0,
    registeredUsers: 0
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
          expertInterviewers: 0,
          registeredUsers: 0
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6 mb-8 lg:mb-0 flex flex-col justify-center"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs w-fit">
              Our Impact
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0A2540] leading-tight">
              Empowering Learning <br />
              <span className="text-blue-600">Through Connection</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-xl">
              SkillSwap Hub is growing fast. See how our community is making a difference in education through peer-to-peer learning and expert mentorship.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] text-lg">Real-time Collaboration</h4>
                  <p className="text-gray-600 text-sm">Connect with learners and mentors instantly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] text-lg">Expert Guidance</h4>
                  <p className="text-gray-600 text-sm">Learn from industry professionals and peers</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-[#0A2540] text-lg">Track Your Progress</h4>
                  <p className="text-gray-600 text-sm">Monitor your learning journey with detailed analytics</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button className="group flex items-center gap-2 text-[#0A2540] font-semibold hover:text-blue-600 transition-colors">
                View detailed reports <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Right Stats Section */}
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Grid (4 cards in 2x2) */}
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

            {/* Full-width Registered Users Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="relative p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              style={{
                backgroundImage: 'url(https://res.cloudinary.com/dbltazdsa/image/upload/v1766589381/webimages/activesession/completesession.jpeg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/60 to-black/70"></div>
              
              {/* Content - Horizontal Layout */}
              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                {/* Left: Icon and Count */}
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-lg">
                    <FaUsers className="text-white text-2xl sm:text-3xl md:text-4xl mb-1" />
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      {inView ? <CountUp end={stats.registeredUsers} duration={2.5} separator="," /> : '0'}+
                    </div>
                  </div>
                  
                  {/* Title and Description */}
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight">
                      Registered Users
                    </h3>
                    <p className="text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">
                      Growing community of learners and mentors
                    </p>
                  </div>
                </div>

                {/* Right: Additional Info (Optional) */}
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-white font-medium">Live</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ActivityStatsSection;
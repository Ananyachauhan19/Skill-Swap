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
    expertUsers: 0
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
          expertUsers: 0
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
      icon: <FaUsers className="text-blue-600" />,
      color: 'blue',
      description: 'Join our growing community'
    },
    {
      id: 2,
      label: 'Expert Tutors',
      value: stats.expertUsers,
      icon: <FaChalkboardTeacher className="text-purple-600" />,
      color: 'purple',
      description: 'Learn from the best'
    },
    {
      id: 3,
      label: 'Sessions Completed',
      value: stats.totalSessions,
      icon: <FaLayerGroup className="text-green-600" />,
      color: 'green',
      description: 'Knowledge shared daily'
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
    <section className="py-4 sm:py-6 bg-home-bg" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-2">
              Our Impact
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0A2540] leading-tight">
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
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {statCards.map((card, index) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                className={`p-6 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-shadow ${index === 2 ? 'sm:col-span-2 sm:w-2/3 sm:mx-auto' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-${card.color}-50 flex items-center justify-center text-2xl mb-4`}>
                  {card.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {inView ? <CountUp end={card.value} duration={2.5} separator="," /> : '0'}+
                  </h3>
                  <p className="font-medium text-gray-700">{card.label}</p>
                  <p className="text-sm text-gray-500">{card.description}</p>
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
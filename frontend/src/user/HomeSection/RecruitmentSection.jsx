import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiBriefcase, FiAward, FiTrendingUp } from 'react-icons/fi';
import { BACKEND_URL } from '../../config';

const RecruitmentSection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [recruitmentCount, setRecruitmentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecruitmentStats = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/recruitment/stats`);
        if (response.ok) {
          const data = await response.json();
          setRecruitmentCount(data.totalRecruitments || 0);
        }
      } catch (error) {
        console.error('Failed to fetch recruitment stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecruitmentStats();
  }, []);

  const tabs = [
    {
      title: 'Why Join Us',
      icon: <FiUsers className="w-5 h-5" />,
      content: {
        heading: 'Be Part of Our Growing Team',
        description: 'Join SkillSwapHub and shape the future of peer-to-peer learning. We\'re building a platform where teaching, learning, and earning come together seamlessly.',
        points: [
          'Work with passionate educators and innovators',
          'Flexible work environment with growth opportunities',
          'Competitive compensation and benefits',
          'Make a real impact on global education'
        ]
      }
    },
    {
      title: 'Roles Available',
      icon: <FiBriefcase className="w-5 h-5" />,
      content: {
        heading: 'Open Positions',
        description: 'We\'re currently hiring for various positions to strengthen our team and expand our mission.',
        points: [
          'Tutor Verifiers - Review and approve tutor applications',
          'Content Moderators - Ensure quality educational content',
          'Community Managers - Build and engage our community',
          'Technical Support - Help users with platform queries'
        ]
      }
    },
    {
      title: 'Requirements',
      icon: <FiAward className="w-5 h-5" />,
      content: {
        heading: 'What We Look For',
        description: 'We seek individuals who are passionate about education and technology.',
        points: [
          'Strong communication and interpersonal skills',
          'Educational background or teaching experience preferred',
          'Attention to detail and quality-focused mindset',
          'Self-motivated with ability to work independently'
        ]
      }
    },
    {
      title: 'Growth Path',
      icon: <FiTrendingUp className="w-5 h-5" />,
      content: {
        heading: 'Career Development',
        description: 'We believe in nurturing talent and providing opportunities for professional growth.',
        points: [
          'Clear career progression pathways',
          'Regular training and skill development programs',
          'Performance-based incentives and bonuses',
          'Leadership opportunities as we scale'
        ]
      }
    }
  ];

  const AnimatedCounter = ({ end }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (end === 0) return;
      
      const duration = 2000;
      const steps = 60;
      const increment = end / steps;
      const stepDuration = duration / steps;
      
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, stepDuration);

      return () => clearInterval(timer);
    }, [end]);

    return <span>{count}+</span>;
  };

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header with Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Career Opportunities
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 relative">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
              Join Our Mission
            </span>
          </h2>
          
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Become part of a team that's revolutionizing education through peer-to-peer learning
          </p>

          {/* Recruitment Counter */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-4 bg-white rounded-2xl px-8 py-4 shadow-lg border-2 border-blue-100"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 text-white">
              <FiUsers className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="text-3xl font-bold text-blue-900">
                {loading ? (
                  <span className="inline-block w-20 h-8 bg-gray-200 animate-pulse rounded"></span>
                ) : (
                  <AnimatedCounter end={recruitmentCount} />
                )}
              </div>
              <div className="text-sm text-gray-600 font-medium">Team Members Recruited</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 ${
                  activeTab === index
                    ? 'bg-gradient-to-r from-blue-800 to-blue-900 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-900 shadow-md'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.title}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl p-6 sm:p-8 md:p-10 shadow-xl border border-gray-100"
        >
          <div className="mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {tabs[activeTab].content.heading}
            </h3>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              {tabs[activeTab].content.description}
            </p>
          </div>

          <ul className="space-y-4 mb-8">
            {tabs[activeTab].content.points.map((point, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm sm:text-base leading-relaxed">{point}</span>
              </motion.li>
            ))}
          </ul>

          {/* CTA Button */}
          <motion.button
            onClick={() => navigate('/career')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white px-8 py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
          >
            <FiBriefcase className="w-5 h-5" />
            Apply Now for Tutor Role
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default RecruitmentSection;

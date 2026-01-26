import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

const ExploreOpportunitiesSection = () => {
  const opportunities = [
    // {
    //   title: 'Live Arena Sessions',
    //   description: 'Join interactive live sessions hosted by experts in real-time. Enhance your skills through collaborative learning.',
    //   color: 'blue',
    // },
    {
      title: 'One on One Sessions',
      description: 'Connect with peers and exchange skills in personalized peer-to-peer sessions.',
      color: 'purple',
      link: '/one-on-one',
    },
    {
      title: 'Mock Interview Practice',
      description: 'Practice interviews live with experienced mentors and receive detailed feedback to ace your next interview.',
      color: 'green',
      link: '/interview',
    },
    {
      title: 'Campus Dashboard',
      description: 'Become a Campus Ambassador and lead the SkillSwap community at your institution. Make an impact.',
      color: 'orange',
      link: '/campus-dashboard/login',
    },
    {
      title: 'Quizment',
      description: 'Test your knowledge with interactive quizzes and assessments. Track your progress and improve continuously.',
      color: 'indigo',
      link: '/quizement',
    }
  ];

  const scrollContainerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useModal();

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const maxIndex = opportunities.length - 3; // Show 3 tabs on web
        return prevIndex >= maxIndex ? 0 : prevIndex + 1;
      });
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [opportunities.length]);

  // Scroll to current index
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = container.scrollWidth / opportunities.length;
      container.scrollTo({
        left: cardWidth * currentIndex,
        behavior: 'smooth'
      });
    }
  }, [currentIndex, opportunities.length]);

  const handleNavigate = (link) => {
    if (!link) return;
    if (!user) {
      openLogin();
      return;
    }
    navigate(link);
  };

  const getGradientClass = (color) => {
    const gradients = {
      blue: 'from-blue-50 via-blue-100 to-blue-200',
      purple: 'from-purple-50 via-purple-100 to-purple-200',
      green: 'from-green-50 via-green-100 to-green-200',
      orange: 'from-orange-50 via-orange-100 to-orange-200',
      indigo: 'from-indigo-50 via-indigo-100 to-indigo-200'
    };
    return gradients[color] || gradients.blue;
  };

  const getBorderClass = (color) => {
    const borders = {
      blue: 'border-blue-400',
      purple: 'border-purple-400',
      green: 'border-green-400',
      orange: 'border-orange-400',
      indigo: 'border-indigo-400'
    };
    return borders[color] || borders.blue;
  };

  return (
    <section id="explore" className="py-8 sm:py-12 bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0A2540] mb-4"
          >
            Explore Opportunities
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Discover the various ways you can grow and learn on SkillSwap Hub
          </motion.p>
        </div>

        {/* Desktop: Show 3 tabs */}
        <div className="hidden md:block">
          <div 
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {opportunities.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleNavigate(item.link)}
                className={`
                  flex-shrink-0 w-[calc(33.333%-16px)] snap-start
                  rounded-xl p-6 cursor-pointer
                  bg-gradient-to-br ${getGradientClass(item.color)}
                  border-2 ${getBorderClass(item.color)}
                  shadow-lg hover:shadow-xl
                  transition-all duration-300 hover:scale-105
                  min-h-[220px] max-h-[240px]
                  flex flex-col justify-between
                `}
              >
                <div>
                  <h3 className="text-xl font-bold text-[#0A2540] mb-3 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {item.link && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(item.link);
                    }}
                    className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors text-left"
                  >
                    Learn more →
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: Show 2 tabs */}
        <div className="md:hidden">
          <div 
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {opportunities.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleNavigate(item.link)}
                className={`
                  flex-shrink-0 w-[calc(50%-8px)] snap-start
                  rounded-lg p-5 cursor-pointer
                  bg-gradient-to-br ${getGradientClass(item.color)}
                  border-2 ${getBorderClass(item.color)}
                  shadow-md hover:shadow-lg
                  transition-all duration-300
                  min-h-[200px] max-h-[220px]
                  flex flex-col justify-between
                `}
              >
                <div>
                  <h3 className="text-lg font-bold text-[#0A2540] mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {item.link && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(item.link);
                    }}
                    className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors text-left"
                  >
                    Learn more →
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default ExploreOpportunitiesSection;
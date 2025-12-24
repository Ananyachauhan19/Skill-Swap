import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserFriends, FaVideo, FaBriefcase, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';

const ExploreOpportunitiesSection = () => {
  const opportunities = [
    {
      title: 'Live Arena sessions',
    
      icon: <FaUserFriends />,
      color: 'blue',
     description: 'Join interactive live sessions hosted by experts in real-time.',
      backgroundImage: 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589381/webimages/exploreopportunities/livesession.jpeg'
    },
    {
      title: 'One on One Sessions',
       description: 'Connect with peers and exchange skills in peer to peer Sessions.',
      icon: <FaVideo />,
      color: 'purple',
      link: '/one-on-one',
      backgroundImage: 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589382/webimages/exploreopportunities/peertopeer.jpeg'
    },
    {
      title: 'Mock Interview Practice',
      description: 'Practice interviews live with mentors and get feedback.',
      icon: <FaBriefcase />,
      color: 'green',
      link: '/interview',
       backgroundImage: 'https://res.cloudinary.com/dbltazdsa/image/upload/v1766589381/webimages/exploreopportunities/mockinterview.jpeg'
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

  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useModal();

  const handleNavigate = (link) => {
    if (!link) return;
    if (!user) {
      openLogin();
      return;
    }
    navigate(link);
  };

  return (
    <section id="explore" className="py-6 sm:py-8 bg-home-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0A2540] mb-3"
          >
            Explore Opportunities
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Discover the various ways you can grow and learn on SkillSwap Hub.
          </motion.p>
        </div>

        {/* Desktop: Grid Layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="hidden md:grid md:grid-cols-3 gap-8"
        >
          {opportunities.map((item, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              onClick={() => handleNavigate(item.link)}
              className="relative rounded-2xl p-8 shadow-sm border border-gray-100 cursor-pointer overflow-hidden"
              style={{
                backgroundImage: item.backgroundImage ? `url(${item.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            >
              {/* Content */}
              <div className="relative z-10">
                <div
                  className={`w-14 h-14 rounded-xl ${
                    item.backgroundImage ? `bg-${item.color}-50 text-${item.color}-600` : `bg-${item.color}-50 text-${item.color}-600`
                  } flex items-center justify-center text-2xl mb-6`}
                >
                  {item.icon}
                </div>
                <h3
                  className="text-xl font-bold mb-3 text-[#0A2540]"
                >
                  {item.title}
                </h3>
                <p className="mb-6 leading-relaxed text-gray-700">
                  {item.description}
                </p>
                <button
                  onClick={(e) => {
    e.stopPropagation();
    handleNavigate(item.link);
                  }}
                  className="flex items-center text-sm font-semibold text-blue-600"
                >
                  Learn more <FaArrowRight className="ml-1" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mobile: Horizontal Scroll */}
        <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 pb-4">
            {opportunities.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(item.link)}
                className="relative rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer flex-shrink-0 w-[280px] overflow-hidden"
                style={{
                  backgroundImage: item.backgroundImage ? `url(${item.backgroundImage})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Content */}
                <div className="relative z-10">
                  <div
                    className={`w-12 h-12 rounded-lg ${
                      item.color === 'blue'
                        ? 'bg-blue-50 text-blue-600'
                        : item.color === 'purple'
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-green-50 text-green-600'
                    } flex items-center justify-center text-xl mb-4`}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-[#0A2540]">
                    {item.title}
                  </h3>
                  <p className="text-sm mb-4 leading-relaxed text-gray-700">
                    {item.description}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(item.link);
                    }}
                    className="flex items-center text-xs font-semibold text-blue-600"
                  >
                    Learn more <FaArrowRight className="ml-1" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          
        </motion.div>
      </div>
    </section>
  );
};

export default ExploreOpportunitiesSection;
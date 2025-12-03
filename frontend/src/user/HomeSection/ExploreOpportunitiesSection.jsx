import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUserFriends, FaVideo, FaBriefcase, FaArrowRight } from 'react-icons/fa';

const ExploreOpportunitiesSection = () => {
  const opportunities = [
    {
      title: 'Peer-to-Peer Learning',
      description: 'Connect with peers to exchange skills and knowledge directly.',
      icon: <FaUserFriends />,
      color: 'blue',
      link: '/StartSkillSwap'
    },
    {
      title: 'One on One Sessions',
      description: 'Join interactive live sessions hosted by experts in real-time.',
      icon: <FaVideo />,
      color: 'purple',
      link: '/one-on-one'
    },
    {
      title: 'Live Interview Practice',
      description: 'Practice interviews live with mentors and get feedback.',
      icon: <FaBriefcase />,
      color: 'green',
      link: '/interview'
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
              whileHover={{ y: -10 }}
              onClick={() => navigate(item.link)}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {item.description}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(item.link); }}
                className="flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all"
              >
                Learn more <FaArrowRight className="ml-1" />
              </button>
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
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer flex-shrink-0 w-[280px]"
              >
                <div className={`w-12 h-12 rounded-lg ${item.color === 'blue' ? 'bg-blue-50 text-blue-600' : item.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'} flex items-center justify-center text-xl mb-4`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {item.description}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(item.link); }}
                  className="flex items-center text-xs font-semibold text-blue-600"
                >
                  Learn more <FaArrowRight className="ml-1" />
                </button>
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
          <p className="text-gray-500 text-sm">
            Trusted by thousands of learners worldwide. <span className="text-blue-600 font-semibold cursor-pointer hover:underline">Join them today.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ExploreOpportunitiesSection;
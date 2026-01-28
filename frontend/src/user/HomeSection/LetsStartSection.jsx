import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaRocket, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

const LetsStartSection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-6 sm:py-10 bg-home-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-br from-[#0A2540] to-[#1e3a8a] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-16 overflow-hidden text-center shadow-2xl"
        >
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm"
            >
              <img
                src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
                alt="SkillSwap Logo"
                className="w-10 h-10 object-contain drop-shadow-sm"
              />
            </motion.div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
              Ready to Start Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">Learning Journey?</span>
            </h2>

            <p className="text-sm sm:text-base md:text-lg text-blue-100 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Join thousands of learners and experts on SkillSwap Hub. Whether you want to master a new skill or share your expertise, your journey begins here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 sm:mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const exploreSection = document.getElementById('explore');
                  if (exploreSection) {
                    exploreSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    navigate('/home#explore');
                  }
                }}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-base sm:text-lg shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
              >
                Get Started Now <FaArrowRight className="text-sm sm:text-base" />
              </motion.button>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm text-blue-200 px-2">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 flex-shrink-0" /> 
                <span>Peer-to-peer learning with real professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 flex-shrink-0" /> 
                <span>1-on-1 live sessions using Skill Coins</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400 flex-shrink-0" /> 
                <span>Live interview practice with actionable feedback</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LetsStartSection;

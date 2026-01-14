import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const QuizementHeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/quizement/');
  };

  return (
    <section className="relative w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 xl:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          
          {/* Left Side - Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 lg:space-y-8 text-center lg:text-left order-2 lg:order-1"
          >
            {/* Main Heading */}
            <div className="space-y-3 sm:space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight"
              >
                Master Your Skills with{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-blue-900">Quizement</span>
                  <motion.span 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="absolute bottom-2 sm:bottom-3 left-0 h-3 sm:h-4 bg-yellow-300/60 -z-0"
                  ></motion.span>
                </span>
              </motion.h1>

              {/* Subtitle/Description */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0"
              >
                Elevate your learning with targeted assessments that track progress and enhance exam readiness.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="px-8 py-4 bg-blue-900 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-800 transition-all hover:shadow-xl text-base sm:text-lg"
              >
                Get Started Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-blue-900 font-semibold rounded-xl shadow-md hover:shadow-lg border-2 border-blue-900 transition-all text-base sm:text-lg"
              >
                Learn More
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-8 pt-4 border-t border-slate-200"
            >
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-blue-900">10K+</div>
                <div className="text-xs sm:text-sm text-slate-600">Questions</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-blue-900">5K+</div>
                <div className="text-xs sm:text-sm text-slate-600">Students</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl sm:text-3xl font-bold text-blue-900">95%</div>
                <div className="text-xs sm:text-sm text-slate-600">Success Rate</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Image Only */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="order-1 lg:order-2 w-full"
          >
            <img
              src="/quizmnet_hero.png"
              alt="Quizement - Student learning and assessment platform"
              className="w-full h-auto object-contain"
              loading="eager"
            />
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default QuizementHeroSection;

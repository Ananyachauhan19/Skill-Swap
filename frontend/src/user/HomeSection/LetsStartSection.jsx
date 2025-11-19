import React from 'react';
import { motion } from 'framer-motion';
import { FaRocket, FaArrowRight, FaCheckCircle } from 'react-icons/fa';

const LetsStartSection = () => {
  return (
    <section className="py-4 sm:py-6 bg-home-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-[#0A2540] rounded-3xl p-8 md:p-16 overflow-hidden text-center shadow-2xl"
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
              <FaRocket className="text-3xl text-blue-400" />
            </motion.div>

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to Start Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Learning Journey?</span>
            </h2>

            <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of learners and experts on SkillSwap Hub. Whether you want to master a new skill or share your expertise, your journey begins here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-lg shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                Get Started Now <FaArrowRight />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border border-white/30 text-white rounded-full font-bold text-lg hover:bg-white/5 transition-all"
              >
                Browse Courses
              </motion.button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200/80">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" /> No credit card required
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" /> 14-day free trial
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-400" /> Cancel anytime
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LetsStartSection;

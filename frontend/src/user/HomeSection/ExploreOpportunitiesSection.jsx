import React from "react";
import { motion } from "framer-motion";

const ExploreOpportunitiesSection = ({ featureTabs, tabVariants, navigate, exploreRef }) => (
  <section ref={exploreRef} className="py-12 sm:py-16 px-4 sm:px-8 bg-gradient-to-br from-blue-50 to-blue-100/50">
    <motion.div 
      className="max-w-5xl mx-auto" 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <h3 className="text-2xl sm:text-3xl font-bold text-center text-blue-900 mb-10">
        Explore Learning Opportunities
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {featureTabs.map((tab, idx) => (
          <motion.div
            key={tab.title}
            className="group relative rounded-xl p-5 sm:p-6 bg-white cursor-pointer overflow-hidden"
            style={{
              boxShadow: "0 10px 30px -10px rgba(0, 0, 100, 0.2)",
              transformStyle: "preserve-3d"
            }}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate(tab.path)}
            transition={{ 
              delay: idx * 0.1 + 0.4,
              type: "spring",
              stiffness: 300
            }}
          >
            {/* Decorative circle and triangle */}
            <div 
              className="absolute w-24 h-24 rounded-full bg-blue-50/40 opacity-50 
              -top-8 -left-8 group-hover:scale-110 transition-transform duration-500" 
            />
            <div 
              className="absolute w-0 h-0 border-l-[20px] border-l-transparent 
              border-r-[20px] border-r-transparent border-b-[30px] border-b-blue-50/30 
              opacity-50 top-2 right-2 group-hover:rotate-12 transition-transform duration-500" 
            />

            {/* 3D depth effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-100/50 to-cyan-100/50 
              transition-all duration-300 group-hover:opacity-100 opacity-0" 
              style={{
                transform: "translateZ(-20px)",
                filter: "blur(10px)"
              }}
            />
            
            {/* Card content */}
            <div className="relative" style={{ transformStyle: "preserve-3d" }}>
              <div className="mb-4 p-3 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl shadow-inner inline-block">
                {tab.icon}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-blue-900 mb-2 group-hover:text-blue-700 transition-colors">
                {tab.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4">
                {tab.subtitle}
              </p>
              <button className="text-blue-900 font-medium text-xs sm:text-sm hover:text-blue-700 transition-colors flex items-center">
                Explore now
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </section>
);

export default ExploreOpportunitiesSection;
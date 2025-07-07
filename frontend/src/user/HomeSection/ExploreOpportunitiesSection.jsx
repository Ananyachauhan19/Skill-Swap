import React from "react";
import { motion } from "framer-motion";

const ExploreOpportunitiesSection = ({ featureTabs, tabVariants, navigate, exploreRef }) => (
  <section ref={exploreRef} className="py-12 sm:py-16 px-4 sm:px-8 bg-blue-50">
    <motion.div className="max-w-5xl mx-auto" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
      <h3 className="text-xl font-semibold text-center text-blue-900 mb-8">
        Explore Learning Opportunities
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {featureTabs.map((tab, idx) => (
          <motion.div
            key={tab.title}
            className={`${tab.bg} rounded-md p-6 shadow-md border border-blue-100 cursor-pointer hover:shadow-xl transition-all duration-300`}
            variants={tabVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            onClick={() => navigate(tab.path)}
            transition={{ delay: idx * 0.1 + 0.4 }}
          >
            <div className="mb-4 p-3 bg-white rounded-full shadow-inner">{tab.icon}</div>
            <h3 className="text-xl font-bold text-blue-900 mb-2">{tab.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{tab.subtitle}</p>
            <button className="text-blue-900 font-medium text-sm hover:text-blue-800 transition-colors">
              Explore now →
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  </section>
);

export default ExploreOpportunitiesSection;

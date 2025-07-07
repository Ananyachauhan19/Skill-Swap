import React from "react";
import { motion } from "framer-motion";

const ActivityStatsSection = ({ stats }) => (
  <section className="py-12 sm:py-16 px-4 sm:px-8 bg-gray-100">
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          className="bg-white rounded-md p-6 flex flex-col items-center gap-3 shadow-md border border-blue-100 hover:shadow-xl transition-all duration-300"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: idx * 0.2, duration: 0.5 }}
        >
          {stat.icon}
          <div>
            <p className="text-2xl font-bold text-blue-900">
              {stat.value.toLocaleString()}+
            </p>
            <p className="text-sm text-gray-600 mt-2">{stat.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default ActivityStatsSection;

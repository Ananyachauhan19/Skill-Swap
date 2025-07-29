import React from "react";
import { motion } from "framer-motion";

const ActivityStatsSection = ({ stats }) => (
  <section className="py-12 sm:py-16 px-4 sm:px-8 bg-gradient-to-br from-blue-50 to-blue-100/50">
    <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4 sm:gap-6 text-center">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          className="group relative rounded-xl p-5 sm:p-6 bg-white overflow-hidden"
          style={{
            boxShadow: "0 10px 30px -10px rgba(0, 0, 100, 0.2)",
            transformStyle: "preserve-3d"
          }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }} // Minimal hover
          transition={{ 
            delay: idx * 0.2, 
            duration: 0.5,
            type: "spring",
            stiffness: 300
          }}
        >
          {/* Decorative circle and triangle */}
          <div 
            className="absolute w-20 h-20 rounded-full bg-blue-50/40 opacity-50 
            -top-6 -left-6 group-hover:scale-105 transition-transform duration-500" 
          />
          <div 
            className="absolute w-0 h-0 border-l-[15px] border-l-transparent 
            border-r-[15px] border-r-transparent border-b-[25px] border-b-blue-50/30 
            opacity-50 top-2 right-2 group-hover:rotate-6 transition-transform duration-500" 
          />

          {/* 3D depth effect */}
          <div 
            className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-100/50 to-cyan-100/50 
            transition-all duration-300 group-hover:opacity-80 opacity-0" 
            style={{
              transform: "translateZ(-20px)",
              filter: "blur(10px)"
            }}
          />

          {/* Card content */}
          <div className="relative flex flex-col items-center gap-3" style={{ transformStyle: "preserve-3d" }}>
            <div className="p-2.5 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-xl shadow-inner inline-block">
              {stat.icon}
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                {stat.value.toLocaleString()}+
              </p>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </section>
);

export default ActivityStatsSection;
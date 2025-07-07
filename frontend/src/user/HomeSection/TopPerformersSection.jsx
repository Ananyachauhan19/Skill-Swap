import React from "react";
import { motion } from "framer-motion";

const TopPerformersSection = ({ performers }) => (
  <section className="py-12 sm:py-16 px-4 sm:px-8 bg-blue-50">
    <h2 className="text-2xl sm:text-4xl font-bold text-center text-blue-900 mb-10">
      Our Top Performers
    </h2>
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-center gap-6">
      {performers.map((p, idx) => (
        <motion.div
          key={p.title}
          className="bg-white rounded-md shadow-md p-5 w-full sm:w-72 text-center hover:shadow-xl transition-all duration-300 border border-blue-100"
          initial={{ opacity: 0, y: 20, rotate: 3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: idx * 0.2, duration: 0.5 }}
        >
          <picture>
            <source srcSet={p.img} type="image/webp" />
            <img
              src={p.imgFallback}
              alt={p.alt}
              className="w-20 h-20 mx-auto rounded-full object-cover mb-3 border-2 border-blue-100"
              loading="lazy"
            />
          </picture>
          <p className="font-semibold text-base text-blue-900">{p.title}</p>
          <p className="font-bold text-lg text-blue-900 mt-2">{p.name}</p>
          {p.stat && <p className="text-sm text-gray-600 mt-2">{p.stat}</p>}
          {p.extra}
        </motion.div>
      ))}
    </div>
  </section>
);

export default TopPerformersSection;

import React from "react";
import { motion } from "framer-motion";

const TopPerformersSection = () => {
  const cardVariants = {
    hover: {
      y: -5,
      boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.98 },
  };

  const performers = [
    {
      img: "/user1.webp",
      imgFallback: "/user1.png",
      alt: "Most Active",
      title: "Most Active Learner",
      name: "Aditya Singh",
      stat: "15 sessions",
    },
    {
      img: "/user2.webp",
      imgFallback: "/user2.png",
      alt: "Top Tutor",
      title: "Highest Rated Tutor",
      name: "Ananya S.",
      extra: <span className="text-blue-300 text-xl sm:text-2xl">★★★★★</span>,
    },
    {
      img: "/user3.webp",
      imgFallback: "/user3.png",
      alt: "Top Earner",
      title: "Top Earner",
      name: "Rahul",
      stat: <span className="font-semibold text-sm sm:text-base text-blue-600">₹ 8,200 Earned</span>,
    },
  ];

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-8 bg-gradient-to-br from-[#FFFFFF] to-[#F5F8FF]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
          {performers.map((p, idx) => (
            <motion.div
              key={p.title}
              className={`relative ${idx === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
              initial={{ opacity: 0, y: 20, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: idx * 0.2, duration: 0.5, type: "spring" }}
              variants={cardVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="bg-white rounded-xl p-4 sm:p-5 shadow-lg shadow-blue-100/50 border-2 border-white relative overflow-hidden">
                {/* Accent bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-300"></div>

                <div className="relative z-10 text-center">
                  <div className="relative mx-auto mb-3 sm:mb-4 w-16 h-16 sm:w-20 sm:h-20">
                    <picture>
                      <source srcSet={p.img} type="image/webp" />
                      <img
                        src={p.imgFallback}
                        alt={p.alt}
                        className="w-full h-full rounded-full object-cover border-2 border-blue-100 shadow-sm"
                        loading="lazy"
                      />
                    </picture>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-300 border-2 border-blue-100 flex items-center justify-center">
                      {idx === 0 ? (
                        <span className="text-xs font-bold text-blue-800">🔥</span>
                      ) : idx === 1 ? (
                        <span className="text-xs font-bold text-blue-700">⭐</span>
                      ) : (
                        <span className="text-xs font-bold text-blue-800">₹</span>
                      )}
                    </div>
                  </div>

                  <p className="font-bold text-xs sm:text-sm text-blue-900">{p.title}</p>
                  <p className="font-extrabold text-sm sm:text-lg text-blue-900 mt-1">{p.name}</p>

                  <div className="mt-2 min-h-[20px]">
                    {p.stat && <div className="text-xs sm:text-sm font-medium text-blue-800">{p.stat}</div>}
                    {p.extra}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopPerformersSection;
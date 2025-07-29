import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaGlobe, FaLightbulb, FaHandshake } from "react-icons/fa";

const WhoAreWeSection = ({ navigate }) => {
  const [activeCard, setActiveCard] = useState(null);

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut", delay: 0.2 },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  const cardVariants = {
    hover: {
      y: -5,
      boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
    },
    tap: {
      scale: 0.98,
    },
    active: {
      scale: 1.03,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
    },
  };

  const iconVariants = {
    normal: { scale: 1 },
    active: {
      scale: [0.8, 1.3, 1],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 0.6,
        times: [0, 0.4, 0.8, 1],
      },
    },
  };

  const features = [
    {
      icon: FaGlobe,
      label: "Global Community",
      desc: "Connect with professionals worldwide",
      color: "bg-pink-100",
      iconColor: "text-pink-500",
    },
    {
      icon: FaLightbulb,
      label: "Innovative Learning",
      desc: "Access cutting-edge knowledge",
      color: "bg-yellow-100",
      iconColor: "text-yellow-500",
    },
    {
      icon: FaHandshake,
      label: "Collaborative Growth",
      desc: "Grow through shared expertise",
      color: "bg-green-100",
      iconColor: "text-green-500",
    },
  ];

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-8 bg-gradient-to-br from-[#FFFFFF] to-[#F5F8FF]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-10 items-center">
        <motion.div
          className="lg:w-1/2 space-y-5 sm:space-y-8"
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900 leading-tight">
            Who We Are
          </h2>

          <p className="text-base sm:text-lg text-gray-700 max-w-xl leading-relaxed">
            SkillSwap-Hub is a transformative platform dedicated to empowering professionals through peer-to-peer learning and skill exchange. We connect a vibrant global community of experts, mentors, and learners, creating a dynamic ecosystem where knowledge flows freely.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {features.map((item, idx) => (
              <motion.div
                key={item.label}
                className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl border-2 border-white ${item.color} cursor-pointer ${idx === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
                variants={cardVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setActiveCard(activeCard === idx ? null : idx)}
              >
                <motion.div
                  className={`p-2 sm:p-3 rounded-full bg-white ${activeCard === idx ? `ring-4 ring-opacity-50 ring-${item.iconColor.split('-')[1]}-300` : ''}`}
                  variants={iconVariants}
                  animate={activeCard === idx ? "active" : "normal"}
                >
                  <item.icon className={`text-2xl sm:text-3xl ${item.iconColor}`} />
                </motion.div>
                <p className="text-sm sm:text-base font-semibold text-gray-800 mt-1">{item.label}</p>
                <p className="text-xs sm:text-sm text-gray-600 text-center">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          
        </motion.div>

        <motion.div
          className="lg:w-1/2 w-full mt-6 sm:mt-0"
          initial="hidden"
          animate="visible"
          variants={imageVariants}
        >
          <div className="rounded-xl overflow-hidden shadow-xl">
            <picture>
              <source srcSet="/assets/skillswap-community.webp" type="image/webp" />
              <img
                src="/assets/skillswap-community.webp"
                alt="SkillSwap Community"
                className="w-full h-auto object-cover aspect-[4/3] sm:aspect-[3/4] lg:aspect-[16/9]"
                loading="lazy"
              />
            </picture>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhoAreWeSection;
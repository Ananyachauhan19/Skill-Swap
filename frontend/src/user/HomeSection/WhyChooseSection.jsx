import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaBriefcase, FaUserFriends, FaComments } from "react-icons/fa";

const WhyChooseSection = ({ isLoggedIn, openRegister }) => {
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
      icon: FaBriefcase,
      label: "Real-World Practice",
      desc: "Hone skills through live sessions",
      color: "bg-blue-100",
      iconColor: "text-blue-500",
    },
    {
      icon: FaUserFriends,
      label: "Personalized Mentorship",
      desc: "Learn from industry experts",
      color: "bg-purple-100",
      iconColor: "text-purple-500",
    },
    {
      icon: FaComments,
      label: "Collaborative Learning",
      desc: "Engage in group discussions",
      color: "bg-teal-100",
      iconColor: "text-teal-500",
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
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900 leading-tight whitespace-nowrap">
            Why Choose SkillSwap-Hub
          </h2>
          <p className="text-base sm:text-lg text-gray-700 max-w-xl leading-relaxed">
            SkillSwap-Hub provides a professional environment for skill development. Engage in live sessions, earn credits by teaching, and join a global community of learners and experts. Our platform empowers you to grow through hands-on practice, personalized mentorship, and collaborative learning, ensuring you stay ahead in your career with practical, real-world skills.
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
          {!isLoggedIn && (
            <motion.button
              onClick={() => openRegister()}
              className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-lg font-semibold text-sm sm:text-base shadow-md"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Join Now
            </motion.button>
          )}
        </motion.div>
        <motion.div
          className="lg:w-1/2 w-full mt-6 sm:mt-0"
          initial="hidden"
          animate="visible"
          variants={imageVariants}
        >
          <picture>
            <source srcSet="/assets/skillchoose.webp" type="image/webp" />
            <img
              src="/assets/skillchoose.webp"
              alt="Why Choose SkillSwap"
              className="w-full h-[300px] sm:h-[450px] object-cover max-h-[300px] sm:max-h-[450px]"
              loading="lazy"
            />
          </picture>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
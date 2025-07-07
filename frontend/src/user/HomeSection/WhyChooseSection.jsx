import React from "react";
import { motion } from "framer-motion";
import { FaBriefcase, FaUserFriends, FaComments } from "react-icons/fa";

const WhyChooseSection = ({ isLoggedIn, openRegister }) => {
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
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 bg-blue-50">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
        <motion.div
          className="lg:w-1/2 space-y-8"
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-900 leading-tight whitespace-nowrap">
            Why Choose SkillSwap-Hub
          </h2>
          <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
            SkillSwap-Hub provides a professional environment for skill development. Engage in live sessions, earn credits by teaching, and join a global community of learners and experts. Our platform empowers you to grow through hands-on practice, personalized mentorship, and collaborative learning, ensuring you stay ahead in your career with practical, real-world skills.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <FaBriefcase className="text-4xl text-blue-800" />, label: "Real-World Practice", desc: "Hone skills through live sessions" },
              { icon: <FaUserFriends className="text-4xl text-blue-800" />, label: "Personalized Mentorship", desc: "Learn from industry experts" },
              { icon: <FaComments className="text-4xl text-blue-800" />, label: "Collaborative Learning", desc: "Engage in group discussions" },
            ].map((item, idx) => (
              <motion.div
                key={item.label}
                className="flex flex-col items-center gap-3 bg-white p-6 rounded-lg shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
              >
                {item.icon}
                <p className="text-base font-semibold text-blue-900">{item.label}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          {!isLoggedIn && (
            <motion.button
              onClick={() => openRegister()}
              className="bg-blue-900 text-white px-8 py-4 rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Join Now
            </motion.button>
          )}
        </motion.div>
        <motion.div
          className="lg:w-1/2 relative"
          initial="hidden"
          animate="visible"
          variants={imageVariants}
        >
          <picture>
            <source srcSet="/assets/skillchoose.webp" type="image/webp" />
            <img
              src="/assets/skillchoose.webp"
              alt="Why Choose SkillSwap"
              className="w-full h-[450px] object-cover"
              loading="lazy"
            />
          </picture>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseSection;

import React from "react";
import { motion } from "framer-motion";
import { FaGlobe, FaLightbulb, FaHandshake } from "react-icons/fa";

const WhoAreWeSection = ({ navigate }) => {
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-900 leading-tight">
            Who We Are
          </h2>
          <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
            SkillSwap-Hub is a transformative platform dedicated to empowering professionals through peer-to-peer learning and skill exchange. We connect a vibrant global community of experts, mentors, and learners, creating a dynamic ecosystem where knowledge flows freely, skills are honed collaboratively, and career growth is accelerated. Our mission is to democratize professional education by providing unparalleled access to real-world expertise, personalized mentorship, and interactive group discussions. Join us to share your expertise, learn from industry leaders, and build a network that propels your career forward.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <FaGlobe className="text-4xl text-blue-800" />, label: "Global Community", desc: "Connect with professionals worldwide" },
              { icon: <FaLightbulb className="text-4xl text-blue-800" />, label: "Innovative Learning", desc: "Access cutting-edge knowledge" },
              { icon: <FaHandshake className="text-4xl text-blue-800" />, label: "Collaborative Growth", desc: "Grow through shared expertise" },
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
          <motion.button
            onClick={() => navigate("/explore")}
            className="bg-blue-900 text-white px-8 py-4 rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            Explore Our Community
          </motion.button>
        </motion.div>
        <motion.div
          className="lg:w-1/2 relative"
          initial="hidden"
          animate="visible"
          variants={imageVariants}
        >
          <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-blue-200">
            <picture>
              <source srcSet="/assets/skillswap-community.webp" type="image/webp" />
              <img
                src="/assets/skillswap-community.webp"
                alt="SkillSwap Community"
                className="w-full h-[450px] object-cover transform hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </picture>
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-xl font-semibold">Empowering Professionals</p>
              <p className="text-sm">Connect, Learn, Succeed</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default WhoAreWeSection;

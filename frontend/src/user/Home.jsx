import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaExchangeAlt, FaChalkboardTeacher, FaUsers, FaComments, FaCrown, FaChalkboard } from "react-icons/fa";
import CountUp from "react-countup";

// Image imports
const oneOnOneImg = "/assets/one-on-one.png";
const groupChatImg = "/assets/group-chat.png";
const interviewImg = "/assets/interview-icon.png";
const user1Img = "/user1.png";
const user2Img = "/user2.png";
const user3Img = "/user3.png";

const Home = () => {
  const navigate = useNavigate();

  // Stats state
  const [stats, setStats] = useState([
    {
      icon: <FaUsers className="text-4xl text-blue-600" />,
      value: 18200,
      label: "Active Members",
    },
    {
      icon: <FaChalkboardTeacher className="text-4xl text-blue-600" />,
      value: 4500,
      label: "Experts Available",
    },
    {
      icon: <FaComments className="text-4xl text-blue-600" />,
      value: 50,
      label: "Session Types",
    },
  ]);

  // Top performers state
  const [performers] = useState([
    {
      img: user1Img,
      alt: "Most Active",
      title: "Most Active Learner",
      name: "Aditya Singh",
      stat: "15 sessions",
    },
    {
      img: user2Img,
      alt: "Top Tutor",
      title: "Highest Rated Tutor",
      name: "Ananya S.",
      extra: <span className="text-yellow-500 text-xl">★★★★★</span>,
    },
    {
      img: user3Img,
      alt: "Top Earner",
      title: "Top Earner",
      name: "Rahul",
      stat: <span className="text-green-600 font-bold">₹ 8,200 Earned</span>,
    },
  ]);

  // Animation variants for tabs
  const tabVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    hover: { scale: 1.03, transition: { duration: 0.2 } },
  };

  // Animation variants for stats and performers
  const statVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Animation variants for text sections
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  // Feature tabs data
  const featureTabs = [
    {
      title: "1 on 1 Session",
      subtitle: "Personalized Mentorship",
      img: oneOnOneImg,
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      path: "/one-on-one",
    },
    {
      title: "Job Interview",
      subtitle: "Real Practice. Real Growth.",
      img: interviewImg,
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      path: "/interview",
    },
    {
      title: "Group Discussion",
      subtitle: "Collaborative Growth",
      img: groupChatImg,
      bg: "bg-gradient-to-br from-violet-50 to-violet-100",
      path: "/discuss",
    },
    {
      title: "Workshops",
      subtitle: "Coming Soon!",
      icon: <FaChalkboard className="text-blue-600 text-4xl" />,
      bg: "bg-gradient-to-br from-gray-50 to-gray-100",
      path: "#",
      disabled: true,
    },
    {
      title: "Masterclasses",
      subtitle: "Stay Tuned!",
      icon: <FaCrown className="text-blue-600 text-4xl" />,
      bg: "bg-gradient-to-br from-gray-50 to-gray-100",
      path: "#",
      disabled: true,
    },
  ];

  return (
    <main className="bg-[#f8fafc] text-gray-800 min-h-screen font-[Poppins]">
      {/* 1. Hero Section */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">
          {/* Left Panel (60%) */}
          <div className="lg:col-span-3">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight"
            >
              <span className="text-[#1e3a8a]">Swapping Skills</span>{" "}
              <span className="text-[#1a56db]">Together</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg sm:text-xl text-gray-600 mt-6 max-w-2xl leading-relaxed"
            >
              Empower yourself to learn, teach, and grow through live sessions, 
              collaborative discussions, and real-world interview practice.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#1a56db] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 w-fit hover:from-[#172554] hover:to-[#1e40af] transition-all duration-300 shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-300 focus:outline-none"
              onClick={() => navigate("/pro")}
            >
              <FaExchangeAlt className="w-5 h-5 text-white" />
              <span className="text-lg">Swap Skills Pro</span>
            </motion.button>
          </div>

          {/* Right Panel (40%) - Feature Tabs */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureTabs.map((tab, idx) => (
                <motion.div
                  key={tab.title}
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={tab.disabled ? {} : "hover"}
                  transition={{ delay: idx * 0.1 }}
                  className={`${tab.bg} rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-all ${
                    tab.disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:border-blue-300"
                  }`}
                  onClick={() => !tab.disabled && navigate(tab.path)}
                >
                  <div className="flex items-center gap-3">
                    {tab.img ? (
                      <img
                        src={tab.img}
                        alt={tab.title}
                        className="w-14 h-14 object-contain"
                      />
                    ) : (
                      <div className="text-blue-600">
                        {tab.icon}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-blue-800">
                        {tab.title}
                      </h3>
                      <p className="text-sm text-blue-600">{tab.subtitle}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Activity Section (Stats) */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-xl p-5 flex items-center gap-5 shadow-sm border border-blue-100"
            >
              <div className="bg-blue-100 p-3 rounded-lg">
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-800">
                  <CountUp end={stat.value} duration={2.5} separator="," />+
                </p>
                <p className="text-sm text-blue-600 mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. Top Performers Section */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <motion.h2
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="text-3xl sm:text-4xl font-bold text-center text-blue-800 mb-10"
        >
          Our Top Performers
        </motion.h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {performers.map((p, idx) => (
            <motion.div
              key={p.title}
              variants={statVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-all border border-blue-100"
            >
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full" />
                <img
                  src={p.img}
                  alt={p.alt}
                  className="relative w-18 h-18 mx-auto rounded-full object-cover mb-4 border-4 border-white"
                />
              </div>
              <p className="text-sm font-semibold text-blue-600">{p.title}</p>
              <p className="font-bold text-lg text-blue-800 mt-1">{p.name}</p>
              {p.stat && <p className="text-sm text-blue-600 mt-2">{p.stat}</p>}
              {p.extra}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. Who Are We Section */}
      <section className="py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 items-center">
          {/* Text Content */}
          <div className="lg:w-3/5">
            <motion.h2
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold text-blue-800 mb-6"
            >
              Who We Are
            </motion.h2>
            <motion.p
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-gray-700 max-w-3xl leading-relaxed"
            >
              We are a community-powered learning revolution. At Swap Skills Pro, 
              we believe true growth happens when knowledge flows both ways. We've built 
              a space where every participant is both student and teacher, where skills 
              are currency, and every exchange creates exponential growth.
            </motion.p>
            <motion.p
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="text-gray-700 max-w-3xl leading-relaxed mt-4"
            >
              Our platform transforms passive learning into active mastery through 
              reciprocal teaching and collaborative growth. Join us to experience 
              learning reimagined.
            </motion.p>
          </div>

          {/* Images */}
          <div className="lg:w-2/5 grid grid-cols-2 gap-4">
            {[
              { img: oneOnOneImg, alt: "Personal mentorship session" },
              { img: groupChatImg, alt: "Group discussion" },
              { img: interviewImg, alt: "Interview practice" },
              { img: groupChatImg, alt: "Learning community" },
            ].map((tab, idx) => (
              <motion.div
                key={idx}
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md"
              >
                <img
                  src={tab.img}
                  alt={tab.alt}
                  className="w-full h-32 object-contain object-center"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Swap Skills Pro Section */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 items-center">
          {/* Images */}
          <div className="lg:w-2/5 grid grid-cols-2 gap-4">
            {[
              { img: interviewImg, alt: "Interview preparation" },
              { img: groupChatImg, alt: "Collaborative learning" },
              { img: oneOnOneImg, alt: "Expert guidance" },
              { img: interviewImg, alt: "Career growth" },
            ].map((tab, idx) => (
              <motion.div
                key={idx}
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md"
              >
                <img
                  src={tab.img}
                  alt={tab.alt}
                  className="w-full h-32 object-contain object-center"
                />
              </motion.div>
            ))}
          </div>

          {/* Text Content */}
          <div className="lg:w-3/5">
            <motion.h2
              variants={textVariants}
              initial="hidden"
              animate="visible"
              className="text-3xl font-bold text-blue-800 mb-6"
            >
              Why Choose Swap Skills Pro
            </motion.h2>
            <motion.p
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-gray-700 max-w-3xl leading-relaxed"
            >
              Swap Skills Pro revolutionizes learning by creating a dynamic ecosystem 
              where knowledge flows both ways. Unlike traditional platforms, we empower 
              every member to be both teacher and student.
            </motion.p>
            <motion.p
              variants={textVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="text-gray-700 max-w-3xl leading-relaxed mt-4"
            >
              Our unique skill-exchange model means you earn credits by sharing your expertise, 
              which you can then use to learn new skills from others. With live sessions, 
              collaborative projects, and real-world practice, we transform passive learning 
              into active mastery.
            </motion.p>
          </div>
        </div>
      </section>

      {/* 6. CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#1e3a8a] to-[#1a56db]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-white mb-6"
          >
            Ready to Transform Your Learning?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-blue-100 max-w-2xl mx-auto mb-8"
          >
            Join thousands of members who are already swapping skills and accelerating their growth
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white text-blue-800 px-8 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors duration-300 shadow-lg focus:ring-2 focus:ring-white"
            onClick={() => navigate("/signup")}
          >
            Get Started Free
          </motion.button>
        </div>
      </section>
    </main>
  );
};

export default Home;
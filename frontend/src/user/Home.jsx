import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBriefcase, FaUserFriends, FaComments, FaChalkboardTeacher, FaUsers, FaRocket } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../auth/Login"; // Correct import path for Login.jsx
import Register from "../auth/Register"; // Correct import path for Register.jsx

// HomeHero component for SkillSwap-Hub, a professional EdTech platform
const HomeHero = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Handle login modal event listener
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setShowLoginModal(true);
      setShowRegisterModal(false);
    };
    window.addEventListener("openLoginModal", handleOpenLoginModal);
    return () => window.removeEventListener("openLoginModal", handleOpenLoginModal);
  }, []);

  // Handle register modal event listener
  useEffect(() => {
    const handleOpenRegisterModal = () => {
      setShowRegisterModal(true);
      setShowLoginModal(false);
    };
    window.addEventListener("openRegisterModal", handleOpenRegisterModal);
    return () => window.removeEventListener("openRegisterModal", handleOpenRegisterModal);
  }, []);

  // Handle OAuth and user persistence
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const user = url.searchParams.get("user");
    if (token && user) {
      localStorage.setItem("token", token);
      try {
        const userObj = JSON.parse(decodeURIComponent(user));
        localStorage.setItem("user", JSON.stringify(userObj));
        setUser(userObj);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
      window.dispatchEvent(new Event("authChanged"));
      url.search = "";
      window.history.replaceState({}, document.title, url.pathname);
    }

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  // Prevent background scroll and hide scrollbar when modal is open
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    let originalHtmlOverflow = html.style.overflow;
    let originalBodyOverflow = body.style.overflow;
    let originalHtmlPaddingRight = html.style.paddingRight;
    let originalBodyPaddingRight = body.style.paddingRight;

    if (showLoginModal || showRegisterModal) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        html.style.paddingRight = `${scrollbarWidth}px`;
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
    } else {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      html.style.paddingRight = originalHtmlPaddingRight;
      body.style.paddingRight = originalBodyPaddingRight;
    }
    return () => {
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      html.style.paddingRight = originalHtmlPaddingRight;
      body.style.paddingRight = originalBodyPaddingRight;
    };
  }, [showLoginModal, showRegisterModal]);

  // Stats data for activity section
  const stats = [
    { icon: <FaChalkboardTeacher className="text-5xl text-blue-800" />, value: 18200, label: "Active Members" },
    { icon: <FaUsers className="text-5xl text-blue-800" />, value: 4500, label: "Experts Available" },
    { icon: <FaComments className="text-5xl text-blue-800" />, value: 50, label: "Session Types" },
  ];

  // Top performers data
  const performers = [
    {
      img: "/user1.png",
      alt: "Most Active",
      title: "Most Active Learner",
      name: "Aditya Singh",
      stat: "15 sessions",
    },
    {
      img: "/user2.png",
      alt: "Top Tutor",
      title: "Highest Rated Tutor",
      name: "Ananya S.",
      extra: <span className="text-yellow-400 text-2xl">★★★★★</span>,
    },
    {
      img: "/user3.png",
      alt: "Top Earner",
      title: "Top Earner",
      name: "Rahul",
      stat: <span className="text-green-600 font-semibold">₹ 8,200 Earned</span>,
    },
  ];

  // Feature tabs for quick access panel
  const featureTabs = [
    {
      title: "Job Interview",
      subtitle: "Real Practice. Real Growth.",
      icon: <FaBriefcase className="text-3xl text-blue-800" />,
      bg: "bg-blue-50",
      path: "/interview",
    },
    {
      title: "1-on-1 Session",
      subtitle: "Personalized Mentorship",
      icon: <FaUserFriends className="text-3xl text-blue-800" />,
      bg: "bg-blue-50",
      path: "/one-on-one",
    },
    {
      title: "Group Discussion",
      subtitle: "Collaborative Growth",
      icon: <FaComments className="text-3xl text-blue-800" />,
      bg: "bg-blue-50",
      path: "/discuss",
    },
  ];

  // Animation variants for text entrance
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 },
    },
  };

  // Animation variants for buttons
  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.3 },
    },
    tap: { scale: 0.95 },
  };

  // Animation variants for tabs
  const tabVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
      borderColor: "#1E3A8A",
      zIndex: 10,
    },
    tap: { scale: 0.98 },
  };

  // Handle login success
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowLoginModal(false);
  };

  // Handle register success
  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    setShowRegisterModal(false);
  };

  return (
    <main className={`bg-gradient-to-b from-blue-50 to-gray-100 text-gray-900 min-h-screen font-[Inter,Poppins,sans-serif] ${showLoginModal || showRegisterModal ? 'overflow-hidden' : 'overflow-auto'} relative pt-16`}>
      {/* Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={() => setShowLoginModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <Login
                onClose={() => setShowLoginModal(false)}
                onLoginSuccess={handleLoginSuccess}
                isModal={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Register Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={() => setShowRegisterModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <Register
                onClose={() => setShowRegisterModal(false)}
                onRegisterSuccess={handleRegisterSuccess}
                isModal={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative z-10 py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-8 bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            className="flex flex-col justify-center space-y-8"
            initial="hidden"
            animate="visible"
            variants={textVariants}
          >
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-blue-900"
              variants={textVariants}
            >
              <span>
                <span className="text-black">Teach</span> What You Know,
              </span>
              <br />
              <span>
                <span className="text-black">Learn</span> What You Don't-
              </span>
              <br />
              <span>
                And <span className="text-black">Earn</span> While You Do!
              </span>
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl text-gray-600 max-w-lg leading-relaxed"
              variants={textVariants}
            >
              SkillSwap-Hub connects professionals for peer-to-peer learning, enabling you to share expertise, acquire new skills, and advance your career.
            </motion.p>
            <motion.div className="flex flex-wrap gap-4" variants={textVariants}>
              <motion.button
                onClick={() => setShowRegisterModal(true)}
                className="bg-blue-900 text-white px-8 py-4 rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Join Now
              </motion.button>
              <motion.button
                onClick={() => navigate("/pro")}
                className="border-2 border-blue-900 text-blue-900 px-8 py-4 rounded-md font-semibold text-lg hover:bg-blue-900 hover:text-white transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Discover Pro
              </motion.button>
            </motion.div>
            {isLoggedIn && (
              <motion.div
                className="mt-6 p-4 bg-white rounded-md shadow-md border border-blue-100 max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={user?.avatar || "/assets/default-avatar.png"}
                    alt="User Avatar"
                    className="w-12 h-12 rounded-full border-2 border-blue-100"
                  />
                  <div>
                    <p className="text-lg font-semibold text-blue-900">
                      Welcome, {user?.name || "Professional"}!
                    </p>
                    <p className="text-sm text-gray-600">Continue your learning journey</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Image Section */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <img
              src="/assets/skillswap-hero.png"
              alt="SkillSwap Hero Image"
              className="w-full h-[400px] object-contain hover:scale-105 transition-transform duration-300"
            />
           
          </motion.div>
        </div>

        {/* Quick Access Panel */}
        <motion.div className="mt-16 max-w-5xl mx-auto" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
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

      {/* Activity Section (Stats) */}
      <section className="bg-blue-50 py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              className="bg-white rounded-md p-6 flex flex-col items-center gap-3 shadow-md border border-blue-100 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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

      {/* Top Performers Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gray-100">
        <h2 className="text-2xl sm:text-4xl font-bold text-center text-blue-900 mb-10">
          Our Top Performers
        </h2>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-center gap-6">
          {performers.map((p, idx) => (
            <motion.div
              key={p.title}
              className="bg-white rounded-md shadow-md p-5 w-full sm:w-72 text-center hover:shadow-xl transition-all duration-300 border border-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2, duration: 0.5 }}
            >
              <img
                src={p.img}
                alt={p.alt}
                className="w-20 h-20 mx-auto rounded-full object-cover mb-3 border-2 border-blue-100"
              />
              <p className="font-semibold text-base text-blue-900">{p.title}</p>
              <p className="font-bold text-lg text-blue-900 mt-2">{p.name}</p>
              {p.stat && <p className="text-sm text-gray-600 mt-2">{p.stat}</p>}
              {p.extra}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Who Are We Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-blue-50">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10">
          <div className="lg:w-3/5">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6">
              Who We Are
            </h2>
            <p className="text-base text-gray-600 max-w-2xl leading-relaxed">
              SkillSwap-Hub is a leading platform for professional learning, connecting experts and learners to foster skill development and career advancement through peer-to-peer exchange.
            </p>
          </div>
          <div className="lg:w-2/5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { img: "/assets/one-on-one.png", alt: "Mentorship", bg: "bg-blue-50" },
                { img: "/assets/group-chat.png", alt: "Discussion", bg: "bg-blue-50" },
                { img: "/assets/interview-icon.png", alt: "Interview", bg: "bg-blue-50" },
                { img: "/assets/one-on-one.png", alt: "Mentorship", bg: "bg-blue-50" },
              ].map((tab, idx) => (
                <motion.div
                  key={tab.alt + idx}
                  className={`${tab.bg} rounded-md p-5 shadow-md border border-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.2, duration: 0.5 }}
                >
                  <img src={tab.img} alt={tab.alt} className="w-12 h-12 object-contain" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose SkillSwap-Hub Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10">
          <div className="lg:w-2/5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { img: "/assets/group-chat.png", alt: "Discussion", bg: "bg-blue-50" },
                { img: "/assets/interview-icon.png", alt: "Interview", bg: "bg-blue-50" },
                { img: "/assets/one-on-one.png", alt: "Mentorship", bg: "bg-blue-50" },
                { img: "/assets/group-chat.png", alt: "Discussion", bg: "bg-blue-50" },
              ].map((tab, idx) => (
                <motion.div
                  key={tab.alt + idx}
                  className={`${tab.bg} rounded-md p-5 shadow-md border border-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.2, duration: 0.5 }}
                >
                  <img src={tab.img} alt={tab.alt} className="w-12 h-12 object-contain" />
                </motion.div>
              ))}
            </div>
          </div>
          <div className="lg:w-3/5">
            <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6">
              Why Choose SkillSwap-Hub
            </h2>
            <p className="text-base text-gray-600 max-w-2xl leading-relaxed">
              SkillSwap-Hub provides a professional environment for skill development. Engage in live sessions, earn credits by teaching, and join a global community of learners and experts.
            </p>
          </div>
        </div>
      </section>

      {/* Let's Start Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-blue-900 mb-6">
            Begin Your Learning Journey
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Join a global community of professionals dedicated to lifelong learning and skill-sharing. Start today and elevate your career.
          </p>
          <motion.button
            onClick={() => setShowRegisterModal(true)}
            className="bg-blue-900 text-white px-8 py-4 rounded-md font-semibold flex items-center gap-2 mx-auto hover:shadow-xl transition-all duration-300"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FaRocket className="w-5 h-5" />
            <span className="text-base">Get Started</span>
          </motion.button>
        </div>
      </section>
    </main>
  );
};

export default HomeHero;

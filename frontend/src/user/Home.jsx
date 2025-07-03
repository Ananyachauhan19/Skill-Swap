import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBriefcase, FaUserFriends, FaComments, FaChalkboardTeacher, FaUsers, FaRocket, FaGlobe, FaLightbulb, FaHandshake } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../auth/Login";
import Register from "../auth/Register";
import { useModal } from "../context/ModalContext";

// HomeHero component: Main landing page for SkillSwap-Hub
const HomeHero = () => {
  const navigate = useNavigate();
  const { showLoginModal, showRegisterModal, openLogin, openRegister, closeModals } = useModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Ref for Explore Opportunities section
  const exploreRef = React.useRef(null);

  // Effect: Handle OAuth and user persistence
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

  // Data: Stats for activity section
  const stats = [
    { icon: <FaChalkboardTeacher className="text-5xl text-blue-800" />, value: 18200, label: "Active Members" },
    { icon: <FaUsers className="text-5xl text-blue-800" />, value: 4500, label: "Experts Available" },
    { icon: <FaComments className="text-5xl text-blue-800" />, value: 50, label: "Session Types" },
  ];

  // Data: Top performers for showcase
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
      extra: <span className="text-yellow-400 text-2xl">★★★★★</span>,
    },
    {
      img: "/user3.webp",
      imgFallback: "/user3.png",
      alt: "Top Earner",
      title: "Top Earner",
      name: "Rahul",
      stat: <span className="text-green-600 font-semibold">₹ 8,200 Earned</span>,
    },
  ];

  // Data: Feature tabs for quick access panel
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

  // Animation: Enhanced variants for text entrance
  const textVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -10 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.3 },
    },
  };

  // Animation: Enhanced variants for buttons
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
    hover: {
      scale: 1.1,
      boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    tap: { scale: 0.9 },
  };

  // Animation: Enhanced variants for tabs
  const tabVariants = {
    hidden: { opacity: 0, y: 50, rotate: 5 },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
    hover: {
      scale: 1.08,
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)",
      borderColor: "#1E3A8A",
      zIndex: 10,
      transition: { duration: 0.3, ease: "easeInOut" },
    },
    tap: { scale: 0.95 },
  };

  // Handler: Login success callback
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    closeModals();
  };

  // Handler: Register success callback
  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    closeModals();
  };

  // Component: Who Are We Section
  const WhoAreWeSection = () => {
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
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-blue-50">
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
                  src="/assets/skillswap-community.png"
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

  // Component: Why Choose SkillSwap-Hub Section
  const WhyChooseSection = () => {
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
      <section className="py-16 sm:py-24 px-4 sm:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          <motion.div
            className="lg:w-1/2 space-y-8"
            initial="hidden"
            animate="visible"
            variants={textVariants}
          ><h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-blue-900 leading-tight whitespace-nowrap">
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
                src="/assets/skillchoose.png"
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

  return (
    <main
      className={`bg-gradient-to-b from-blue-50 to-gray-100 text-gray-900 min-h-screen font-[Inter,Poppins,sans-serif] ${
        showLoginModal || showRegisterModal ? "overflow-hidden" : "overflow-auto"
      } relative pt-16`}
    >
      {/* Section: Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={closeModals}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <Login
                onClose={closeModals}
                onLoginSuccess={handleLoginSuccess}
                isModal={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Section: Register Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={closeModals}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <Register
                onClose={closeModals}
                onRegisterSuccess={handleRegisterSuccess}
                isModal={true}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Section: Hero Section */}
      <section className="relative z-10 py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-8 bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text Content */}
          <motion.div
            className="flex flex-col justify-center space-y-8"
            initial="hidden"
            animate="visible"
            variants={textVariants}
          >
            <motion.h1
              className="text-[38.92px] sm:text-[46.56px] lg:text-[54.2px] font-extrabold leading-tight text-blue-900"
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
              {isLoggedIn ? (
                <motion.button
                  onClick={() => {
                    if (exploreRef.current) {
                      exploreRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="bg-blue-900 text-white px-8 py-4 rounded-md font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  Continue Learning
                </motion.button>
              ) : (
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
          </motion.div>

          {/* Hero Image Section */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <picture>
              <source srcSet="/assets/skillswap-hero.webp" type="image/webp" />
              <img
                src="/assets/skillswap-hero.png"
                alt="SkillSwap Hero Image"
                className="w-full h-[400px] object-contain hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </picture>
            {isLoggedIn && (
              <motion.div
                className="mt-6 p-4 bg-white rounded-md shadow-md border border-blue-100 max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="flex items-center gap-4">
                  <picture>
                    <source srcSet={user?.avatar || "/assets/default-avatar.webp"} type="image/webp" />
                    <img
                      src={user?.avatar || "/assets/default-avatar.png"}
                      alt="User Avatar"
                      className="w-12 h-12 rounded-full border-2 border-blue-100"
                      loading="lazy"
                    />
                  </picture>
                  <div>
                    <p className="text-lg font-semibold text-blue-900">
                      Welcome, {user?.name || "Professional"}! Let's continue with your profile
                    </p>
                    <p className="text-sm text-gray-600">Explore your personalized learning journey</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Section: Explore Opportunities */}
      <section ref={exploreRef} className="py-16 sm:py-20 px-4 sm:px-8 bg-blue-50">
        <motion.div className="max-w-5xl mx-auto" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
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

      {/* Section: Activity Section (Stats) */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gray-100">
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

      {/* Section: Top Performers Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-blue-50">
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

      {/* Section: Who Are We */}
      <WhoAreWeSection />

      {/* Section: Why Choose SkillSwap-Hub */}
      <WhyChooseSection />

      {/* Section: Let's Start */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gradient-to-b from-blue-50 to-gray-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-bold text-blue-900 mb-6">
            Begin Your Learning Journey
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Join a global community of professionals dedicated to lifelong learning and skill-sharing. Start today and elevate your career.
          </p>
          <motion.button
            onClick={() => {
              if (isLoggedIn) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                openRegister();
              }
            }}
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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBriefcase, FaUserFriends, FaComments, FaChalkboardTeacher, FaUsers, FaRocket, FaGlobe, FaLightbulb, FaHandshake } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../auth/Login";
import Register from "../auth/Register";
import { useModal } from "../context/ModalContext";
import HeroSection from "./HomeSection/HeroSection";
import ExploreOpportunitiesSection from "./HomeSection/ExploreOpportunitiesSection";
import ActivityStatsSection from "./HomeSection/ActivityStatsSection";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import WhoAreWeSection from "./HomeSection/WhoAreWeSection";
import WhyChooseSection from "./HomeSection/WhyChooseSection";
import LetsStartSection from "./HomeSection/LetsStartSection";
import Testimonial from "./Testimonial";
import Cookies from 'js-cookie';

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
      try {
        const userObj = JSON.parse(decodeURIComponent(user));
        Cookies.set('user', JSON.stringify(userObj), { expires: 1 });
        Cookies.set('token', token, { expires: 1, path: '/' }); // Force global token cookie
        localStorage.setItem('token', token);
        setUser(userObj);
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
      window.dispatchEvent(new Event("authChanged"));
      url.search = "";
      window.history.replaceState({}, document.title, url.pathname);
    }

    const storedUser = Cookies.get('user');
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
      title: "1-on-1 Session",
      subtitle: "Personalized Mentorship",
      icon: <FaUserFriends className="text-3xl text-blue-800" />,
      bg: "bg-blue-50",
      path: "/one-on-one",
    },
    {
      title: "Live/Recorded Session",
      subtitle: "Explore. Learn, Teach",
      icon: <FaUserFriends className="text-3xl text-blue-800" />,
      bg: "bg-blue-50",
      path: "/session",
    },
    {
      title: "Job Interview",
      subtitle: "Real Practice. Real Growth.",
      icon: <FaBriefcase className="text-3xl text-blue-800" />,
      bg: "bg-blue-50",
      path: "/interview",
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

  return (
    <main
      className={`bg-gradient-to-b from-blue-50 to-gray-100 text-gray-900 min-h-screen font-[Inter,Poppins,sans-serif] ${
        showLoginModal || showRegisterModal ? "overflow-hidden" : "overflow-auto"
      } relative pt-8`}
    >
      {/* Section: Login Modal */}
      <AnimatePresence>
        {showLoginModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/20"
          >
            <Login
              onClose={closeModals}
              onLoginSuccess={handleLoginSuccess}
              isModal={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section: Register Modal */}
      <AnimatePresence>
        {showRegisterModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/20"
          >
            <Register
              onClose={closeModals}
              onRegisterSuccess={handleRegisterSuccess}
              isModal={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section: Hero Section */}
      <HeroSection
        isLoggedIn={isLoggedIn}
        user={user}
        showLoginModal={showLoginModal}
        showRegisterModal={showRegisterModal}
        openRegister={openRegister}
        closeModals={closeModals}
        buttonVariants={buttonVariants}
        textVariants={textVariants}
        navigate={navigate}
        exploreRef={exploreRef}
      />

      {/* Section: Explore Opportunities */}
      <ExploreOpportunitiesSection
        featureTabs={featureTabs}
        tabVariants={tabVariants}
        navigate={navigate}
        exploreRef={exploreRef}
      />

      {/* Section: Activity Section (Stats) */}
      <ActivityStatsSection stats={stats} />

      {/* Section: Top Performers Section */}
      <TopPerformersSection performers={performers} />

      {/* Section: Who Are We */}
      <WhoAreWeSection navigate={navigate} />

      {/* Section: Why Choose SkillSwap-Hub */}
      <WhyChooseSection isLoggedIn={isLoggedIn} openRegister={openRegister} />

      {/* Section: Let's Start */}
      <LetsStartSection isLoggedIn={isLoggedIn} openLogin={openLogin} buttonVariants={buttonVariants} />

      {/* Section: Testimonials */}
      <Testimonial />
    </main>
  );
};

export default HomeHero;
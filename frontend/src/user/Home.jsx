import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBriefcase, FaUserFriends, FaComments, FaChalkboardTeacher, FaUsers, FaRocket, FaGlobe, FaLightbulb, FaHandshake } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Login from "../auth/Login";
import Register from "../auth/Register";
import CompleteProfile from '../user/myprofile/CompleteProfile';
import { useModal } from "../context/ModalContext";
import HeroSection from "./HomeSection/HeroSection";
import ExploreOpportunitiesSection from "./HomeSection/ExploreOpportunitiesSection";
import ActivityStatsSection from "./HomeSection/ActivityStatsSection";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import WhoAreWeSection from "./HomeSection/WhoAreWeSection";
import WhyChooseSection from "./HomeSection/WhyChooseSection";
import LetsStartSection from "./HomeSection/LetsStartSection";
import Testimonial from "./Testimonial";
import Blog from '../user/company/Blog'; 

import Cookies from 'js-cookie';

const HomeHero = () => {
  const navigate = useNavigate();
  const { showLoginModal, showRegisterModal, openLogin, openRegister, closeModals } = useModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  const exploreRef = React.useRef(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const user = url.searchParams.get("user");
    if (token && user) {
      try {
        const userObj = JSON.parse(decodeURIComponent(user));
        Cookies.set('user', JSON.stringify(userObj), { expires: 1 });
        Cookies.set('token', token, { expires: 1, path: '/' });
        setUser(userObj);
        if (
          !userObj?.username ||
          userObj.username.startsWith('user') ||
          !(userObj.skillsToTeach && userObj.skillsToTeach.length)
        ) {
          setShowCompleteProfile(true);
        } else {
          setShowCompleteProfile(false);
        }
        setIsLoggedIn(true);
      } catch (e) {
      }
      window.dispatchEvent(new Event("authChanged"));
      url.search = "";
      window.history.replaceState({}, document.title, url.pathname);
    }

    const storedUser = Cookies.get('user');
    if (storedUser) {
      const userObj = JSON.parse(storedUser);
      setUser(userObj);
      setIsLoggedIn(true);
      if (
        !userObj?.username ||
        userObj.username.startsWith('user') ||
        !(userObj.skillsToTeach && userObj.skillsToTeach.length)
      ) {
        setShowCompleteProfile(true);
      } else {
        setShowCompleteProfile(false);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    closeModals();
    if (
      !userData?.username ||
      userData.username.startsWith('user') ||
      !(userData.skillsToTeach && userData.skillsToTeach.length)
    ) {
      setShowCompleteProfile(true);
    } else {
      setShowCompleteProfile(false);
    }
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    closeModals();
    if (
      !userData?.username ||
      userData.username.startsWith('user') ||
      !(userData.skillsToTeach && userData.skillsToTeach.length)
    ) {
      setShowCompleteProfile(true);
    } else {
      setShowCompleteProfile(false);
    }
  };

  const handleProfileComplete = () => {
    setShowCompleteProfile(false);
  };

  const stats = [
    { icon: <FaChalkboardTeacher className="text-5xl text-blue-800" />, value: 18200, label: "Active Members" },
    { icon: <FaUsers className="text-5xl text-blue-800" />, value: 4500, label: "Experts Available" },
    { icon: <FaComments className="text-5xl text-blue-800" />, value: 50, label: "Session Types" },
  ];

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

  const textVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -10 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.3 },
    },
  };

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

  const contentVariants = {
    visible: { opacity: 1, transition: { duration: 0.3 } },
    faded: { opacity: 0.6, transition: { duration: 0.3 } },
  };

  return (
    <main
      className={`bg-gradient-to-b from-blue-50 to-gray-100 text-gray-900 min-h-screen font-[Inter,Poppins,sans-serif] ${
        showLoginModal || showRegisterModal || showCompleteProfile ? "overflow-hidden" : "overflow-auto"
      } relative pt-8`}
    >
      <AnimatePresence>
        {showCompleteProfile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <CompleteProfile onProfileComplete={handleProfileComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={contentVariants}
        initial="visible"
        animate={showCompleteProfile ? "faded" : "visible"}
      >
        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40"
            >
              <Login
                onClose={closeModals}
                onLoginSuccess={handleLoginSuccess}
                isModal={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRegisterModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40"
            >
              <Register
                onClose={closeModals}
                onRegisterSuccess={handleRegisterSuccess}
                isModal={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

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

        <ExploreOpportunitiesSection
          featureTabs={featureTabs}
          tabVariants={tabVariants}
          navigate={navigate}
          exploreRef={exploreRef}
        />

        <ActivityStatsSection stats={stats} />

        <TopPerformersSection />

        <WhoAreWeSection navigate={navigate} />

        <WhyChooseSection isLoggedIn={isLoggedIn} openRegister={openRegister} />

        <LetsStartSection isLoggedIn={isLoggedIn} openLogin={openLogin} buttonVariants={buttonVariants} />
            
      
           

      </motion.div>
    </main>
  );
};

export default HomeHero;
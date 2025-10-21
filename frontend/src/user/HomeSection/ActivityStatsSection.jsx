import React, { useState, useEffect, memo } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import Login from "../../auth/Login.jsx";
import Register from "../../auth/Register.jsx";
import CompleteProfile from "../myprofile/CompleteProfile.jsx";
import { useModal } from "../../context/ModalContext.jsx";
import { BACKEND_URL } from "../../config.js";

const ActivityStatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const controls = useAnimation();
  const { showLoginModal, showRegisterModal, closeModals } = useModal();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 640);
  const [stats, setStats] = useState([
    { label: "Active Members", value: 0 },
    { label: "Experts Available", value: 0 },
    { label: "Session Types", value: 0 }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById("activity-stats");
      if (section) {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.8) {
          setIsVisible(true);
          controls.start("visible");
        }
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    handleScroll();
    handleResize();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [controls]);

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
        checkProfileCompletion(userObj);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error parsing user data:", error);
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
      checkProfileCompletion(userObj);
    }
  }, []);

  // Fetch activity stats from backend
  useEffect(() => {
    const fetchActivityStats = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/auth/stats/activity`);
        
        if (response.ok) {
          const data = await response.json();
          setStats([
            { label: "Active Members", value: data.activeMembers || 0 },
            { label: "Experts Available", value: data.expertsAvailable || 0 },
            { label: "Session Types", value: data.sessionTypes || 3 }
          ]);
        } else {
          // Fallback: Try to calculate from other endpoints
          await fetchFallbackStats();
        }
      } catch (error) {
        console.error("Error fetching activity stats:", error);
        await fetchFallbackStats();
      } finally {
        setLoading(false);
      }
    };

    const fetchFallbackStats = async () => {
      try {
        let activeMembers = 0;
        let expertsAvailable = 0;
        let sessionTypes = 3; // Default session types

        // Try multiple endpoints to get user count
        const possibleUserEndpoints = [
          `${BACKEND_URL}/api/auth/stats/activity`,
          `${BACKEND_URL}/api/auth/search`,
          `${BACKEND_URL}/api/users/count`,
          `${BACKEND_URL}/api/users`
        ];

        // Try each endpoint until we get user data
        for (const endpoint of possibleUserEndpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              
              // Handle different response formats
              if (data.totalUsers) {
                activeMembers = data.totalUsers;
              } else if (data.count) {
                activeMembers = data.count;
              } else if (Array.isArray(data)) {
                activeMembers = data.length;
              } else if (data.users && Array.isArray(data.users)) {
                activeMembers = data.users.length;
              }

              // Calculate experts (users with skillsToTeach)
              if (data.expertsCount) {
                expertsAvailable = data.expertsCount;
              } else if (Array.isArray(data)) {
                expertsAvailable = data.filter(u => u.skillsToTeach && u.skillsToTeach.length > 0).length;
              } else if (data.users && Array.isArray(data.users)) {
                expertsAvailable = data.users.filter(u => u.skillsToTeach && u.skillsToTeach.length > 0).length;
              } else {
                expertsAvailable = Math.floor(activeMembers * 0.3); // Estimate 30% are experts
              }

              if (activeMembers > 0) break; // Found valid data, exit loop
            }
          } catch (err) {
            console.log(`Failed to fetch from ${endpoint}:`, err.message);
            continue; // Try next endpoint
          }
        }

        // Try to get session types count
        const sessionEndpoints = [
          `${BACKEND_URL}/api/sessions/types`,
          `${BACKEND_URL}/api/sessions/categories`,
          `${BACKEND_URL}/api/sessions`
        ];

        for (const endpoint of sessionEndpoints) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              const data = await response.json();
              if (data.types && Array.isArray(data.types)) {
                sessionTypes = data.types.length;
                break;
              } else if (data.categories && Array.isArray(data.categories)) {
                sessionTypes = data.categories.length;
                break;
              }
            }
          } catch (err) {
            continue;
          }
        }

        console.log('Fetched stats:', { activeMembers, expertsAvailable, sessionTypes });

        setStats([
          { label: "Active Members", value: activeMembers },
          { label: "Experts Available", value: expertsAvailable },
          { label: "Session Types", value: sessionTypes }
        ]);
      } catch (fallbackError) {
        console.error("Error fetching fallback stats:", fallbackError);
        // Set default values if all endpoints fail
        setStats([
          { label: "Active Members", value: 100 },
          { label: "Experts Available", value: 30 },
          { label: "Session Types", value: 3 }
        ]);
      }
    };

    fetchActivityStats();
  }, []);

  const checkProfileCompletion = (userObj) => {
    if (
      !userObj?.username ||
      userObj.username.startsWith('user') ||
      !(userObj.skillsToTeach && userObj.skillsToTeach.length)
    ) {
      setShowCompleteProfile(true);
    } else {
      setShowCompleteProfile(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    closeModals();
    checkProfileCompletion(userData);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    closeModals();
    checkProfileCompletion(userData);
  };

  const handleProfileComplete = () => {
    setShowCompleteProfile(false);
  };

  const getImage = (label) => {
    switch (label.toLowerCase()) {
      case "active members":
        return "/assets/activesession/active.webp";
      case "experts available":
        return "/assets/activesession/expert.webp";
      case "session types":
        return "/assets/activesession/live.webp";
      default:
        return "";
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.6,
      },
    },
  };

  const contentVariants = {
    initial: { y: 0 },
    hover: isMobile ? {} : {
      y: -30,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 25,
        duration: 1.2,
      },
    },
  };

  const imageVariants = {
    initial: { opacity: 1, y: isMobile ? 0 : 50 },
    hover: isMobile ? {} : {
      opacity: 1,
      y: 0,
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 25,
        duration: 1.2,
      },
    },
  };

  return (
    <section
      id="activity-stats"
      className="py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8 bg-blue-200/6"
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

      {loading ? (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="relative rounded-xl p-4 h-[120px] sm:h-[220px] bg-gray-100/80 backdrop-blur-sm border border-white/30 animate-pulse"
              >
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-8 bg-gray-300 rounded mb-2"></div>
                  <div className="w-24 h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-6 lg:gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              className={`relative rounded-xl p-4 h-[120px] sm:h-[220px] overflow-hidden ${
                idx === 0 ? 'bg-purple-100/80' :
                idx === 1 ? 'bg-green-100/80' :
                'bg-orange-100/80'
              } backdrop-blur-sm border border-white/30`}
              style={{ boxShadow: "0 8px 20px -5px rgba(0, 0, 50, 0.1)" }}
              variants={cardVariants}
              initial="hidden"
              animate={isVisible ? "visible" : "hidden"}
              transition={{ delay: idx * 0.3 }}
              whileHover={isMobile ? {} : "hover"}
            >
              <motion.div
                className="relative h-full flex flex-col items-center justify-center"
                initial="initial"
                animate="initial"
                whileHover={isMobile ? {} : "hover"}
              >
                <motion.div
                  className="text-center absolute top-4 sm:top-10"
                  variants={contentVariants}
                >
                  <p className="text-xl sm:text-4xl font-bold text-blue-900">
                    {stat.value.toLocaleString()}+
                  </p>
                  <p className="text-sm sm:text-lg text-blue-900/80 mt-1 sm:mt-2 font-medium capitalize">
                    {stat.label}
                  </p>
                </motion.div>

                {!isMobile && (
                  <motion.div
                    className="absolute bottom-0 w-full overflow-hidden flex justify-center"
                    variants={imageVariants}
                  >
                    <motion.img
                      src={getImage(stat.label)}
                      alt={stat.label}
                      className="w-20 h-20 object-contain"
                      variants={imageVariants}
                    />
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default memo(ActivityStatsSection);
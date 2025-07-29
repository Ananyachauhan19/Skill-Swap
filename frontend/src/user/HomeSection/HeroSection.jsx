import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from '../../config.js';

// Fetch user profile from backend
const fetchUserProfile = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    const userData = await response.json();
    return {
      fullName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.firstName || userData.username || 'User',
      profilePic: userData.profilePic || 'https://placehold.co/100x100?text=User',
    };
  } catch (err) {
    throw new Error("Failed to fetch user profile");
  }
};

// Animation variants
const textVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const buttonVariants = {
  hover: { scale: 1.05, boxShadow: "0px 4px 12px rgba(0, 0, 139, 0.2)" },
  tap: { scale: 0.95 },
};

const HeroSection = ({ isLoggedIn, showLoginModal, showRegisterModal, openRegister, closeModals, exploreRef }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [promptIndex, setPromptIndex] = useState(0);

  // Dynamic educational prompts
  const prompts = [
    "What do you want to teach today?",
    "Explore new skills to learn!",
    "Ready to share your expertise?",
    "Discover courses to boost your career!",
  ];

  // Fetch user profile on mount if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const loadUser = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchUserProfile();
          setUser(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      loadUser();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Cycle through prompts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % prompts.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [prompts.length]);

  return (
    <section className="relative z-10 min-h-screen w-full bg-gradient-to-b from-blue-50 to-gray-100 flex items-center justify-center px-3 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-4 md:gap-6 items-center justify-between h-full py-4 sm:py-0">
        {/* Hero Text Content */}
        <motion.div
          className="flex flex-col justify-center space-y-4 w-full lg:w-1/2"
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          <motion.h1
            className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold leading-tight text-blue-900 text-center lg:text-left"
            variants={textVariants}
          >
            <span><span className="text-black">Teach</span> What You Know,</span><br />
            <span><span className="text-black">Learn</span> What You Don't-</span><br />
            <span>And <span className="text-black">Earn</span> While You Do!</span>
          </motion.h1>
          <motion.p
            className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-full sm:max-w-md leading-relaxed text-center lg:text-left mx-auto lg:mx-0 px-2 sm:px-0"
            variants={textVariants}
          >
            SkillSwap-Hub connects professionals for peer-to-peer learning, enabling you to share expertise, acquire new skills, and advance your career.
          </motion.p>
          <motion.div className="flex flex-wrap gap-2 justify-center lg:justify-start px-2 sm:px-0" variants={textVariants}>
            {isLoggedIn ? (
              <motion.button
                onClick={() => exploreRef?.current?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-blue-900 text-white px-4 py-2 rounded-md font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Continue Learning
              </motion.button>
            ) : (
              <motion.button
                onClick={openRegister}
                className="bg-blue-900 text-white px-4 py-2 rounded-md font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Join Now
              </motion.button>
            )}
            <motion.button
              onClick={() => navigate("/pro")}
              className="border-2 border-blue-900 text-blue-900 px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-900 hover:text-white transition-all duration-300"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Discover Pro
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Hero Image and Profile Section */}
       <div className="flex flex-col w-full lg:w-1/2 items-center lg:items-end justify-start gap-3 mt-6 sm:mt-0 lg:-mt-10">

          <motion.div
            className="relative w-full max-w-full sm:max-w-[520px] md:max-w-[600px] px-3 sm:px-0"
            initial={{ opacity: 0, scale: 0.95, x: 50, y: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <picture>
              <source srcSet="/assets/skillswap-hero.webp" type="image/webp" />
              <img
                src="/assets/skillswap-hero.png"
                alt="SkillSwap Hero Image"
                className="w-full h-[300px] sm:h-[500px] md:h-[600px] lg:h-[700px] object-contain hover:scale-105 transition-transform duration-300 mx-auto"
              />
            </picture>
          </motion.div>

          {isLoggedIn && (
            <div className="w-full max-w-full sm:max-w-[500px] md:max-w-[580px] bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg shadow-xl border border-blue-200 px-4 py-3 -mt-16 sm:-mt-28 lg:-mt-36">

              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-transparent rounded-full animate-spin" />
                ) : error ? (
                  <p className="text-red-300 text-xs">{error}</p>
                ) : (
                  <>
                    <img
                      src={user?.profilePic}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full border border-blue-100"
                    />
                    <p className="text-sm font-medium text-white truncate">
                      Welcome, {user?.fullName || "Professional"}!
                    </p>
                  </>
                )}
              </div>

              <motion.div
                className="mt-1"
                key={promptIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs text-blue-100 font-medium truncate">
                  {prompts[promptIndex]}
                </p>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
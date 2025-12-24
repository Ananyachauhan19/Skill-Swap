import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../config.js";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";

// Fetch user profile from backend
const fetchUserProfile = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
    }
    const userData = await response.json();
    return {
      fullName:
        userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.firstName || userData.username || "Professional",
      profilePic: userData.profilePic || "https://placehold.co/100x100?text=User",
    };
  } catch (err) {
    console.error("Fetch user profile error:", err);
    return {
      fullName: "Professional", // Fallback data
      profilePic: "https://placehold.co/100x100?text=User",
    };
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

const profileVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const HeroSection = ({ exploreRef }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { openLogin, openRegister } = useModal();
  const [userProfile, setUserProfile] = useState(null);
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

  const isLoggedIn = !!authUser;

  // Fetch user profile on mount if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const loadUser = async () => {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchUserProfile();
          setUserProfile(data);
        } catch (err) {
          setError(err.message);
          setUserProfile({ fullName: "Professional", profilePic: "https://placehold.co/100x100?text=User" });
        } finally {
          setLoading(false);
        }
      };
      loadUser();
    } else {
      setLoading(false);
      setUserProfile(null);
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
    <section className="relative z-10 min-h-[85vh] lg:min-h-[90vh] w-full bg-home-bg flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden py-8 lg:py-4">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-6 lg:gap-12 items-center justify-between">
        {/* Hero Text Content */}
        <motion.div
          className="flex flex-col justify-center space-y-5 lg:space-y-6 w-full lg:w-1/2"
          initial="hidden"
          animate="visible"
          variants={textVariants}
        >
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-blue-900 text-center lg:text-left"
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
              <span className="text-black">Earn</span> While You
            </span>
            <br />
            <span>
              <span >Do!</span>
            </span>
          </motion.h1>
          <motion.p
            className="text-xs sm:text-sm lg:text-base text-gray-600 max-w-full sm:max-w-md leading-relaxed text-center lg:text-left mx-auto lg:mx-0 px-2 sm:px-0"
            variants={textVariants}
          >
            SkillSwap-Hub connects professionals for peer-to-peer learning, enabling you to share expertise, acquire new skills, and advance your career.
          </motion.p>
          <motion.div className="flex flex-wrap gap-2 justify-center lg:justify-start px-2 sm:px-0" variants={textVariants}>
            {isLoggedIn ? (
              <motion.button
                onClick={() => navigate('/home#explore')}
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
              onClick={() => (isLoggedIn ? navigate("/pro") : openLogin())}
              className="border-2 border-blue-900 text-blue-900 px-4 py-2 rounded-md font-semibold text-sm hover:bg-blue-900 hover:text-white transition-all duration-300"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              Purchase
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Hero Image and Profile Section */}
        <div className="flex flex-col w-full lg:w-1/2 items-center justify-center gap-3 lg:gap-4 mt-8 lg:mt-0">
          {isLoggedIn && (
            <motion.div
              className="w-full max-w-full sm:max-w-[500px] md:max-w-[580px] bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg shadow-xl border border-blue-200 px-4 py-3 z-20"
              variants={profileVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-blue-200 border-t-transparent rounded-full animate-spin" />
                ) : error ? (
                  <>
                    <img
                      src="https://placehold.co/100x100?text=User"
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full border border-blue-100"
                    />
                    <p className="text-sm font-medium text-white truncate">Welcome, Professional!</p>
                  </>
                ) : userProfile ? (
                  <>
                    <img
                      src={userProfile.profilePic}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full border border-blue-200"
                    />
                    <p className="text-sm font-medium text-white truncate">
                      Welcome, {userProfile.fullName || "Professional"}!
                    </p>
                  </>
                ) : (
                  <>
                    <img
                      src="https://placehold.co/100x100?text=User"
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full border border-blue-100"
                    />
                    <p className="text-sm font-medium text-white truncate">Welcome, Professional!</p>
                  </>
                )}
              </div>
              <motion.div
                className="mt-1"
                key={promptIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xs text-blue-100 font-medium truncate">{prompts[promptIndex]}</p>
              </motion.div>
            </motion.div>
          )}

          <motion.div
            className="relative w-full max-w-[90%] sm:max-w-[480px] lg:max-w-[550px]"
            initial={{ opacity: 0, scale: 0.95, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <picture>
              <source srcSet="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589376/webimages/skillswap-hero.png" type="image/webp" />
              <img
                src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589376/webimages/skillswap-hero.png"
                alt="SkillSwap Hero Image"
                className="w-full h-auto object-contain scale-[1.15] hover:scale-[1.2] transition-transform duration-300"
              />
            </picture>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
import React from "react";
import { motion } from "framer-motion";

const HeroSection = ({
  isLoggedIn,
  user,
  showLoginModal,
  showRegisterModal,
  openRegister,
  closeModals,
  buttonVariants,
  textVariants,
  navigate,
  exploreRef
}) => (
  <section className="relative z-10 py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-8 bg-gradient-to-b from-blue-50 to-gray-100">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      {/* Hero Text Content */}
      <motion.div
        className="flex flex-col justify-center space-y-4"
        initial="hidden"
        animate="visible"
        variants={textVariants}
      >
        <motion.h1
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-snug text-blue-900"
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
          className="text-base sm:text-lg text-gray-600 max-w-md leading-relaxed"
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
            className="w-full h-[450px] object-contain hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </picture>

        {isLoggedIn && (
          <motion.div
            className="mt-6 p-4 bg-white rounded-md shadow-md border border-blue-100 max-w-lg mx-auto"
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
                  className="w-14 h-14 rounded-full border-2 border-blue-100"
                  loading="lazy"
                />
              </picture>
              <div>
                <p className="text-lg font-semibold text-blue-900">
                  Welcome, {user?.name || "Professional"}! Let's continue with your profile
                </p>
                <p className="text-base text-gray-600">Explore your personalized learning journey</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  </section>
);

export default HeroSection;

import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBriefcase, FaUserFriends, FaComments, FaChalkboardTeacher, FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";
import HeroSection from "./HomeSection/HeroSection";
import ExploreOpportunitiesSection from "./HomeSection/ExploreOpportunitiesSection";
import ActivityStatsSection from "./HomeSection/ActivityStatsSection";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import WhoAreWeSection from "./HomeSection/WhoAreWeSection";
import WhyChooseSection from "./HomeSection/WhyChooseSection";
import LetsStartSection from "./HomeSection/LetsStartSection";

const HomeHero = () => {
  const navigate = useNavigate();
  const exploreRef = React.useRef(null);

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
    // {
    //   title: "Group Discussion",
    //   subtitle: "Collaborative Growth",
    //   icon: <FaComments className="text-3xl text-blue-800" />,
    //   bg: "bg-blue-50",
    //   path: "/discuss",
    // },
  ];

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

  return (
    <main className="bg-gradient-to-b from-blue-50 to-gray-100 text-gray-900 min-h-screen font-[Inter,Poppins,sans-serif] pt-8">
      <motion.div initial="visible" animate="visible">
        <HeroSection navigate={navigate} buttonVariants={buttonVariants} exploreRef={exploreRef} />
        <ExploreOpportunitiesSection featureTabs={featureTabs} tabVariants={tabVariants} navigate={navigate} exploreRef={exploreRef} />
        <ActivityStatsSection stats={stats} />
        <TopPerformersSection />
        <WhoAreWeSection navigate={navigate} />
        <WhyChooseSection navigate={navigate} />
        <LetsStartSection navigate={navigate} buttonVariants={buttonVariants} />
      </motion.div>
    </main>
  );
};

export default HomeHero;
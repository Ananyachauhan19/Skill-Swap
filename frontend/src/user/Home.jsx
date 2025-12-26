import React from "react";
import { motion } from "framer-motion";
import HeroSection from "./HomeSection/HeroSection";
import ExploreOpportunitiesSection from "./HomeSection/ExploreOpportunitiesSection";
import ActivityStatsSection from "./HomeSection/ActivityStatsSection";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import WhoAreWeSection from "./HomeSection/WhoAreWeSection";
import WhyChooseSection from "./HomeSection/WhyChooseSection";
import RecruitmentSection from "./HomeSection/RecruitmentSection";
import LetsStartSection from "./HomeSection/LetsStartSection";

const Home = () => {
  return (
    <main className="bg-home-bg text-gray-900 min-h-screen font-[Inter,Poppins,sans-serif] pt-16 md:pt-[72px] xl:pt-20">
      <motion.div initial="visible" animate="visible">
        <HeroSection />
        <ExploreOpportunitiesSection />
        <ActivityStatsSection />
        <TopPerformersSection />
        <WhyChooseSection />
        <WhoAreWeSection />
        <RecruitmentSection />
        <LetsStartSection />
      </motion.div>
    </main>
  );
};

export default Home;
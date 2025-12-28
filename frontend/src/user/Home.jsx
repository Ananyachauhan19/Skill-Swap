import React from "react";
import HeroSection from "./HomeSection/HeroSection";
import ExploreOpportunitiesSection from "./HomeSection/ExploreOpportunitiesSection";
import ActivityStatsSection from "./HomeSection/ActivityStatsSection";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import WhoAreWeSection from "./HomeSection/WhoAreWeSection";
import CampusDashboardSection from "./HomeSection/CampusDashboardSection";
import UserTestimonials from "./HomeSection/UserTestimonials";
import RecruitmentSection from "./HomeSection/RecruitmentSection";
import LetsStartSection from "./HomeSection/LetsStartSection";

const Home = () => {
  return (
    <main className="bg-home-bg text-gray-900 min-h-screen font-[Inter,Poppins,sans-serif] pt-16 md:pt-[72px] xl:pt-20">
      <div>
        <HeroSection />
        <WhoAreWeSection />
        <CampusDashboardSection
          totalCampusCollaborations={0}
          totalStudentsOnDashboard={0}
          imageSrc="/images/campus-dashboard.png"
        />
        <ExploreOpportunitiesSection />
        <ActivityStatsSection />
        <TopPerformersSection />
        <UserTestimonials />
        
        <RecruitmentSection />
        <LetsStartSection />
      </div>
    </main>
  );
};

export default Home;
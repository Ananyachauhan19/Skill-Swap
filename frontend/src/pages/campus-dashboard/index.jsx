import React from 'react';
import HeroSection from './sections/HeroSection';
import GlobalTopPerformersSection from './sections/GlobalTopPerformersSection';

const CampusDashboardPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Same as the one shown on home page */}
      <HeroSection />

      {/* Global Top Performers Section - Enhanced with Colleges and Schools separation */}
      <GlobalTopPerformersSection />
    </div>
  );
};

export default CampusDashboardPage;

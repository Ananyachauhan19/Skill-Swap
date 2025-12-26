/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { BACKEND_URL } from "../config.js";
import StatsSection from "./interviewSection/StatsSection";
import PastInterviewsPreview from "./interviewSection/PastInterviewsPreview";
import TopInterviewPerformance from "./interviewSection/TopInterviewPerformance";
import FAQSection from "./interviewSection/FAQ";
import HowItWorks from "./interviewSection/HowItWorks";
import BrowseInterviewersSection from "./interviewSection/BrowseInterviewersSection";
import BookInterviewModal from "./interviewSection/BookInterviewModal";
import RegisterInterviewerModal from "./interviewSection/RegisterInterviewerModal";
import ScheduledInterviewSection from "./interviewSection/ScheduledInterviewSection";

const Interview = () => {
  // Modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [preSelectedInterviewer, setPreSelectedInterviewer] = useState(null);
  const [preFilledData, setPreFilledData] = useState(null);
  const { user } = useAuth() || {};
  const [interviewerStatus, setInterviewerStatus] = useState(null);

  const handleBookSession = (data) => {
    setPreSelectedInterviewer(data.interviewer);
    setPreFilledData(null);
    setShowBookModal(true);
  };

  // 3D tilt effect on mouse move
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load current user's interviewer application status
  useEffect(() => {
    const loadStatus = async () => {
      if (!user) {
        setInterviewerStatus(null);
        return;
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/application`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) {
          setInterviewerStatus(null);
          return;
        }
        const app = await res.json();
        if (!app) {
          setInterviewerStatus(null);
          return;
        }
        setInterviewerStatus(app.status || null);
      } catch (e) {
        console.error('Failed to load interviewer application status', e);
        setInterviewerStatus(null);
      }
    };

    loadStatus();
  }, [user && user._id]);

  return (
    <div className="min-h-screen w-full bg-home-bg">
      {/* Hero Section */}
      <section className="relative w-full flex items-center justify-center overflow-hidden pt-16 md:pt-[72px] lg:pt-20 pb-6 md:pb-8 lg:pb-10 bg-gradient-to-b from-slate-50 to-white xl:min-h-[70vh]">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 lg:px-4 lg:py-2 bg-blue-900/10 text-blue-900 rounded-full text-[9px] sm:text-[10px] lg:text-xs font-semibold tracking-wide">
                  Mock Interview Platform
                </span>
              </div>
              
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-slate-900 leading-tight tracking-tight px-1 sm:px-2 lg:px-0">
                Master Your Interviews with
                <span className="block text-blue-900 mt-1 sm:mt-1.5 lg:mt-2">
                  Experts
                </span>
              </h1>
              
              <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-slate-500 max-w-2xl mx-auto lg:mx-0 px-2 sm:px-4 lg:px-0 leading-relaxed">
                Practice with experts, get real feedback, and land your dream job with confidence.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-3 lg:gap-4 pt-2 sm:pt-3 lg:pt-4 px-2 sm:px-4 lg:px-0">
                <button
                  onClick={() => setShowBookModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-blue-900 text-white rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm lg:text-base hover:bg-blue-800 transition-all hover:shadow-xl"
                >
                  Book Mock Interview
                </button>
                {(() => {
                  const isApprovedRole =
                    user && (user.role === 'interviewer' || user.role === 'both' || (Array.isArray(user.roles) && user.roles.includes('interviewer')));
                  const isPending = interviewerStatus === 'pending';
                  const isApprovedApp = interviewerStatus === 'approved';
                  const disabled = isPending || isApprovedApp || isApprovedRole;
                  const label = disabled
                    ? (isPending ? 'Interviewer application pending' : 'You are an interviewer')
                    : 'Become Interviewer';

                  return (
                    <button
                      onClick={() => {
                        if (disabled) return;
                        setShowRegisterModal(true);
                      }}
                      disabled={disabled}
                      className={`w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 border-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm lg:text-base transition-all ${
                        disabled
                          ? 'bg-white text-slate-500 border-slate-300 cursor-default'
                          : 'bg-white text-blue-900 border-blue-900 hover:bg-blue-50'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })()}
              </div>

              {/* Stats Section Inline */}
              <div className="pt-4 sm:pt-6">
                <StatsSection />
              </div>
            </div>

            {/* Right Illustration */}
            <div className="flex-1 relative w-full">
              <div className="relative w-full max-w-[300px] sm:max-w-[350px] lg:max-w-[450px] mx-auto scale-90 sm:scale-100 lg:scale-[1.25]">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-blue-900/5 rounded-3xl blur-2xl"></div>
                <img
                  src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589371/webimages/interview-illustration.png"
                  alt="Mock Interview"
                  className="relative w-full h-auto object-contain drop-shadow-2xl"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400">
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12 px-2 sm:px-3 lg:px-6 xl:px-8 py-4 sm:py-6 md:py-8 lg:py-10 xl:py-12">
        <ScheduledInterviewSection />
        
        <BrowseInterviewersSection onBookSession={handleBookSession} />
        
        <PastInterviewsPreview />
        
        <TopInterviewPerformance />
        
        <HowItWorks />
        
        <FAQSection />
      </main>

      {/* Modals */}
      <BookInterviewModal 
        isOpen={showBookModal} 
        onClose={() => {
          setShowBookModal(false);
          setPreSelectedInterviewer(null);
          setPreFilledData(null);
        }} 
        preSelectedInterviewer={preSelectedInterviewer}
        preFilledData={preFilledData}
      />
      <RegisterInterviewerModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
    </div>
  );
};

export default Interview;

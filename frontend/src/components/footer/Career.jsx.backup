import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BACKEND_URL } from "../../config";
import { 
  FiUsers, FiTrendingUp, FiAward, FiHeart, 
  FiTarget, FiZap, FiGlobe, FiCode, FiBriefcase,
  FiBook, FiTrendingDown, FiUserPlus, FiUserCheck, FiClipboard
} from "react-icons/fi";
import RecruitmentApplication from "../../user/RecruitmentApplication";

const Career = () => {
  const navigate = useNavigate();
  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    isTutor: false,
    isInterviewer: false,
    isTutorVerifier: false,
    tutorPending: false,
    interviewerPending: false,
    verifierPending: false
  });

  const { user } = useAuth();

  // Check URL parameter to auto-open application form
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const applyParam = urlParams.get('apply');
    if (applyParam === 'verifier') {
      setShowRecruitmentForm(true);
      // Clean up URL without reloading
      window.history.replaceState({}, '', '/career');
    }
  }, []);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) {
        setVerificationStatus({
          isTutor: false,
          isInterviewer: false,
          isTutorVerifier: false
        });
        return;
      }

      try {
        // Check tutor status and pending
        const isTutor = user?.isTutor === true;
        let tutorPending = false;
        
        if (!isTutor) {
          try {
            const tutorStatusResponse = await fetch(`${BACKEND_URL}/api/tutor/status`, {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (tutorStatusResponse.ok) {
              const tutorData = await tutorStatusResponse.json();
              tutorPending = tutorData?.application?.status === 'pending';
            }
          } catch (err) {
            console.error('Error checking tutor status:', err);
          }
        }

        // Check if user is an interviewer and pending
        let isInterviewer = false;
        let interviewerPending = false;
        
        try {
          const interviewerResponse = await fetch(`${BACKEND_URL}/api/interview/check-interviewer`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (interviewerResponse.ok) {
            const interviewerData = await interviewerResponse.json();
            isInterviewer = interviewerData?.isApprovedInterviewer === true || 
                           interviewerData?.isInterviewer === true ||
                           interviewerData?.approved === true;
          }
          
          if (!isInterviewer) {
            const applicationResponse = await fetch(`${BACKEND_URL}/api/interview/application`, {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (applicationResponse.ok) {
              const appData = await applicationResponse.json();
              interviewerPending = appData?.status === 'pending';
            }
          }
        } catch (err) {
          console.error('Error checking interviewer status:', err);
        }

        // Check if user is a tutor verifier (employee) and pending
        let isTutorVerifier = false;
        let verifierPending = false;
        
        try {
          const verifierResponse = await fetch(`${BACKEND_URL}/api/employee/check-verifier`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (verifierResponse.ok) {
            const verifierData = await verifierResponse.json();
            isTutorVerifier = verifierData?.isTutorVerifier === true ||
                             verifierData?.isEmployee === true ||
                             verifierData?.hasAccess === true ||
                             verifierData?.canVerifyTutors === true;
          }
          
          if (!isTutorVerifier) {
            const recruitmentResponse = await fetch(`${BACKEND_URL}/api/recruitment/my-applications`, {
              method: 'GET',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (recruitmentResponse.ok) {
              const recruitmentData = await recruitmentResponse.json();
              verifierPending = Array.isArray(recruitmentData) && 
                               recruitmentData.some(app => app.status === 'pending');
            }
          }
        } catch (err) {
          console.error('Error checking verifier status:', err);
        }

        console.log('Final verification status:', { isTutor, isInterviewer, isTutorVerifier, tutorPending, interviewerPending, verifierPending });
        
        setVerificationStatus({
          isTutor,
          isInterviewer,
          isTutorVerifier,
          tutorPending,
          interviewerPending,
          verifierPending
        });
      } catch (error) {
        console.error('Error in checkVerificationStatus:', error);
      }
    };

    checkVerificationStatus();
  }, [user]);

  const handleShowRecruitmentForm = () => {
    setShowRecruitmentForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const benefits = [
    { icon: <FiTrendingUp />, title: "Competitive Salaries", desc: "Performance bonuses & ESOPs for early team members" },
    { icon: <FiZap />, title: "Flexible Work", desc: "Remote-friendly with result-based performance" },
    { icon: <FiAward />, title: "Learning Allowance", desc: "Free premium features & upskilling support" },
    { icon: <FiGlobe />, title: "Global Impact", desc: "Shape the future of education worldwide" },
  ];

  const departments = [
    {
      icon: <FiCode className="text-3xl" />,
      title: "Technology & Product",
      roles: ["Software Developers (Frontend, Backend, Full Stack)", "AI/ML Engineers", "Data Engineers", "UI/UX Designers", "Product Managers"],
      color: "from-blue-800 to-blue-900"
    },
    {
      icon: <FiBriefcase className="text-3xl" />,
      title: "Business & Strategy",
      roles: ["Business Development Managers", "Strategic Partnerships", "Operations & Growth Managers", "Market Research Analysts"],
      color: "from-blue-700 to-blue-800"
    },
    {
      icon: <FiBook className="text-3xl" />,
      title: "Content & Education",
      roles: ["Academic Content Creators", "Video Tutors & Mentors", "Community Managers", "Instructional Designers"],
      color: "from-blue-600 to-blue-700"
    },
    {
      icon: <FiTrendingUp className="text-3xl" />,
      title: "Marketing & Creative",
      roles: ["Digital Marketing Specialists", "Brand Managers", "Video Editors", "Copywriters & Content Writers"],
      color: "from-blue-500 to-blue-600"
    },
  ];

  const values = [
    { icon: <FiZap />, title: "Innovation First", desc: "We constantly challenge the norm" },
    { icon: <FiUsers />, title: "Collaboration Over Competition", desc: "We grow by supporting one another" },
    { icon: <FiBook />, title: "Learning Culture", desc: "Every day is a new opportunity to grow" },
    { icon: <FiHeart />, title: "Impact-Driven Work", desc: "We measure success by the difference we create" },
  ];

  if (showRecruitmentForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20">
        <div className="pt-16 md:pt-[72px] xl:pt-20 px-3 sm:px-4">
          <div className="max-w-5xl mx-auto pb-3 sm:pb-4">
            <button
              onClick={() => setShowRecruitmentForm(false)}
              className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg"
            >
              ← Back to Careers
            </button>
          </div>
        </div>
        <RecruitmentApplication />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20">
      {/* Hero Section */}
      <section className="relative pt-16 md:pt-[72px] xl:pt-20 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-blue-800/5 to-blue-700/5" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-4 sm:mb-6"
            >
              <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                We're Hiring! Join Our Mission
              </div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-blue-900 to-blue-900 bg-clip-text text-transparent px-2">
              Build the Future of Learning
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-3 sm:px-4">
              Join SkillSwap Hub and be part of a revolutionary peer-to-peer learning ecosystem where 
              <span className="font-semibold text-blue-900"> you teach, learn, and earn</span> – all at once!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
              <motion.button
                onClick={() => !verificationStatus.isTutorVerifier && !verificationStatus.verifierPending && setShowRecruitmentForm(true)}
                whileHover={!verificationStatus.isTutorVerifier && !verificationStatus.verifierPending ? { scale: 1.05 } : {}}
                whileTap={!verificationStatus.isTutorVerifier && !verificationStatus.verifierPending ? { scale: 0.95 } : {}}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                  verificationStatus.isTutorVerifier
                    ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white cursor-default shadow-[0_8px_20px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                    : verificationStatus.verifierPending
                    ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white cursor-default shadow-[0_8px_20px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                    : 'bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-950 hover:to-black text-white shadow-[0_8px_20px_rgba(30,64,175,0.3),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.5),inset_0_1px_2px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(0,0,0,0.4)]'
                }`}
              >
                <FiUserPlus className="text-base sm:text-lg md:text-xl" />
                <span className="hidden lg:inline">
                  {verificationStatus.isTutorVerifier ? 'Verified Verifier' : verificationStatus.verifierPending ? 'Verifier Application Pending' : 'Tutor Verifier'}
                </span>
                <span className="lg:hidden">
                  {verificationStatus.isTutorVerifier ? 'Verified' : verificationStatus.verifierPending ? 'Verifier Pending' : 'Verifier'}
                </span>
                {verificationStatus.isTutorVerifier && <FiUserCheck className="text-base sm:text-lg" />}
                {verificationStatus.verifierPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </motion.button>
              <motion.button
                onClick={() => !verificationStatus.isTutor && !verificationStatus.tutorPending && navigate('/tutor/apply')}
                whileHover={!verificationStatus.isTutor && !verificationStatus.tutorPending ? { scale: 1.05 } : {}}
                whileTap={!verificationStatus.isTutor && !verificationStatus.tutorPending ? { scale: 0.95 } : {}}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                  verificationStatus.isTutor
                    ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white cursor-default shadow-[0_8px_20px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                    : verificationStatus.tutorPending
                    ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white cursor-default shadow-[0_8px_20px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                    : 'bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-950 hover:to-black text-white shadow-[0_8px_20px_rgba(30,64,175,0.3),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.5),inset_0_1px_2px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(0,0,0,0.4)]'
                }`}
              >
                <FiUserCheck className="text-base sm:text-lg md:text-xl" />
                <span className="hidden lg:inline">
                  {verificationStatus.isTutor ? 'Verified Tutor' : verificationStatus.tutorPending ? 'Tutor Application Pending' : 'Apply as Tutor'}
                </span>
                <span className="lg:hidden">
                  {verificationStatus.isTutor ? 'Verified' : verificationStatus.tutorPending ? 'Tutor Pending' : 'Tutor'}
                </span>
                {verificationStatus.isTutor && <FiUserCheck className="text-base sm:text-lg" />}
                {verificationStatus.tutorPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </motion.button>
              <motion.button
                onClick={() => !verificationStatus.isInterviewer && !verificationStatus.interviewerPending && navigate('/register-interviewer')}
                whileHover={!verificationStatus.isInterviewer && !verificationStatus.interviewerPending ? { scale: 1.05 } : {}}
                whileTap={!verificationStatus.isInterviewer && !verificationStatus.interviewerPending ? { scale: 0.95 } : {}}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base transition-all duration-300 ${
                  verificationStatus.isInterviewer
                    ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white cursor-default shadow-[0_8px_20px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                    : verificationStatus.interviewerPending
                    ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white cursor-default shadow-[0_8px_20px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                    : 'bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-950 hover:to-black text-white shadow-[0_8px_20px_rgba(30,64,175,0.3),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.5),inset_0_1px_2px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(0,0,0,0.4)]'
                }`}
              >
                <FiClipboard className="text-base sm:text-lg md:text-xl" />
                <span className="hidden lg:inline">
                  {verificationStatus.isInterviewer ? 'Verified Interviewer' : verificationStatus.interviewerPending ? 'Interviewer Application Pending' : 'Apply as Interviewer'}
                </span>
                <span className="lg:hidden">
                  {verificationStatus.isInterviewer ? 'Verified' : verificationStatus.interviewerPending ? 'Interviewer Pending' : 'Interviewer'}
                </span>
                {verificationStatus.isInterviewer && <FiUserCheck className="text-base sm:text-lg" />}
                {verificationStatus.interviewerPending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Mission Statement */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">Our Mission</h2>
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-200 shadow-lg">
              <p className="text-sm sm:text-base md:text-lg text-gray-800 leading-relaxed mb-3 sm:mb-4">
                At SkillSwap Hub, we're democratizing education and empowering individuals to both 
                <span className="font-semibold text-blue-900"> share knowledge and acquire new skills</span>. 
                We're building a community where learning, teaching, and earning go hand-in-hand.
              </p>
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded-full shadow">
                  <FiTarget className="text-blue-900 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-900">Democratize Education</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded-full shadow">
                  <FiUsers className="text-blue-900 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-900">Empower Individuals</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 md:px-4 rounded-full shadow">
                  <FiGlobe className="text-blue-900 text-sm sm:text-base" />
                  <span className="text-xs sm:text-sm font-semibold text-blue-900">Build Community</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Internship Opportunities - We're Hiring */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-800 to-blue-900 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full mb-4 sm:mb-6 shadow-lg">
              <FiBriefcase className="text-lg sm:text-xl" />
              <span className="font-bold text-sm sm:text-base md:text-lg">We're Hiring</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Internship Opportunities</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto px-3 mb-2">
              Join our dynamic team and gain hands-on experience in a fast-growing edtech startup
            </p>
            <a href="mailto:info@skillswaphub.in" className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-800 font-semibold text-sm sm:text-base transition-colors">
              <span>Contact: info@skillswaphub.in</span>
            </a>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Marketing Positions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-100 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-3 sm:p-4 rounded-xl shadow-lg">
                  <FiTrendingUp className="text-2xl sm:text-3xl" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Marketing</h3>
                  <p className="text-sm text-gray-600">Multiple Openings</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Digital Marketing */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Digital Marketing</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Strong understanding of SEO, SEM, and social media marketing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Experience with Google Analytics and marketing tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Creative mindset with data-driven approach</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Excellent written and verbal communication skills</span>
                    </li>
                  </ul>
                </div>

                {/* Content Creation */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Content Creation</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Strong writing and storytelling abilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Experience with content management systems</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Understanding of content marketing and SEO principles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Ability to create engaging educational content</span>
                    </li>
                  </ul>
                </div>

                {/* Brand Management */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Brand Management</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Understanding of brand positioning and strategy</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Experience in social media management</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Creative thinking and attention to detail</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span>Ability to analyze market trends and competitor activities</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Tech Positions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-blue-100 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-3 sm:p-4 rounded-xl shadow-lg">
                  <FiCode className="text-2xl sm:text-3xl" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Technology</h3>
                  <p className="text-sm text-gray-600">Multiple Openings</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Full Stack Development */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Full Stack Development</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Proficiency in React.js, Node.js, and MongoDB</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Experience with RESTful APIs and version control (Git)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Understanding of responsive design and web performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Problem-solving skills and passion for clean code</span>
                    </li>
                  </ul>
                </div>

                {/* Frontend Development */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Frontend Development</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Strong knowledge of HTML, CSS, JavaScript, and React</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Experience with Tailwind CSS and modern UI frameworks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Eye for design and user experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Familiarity with state management and animations</span>
                    </li>
                  </ul>
                </div>

                {/* UI/UX Design */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">UI/UX Design</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Proficiency in Figma, Adobe XD, or similar design tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Strong portfolio demonstrating design skills</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Understanding of user-centered design principles</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Ability to create wireframes, prototypes, and mockups</span>
                    </li>
                  </ul>
                </div>

                {/* Mobile App Development */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Mobile App Development</h4>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Experience with React Native or Flutter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Understanding of mobile app design guidelines (iOS/Android)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Knowledge of mobile app optimization and performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Passion for creating seamless mobile experiences</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8 sm:mt-12 text-center bg-gradient-to-r from-blue-800 to-blue-900 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl"
          >
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 sm:mb-4">Ready to Make an Impact?</h3>
            <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6 max-w-2xl mx-auto">
              Be part of a team that's revolutionizing education and empowering millions of learners worldwide
            </p>
            <a 
              href="mailto:info@skillswaphub.in?subject=Internship Application - [Your Position]"
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-6 py-3 sm:px-8 sm:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <FiBriefcase className="text-lg sm:text-xl" />
              <span>Apply Now</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Why Join Us?</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3">
              Every task you do contributes directly to changing how the world learns
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="text-3xl sm:text-4xl text-blue-900 mb-3 sm:mb-4">{benefit.icon}</div>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Open Positions</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3">
              We're hiring across multiple functions. Find your perfect role!
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {departments.map((dept, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-gray-50 to-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r ${dept.color} text-white mb-3 sm:mb-4 shadow-lg text-xl sm:text-2xl`}>
                  {dept.icon}
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">{dept.title}</h3>
                <ul className="space-y-1.5 sm:space-y-2">
                  {dept.roles.map((role, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 sm:gap-2 text-gray-700">
                      <span className="text-blue-900 mt-0.5 text-sm sm:text-base">•</span>
                      <span className="text-xs sm:text-sm">{role}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Internships Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-blue-200 shadow-lg"
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl">
                <FiUserPlus className="text-xl sm:text-2xl md:text-3xl" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Internships & Campus Ambassadors</h3>
                <p className="text-xs sm:text-sm text-gray-600">Perfect for students seeking real-world startup experience</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Interns</p>
                <p className="text-xs sm:text-sm text-gray-600">Tech, Marketing, Operations, Design, Research</p>
              </div>
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Student Ambassadors</p>
                <p className="text-xs sm:text-sm text-gray-600">Represent SkillSwap Hub at your college/university</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">Our Core Values</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3">
              The principles that guide everything we do
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-center shadow-lg border border-gray-200 hover:border-blue-900 hover:shadow-xl transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-blue-100 text-blue-900 text-xl sm:text-2xl mb-3 sm:mb-4">
                  {value.icon}
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">{value.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Life at SkillSwap Hub */}
      <section className="py-10 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 lg:px-8 bg-gradient-to-br from-blue-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">Life at SkillSwap Hub</h2>
            <p className="text-sm sm:text-base md:text-lg text-blue-100 max-w-2xl mx-auto px-3">
              More than just a workplace – it's where innovation meets passion
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {[
              "Brainstorm breakthrough ideas with passionate people",
              "Celebrate wins & learn from challenges together",
              "Friday fun sessions & team-building activities",
              "Fast-tracked career growth in a high-energy environment"
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-5 md:p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 md:mb-4">
                  {index === 0 ? "💡" : index === 1 ? "🎉" : index === 2 ? "🎮" : "🚀"}
                </div>
                <p className="text-xs sm:text-sm">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-gray-100">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 px-2">
            Ready to Make an Impact?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-6 sm:mb-7 md:mb-8 leading-relaxed px-3">
            At SkillSwap Hub, you don't just build a career — you build the future of learning. 
            If you're ready to be part of a global movement that empowers millions, we want to hear from you!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto px-2">
            <motion.button
              onClick={() => !verificationStatus.isTutorVerifier && !verificationStatus.verifierPending && setShowRecruitmentForm(true)}
              whileHover={!verificationStatus.isTutorVerifier && !verificationStatus.verifierPending ? { scale: 1.05 } : {}}
              whileTap={!verificationStatus.isTutorVerifier && !verificationStatus.verifierPending ? { scale: 0.95 } : {}}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 ${
                verificationStatus.isTutorVerifier
                  ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white cursor-default shadow-[0_8px_20px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                  : verificationStatus.verifierPending
                  ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white cursor-default shadow-[0_8px_20px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                  : 'bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-950 hover:to-black text-white shadow-[0_8px_20px_rgba(30,64,175,0.3),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.5),inset_0_1px_2px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(0,0,0,0.4)]'
              }`}
            >
              <FiUserPlus className="text-base sm:text-lg md:text-xl" />
              <span className="hidden lg:inline">
                {verificationStatus.isTutorVerifier ? 'Verified Verifier' : verificationStatus.verifierPending ? 'Verifier Application Pending' : 'Tutor Verifier'}
              </span>
              <span className="lg:hidden">
                {verificationStatus.isTutorVerifier ? 'Verified' : verificationStatus.verifierPending ? 'Verifier Pending' : 'Verifier'}
              </span>
              {verificationStatus.isTutorVerifier && <FiUserCheck className="text-base sm:text-lg" />}
              {verificationStatus.verifierPending && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </motion.button>
            <motion.button
              onClick={() => !verificationStatus.isTutor && !verificationStatus.tutorPending && navigate('/tutor/apply')}
              whileHover={!verificationStatus.isTutor && !verificationStatus.tutorPending ? { scale: 1.05 } : {}}
              whileTap={!verificationStatus.isTutor && !verificationStatus.tutorPending ? { scale: 0.95 } : {}}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 ${
                verificationStatus.isTutor
                  ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white cursor-default shadow-[0_8px_20px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                  : verificationStatus.tutorPending
                  ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white cursor-default shadow-[0_8px_20px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                  : 'bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-950 hover:to-black text-white shadow-[0_8px_20px_rgba(30,64,175,0.3),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.5),inset_0_1px_2px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(0,0,0,0.4)]'
              }`}
            >
              <FiUserCheck className="text-base sm:text-lg md:text-xl" />
              <span className="hidden lg:inline">
                {verificationStatus.isTutor ? 'Verified Tutor' : verificationStatus.tutorPending ? 'Tutor Application Pending' : 'Apply as Tutor'}
              </span>
              <span className="lg:hidden">
                {verificationStatus.isTutor ? 'Verified' : verificationStatus.tutorPending ? 'Tutor Pending' : 'Tutor'}
              </span>
              {verificationStatus.isTutor && <FiUserCheck className="text-base sm:text-lg" />}
              {verificationStatus.tutorPending && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </motion.button>
            <motion.button
              onClick={() => !verificationStatus.isInterviewer && !verificationStatus.interviewerPending && navigate('/register-interviewer')}
              whileHover={!verificationStatus.isInterviewer && !verificationStatus.interviewerPending ? { scale: 1.05 } : {}}
              whileTap={!verificationStatus.isInterviewer && !verificationStatus.interviewerPending ? { scale: 0.95 } : {}}
              className={`inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 ${
                verificationStatus.isInterviewer
                  ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white cursor-default shadow-[0_8px_20px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                  : verificationStatus.interviewerPending
                  ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white cursor-default shadow-[0_8px_20px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)]'
                  : 'bg-gradient-to-br from-blue-800 via-blue-900 to-blue-950 hover:from-blue-900 hover:via-blue-950 hover:to-black text-white shadow-[0_8px_20px_rgba(30,64,175,0.3),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_6px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.5),inset_0_1px_2px_rgba(255,255,255,0.25),inset_0_-2px_6px_rgba(0,0,0,0.4)]'
              }`}
            >
              <FiClipboard className="text-base sm:text-lg md:text-xl" />
              <span className="hidden lg:inline">
                {verificationStatus.isInterviewer ? 'Verified Interviewer' : verificationStatus.interviewerPending ? 'Interviewer Application Pending' : 'Apply as Interviewer'}
              </span>
              <span className="lg:hidden">
                {verificationStatus.isInterviewer ? 'Verified' : verificationStatus.interviewerPending ? 'Interviewer Pending' : 'Interviewer'}
              </span>
              {verificationStatus.isInterviewer && <FiUserCheck className="text-base sm:text-lg" />}
              {verificationStatus.interviewerPending && (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </motion.button>
          </div>
          <p className="mt-6 sm:mt-7 md:mt-8 text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-900 to-blue-900 bg-clip-text text-transparent px-2">
            Teach what you know, Learn what you don't – Earn while you do! 🌍
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Career;

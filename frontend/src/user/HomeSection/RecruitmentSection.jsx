import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUserCheck, FiUserPlus, FiClipboard, FiArrowRight, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../config';

const RecruitmentSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState({
    isTutor: false,
    isInterviewer: false,
    isTutorVerifier: false,
    tutorPending: false,
    interviewerPending: false,
    verifierPending: false
  });

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
            console.error('RecruitmentSection - Error checking tutor status:', err);
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
          console.error('RecruitmentSection - Error checking interviewer status:', err);
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
          console.error('RecruitmentSection - Error checking verifier status:', err);
        }
        
        setVerificationStatus({
          isTutor,
          isInterviewer,
          isTutorVerifier,
          tutorPending,
          interviewerPending,
          verifierPending
        });
      } catch (error) {
        console.error('RecruitmentSection - Error in checkVerificationStatus:', error);
      }
    };

    checkVerificationStatus();
  }, [user]);

  const handleRoleClick = (path) => {
    if (!user) {
      navigate('/login', { state: { from: path } });
      return;
    }
    navigate(path);
  };

  const roles = [
    {
      title: 'Apply as Tutor',
      description: 'Share your knowledge and help students learn while earning',
      icon: <FiUserCheck className="w-5 h-5" />,
      path: '/tutor/apply',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      verifiedKey: 'isTutor',
      pendingKey: 'tutorPending',
      verifiedTitle: 'Verified Tutor',
      pendingTitle: 'Tutor Application Pending',
      pendingDescription: 'Your tutor application is under review'
    },
    {
      title: 'Apply as Tutor Verifier',
      description: 'Review and approve tutor applications to maintain quality',
      icon: <FiUserPlus className="w-5 h-5" />,
      path: '/career?apply=verifier',
      gradient: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-100 to-blue-200',
      verifiedKey: 'isTutorVerifier',
      pendingKey: 'verifierPending',
      verifiedTitle: 'Verified Tutor Verifier',
      pendingTitle: 'Verifier Application Pending',
      pendingDescription: 'Your verifier application is under review'
    },
    {
      title: 'Apply as Interviewer',
      description: 'Conduct mock interviews and help students prepare',
      icon: <FiClipboard className="w-5 h-5" />,
      path: '/register-interviewer',
      gradient: 'from-blue-700 to-blue-800',
      bgGradient: 'from-blue-200 to-blue-300',
      verifiedKey: 'isInterviewer',
      pendingKey: 'interviewerPending',
      verifiedTitle: 'Verified Interviewer',
      pendingTitle: 'Interviewer Application Pending',
      pendingDescription: 'Your interviewer application is under review'
    }
  ];

  return (
    <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 bg-home-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-12 sm:mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <div className="bg-gradient-to-r from-recruitment-badge-bg to-recruitment-cta-bg-end text-text-inverted px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
              Join Our Team
            </div>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 px-4"
          >
            <span className="bg-gradient-to-r from-text-subheading via-text-heading to-text-body bg-clip-text text-transparent">
              Grow Your Career With Us
            </span>
          </motion.h2>
          
          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg text-text-body max-w-3xl mx-auto leading-relaxed px-4"
          >
            Join SkillSwapHub and be part of a revolutionary peer-to-peer learning platform. 
            Whether you want to teach, verify tutors, or conduct interviews, we have opportunities 
            that align with your passion for education and growth.
          </motion.p>
        </motion.div>

        {/* Roles Cards - 3 Tabs */}
        <div className="relative mb-12">
          {/* Desktop View - 3 Columns */}
          <div className="hidden md:grid md:grid-cols-3 gap-5 lg:gap-6 max-w-5xl mx-auto">
            {roles.map((role, index) => {
              const isVerified = verificationStatus[role.verifiedKey];
              const isPending = verificationStatus[role.pendingKey];
              const isClickable = !isVerified && !isPending;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={isClickable ? { y: -6, scale: 1.02, transition: { duration: 0.25 } } : {}}
                  onClick={() => isClickable && handleRoleClick(role.path)}
                  className={`group relative ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`relative rounded-xl p-6 transition-all duration-300 border-2 overflow-hidden h-full flex flex-col
                    ${isVerified 
                      ? 'bg-gradient-to-br from-role-verified-bg-start to-role-verified-bg-end border-role-verified-border shadow-[0_8px_16px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]' 
                      : isPending
                      ? 'bg-gradient-to-br from-role-pending-bg-start to-role-pending-bg-end border-role-pending-border shadow-[0_8px_16px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.8),inset_0_-1px_0_rgba(0,0,0,0.05)]'
                      : 'bg-gradient-to-br from-role-card-bg-start to-role-card-bg-end border-role-card-border hover:border-role-card-border-hover shadow-[0_4px_12px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] hover:shadow-[0_8px_24px_rgba(59,130,246,0.2),inset_0_1px_0_rgba(255,255,255,0.8)]'
                    }`}>
                    {/* 3D Light Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-transparent pointer-events-none" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon with 3D effect */}
                      <motion.div
                        whileHover={isClickable ? { rotate: 15, scale: 1.15 } : {}}
                        transition={{ duration: 0.3 }}
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-text-inverted mb-4 transition-all duration-300
                          ${isVerified 
                            ? 'bg-gradient-to-br from-role-verified-icon-bg-start to-role-verified-icon-bg-end shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]' 
                            : isPending
                            ? 'bg-gradient-to-br from-role-pending-icon-bg-start to-role-pending-icon-bg-end shadow-[0_4px_12px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]'
                            : 'bg-gradient-to-br from-role-card-icon-bg-start to-role-card-icon-bg-end shadow-[0_4px_8px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] group-hover:shadow-[0_6px_16px_rgba(59,130,246,0.5),inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_-2px_4px_rgba(0,0,0,0.25)]'
                          }`}
                      >
                        {isVerified ? <FiCheck className="w-5 h-5" /> : role.icon}
                      </motion.div>

                      {/* Title */}
                      <h3 className={`text-lg font-bold mb-2 leading-tight
                        ${isVerified ? 'text-role-verified-text' : isPending ? 'text-role-pending-text' : 'text-text-heading'}`}>
                        {isVerified ? role.verifiedTitle : isPending ? role.pendingTitle : role.title}
                      </h3>

                      {/* Description */}
                      <p className={`text-sm leading-relaxed mb-4 flex-grow
                        ${isVerified ? 'text-role-verified-text' : isPending ? 'text-role-pending-text' : 'text-text-body'}`}>
                        {isVerified ? 'You are verified and active in this role' : isPending ? role.pendingDescription : role.description}
                      </p>

                      {/* Button/Status Indicator with 3D effect */}
                      {isVerified ? (
                        <div className="w-full bg-gradient-to-br from-role-verified-icon-bg-start to-role-verified-icon-bg-end text-text-inverted px-6 py-3 rounded-xl font-semibold text-base shadow-[0_6px_20px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2">
                          <FiCheck className="w-4 h-4" />
                          <span>Verified</span>
                        </div>
                      ) : isPending ? (
                        <div className="w-full bg-gradient-to-br from-role-pending-icon-bg-start to-role-pending-icon-bg-end text-text-inverted px-6 py-3 rounded-xl font-semibold text-base shadow-[0_6px_20px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_6px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Pending Review</span>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-1 text-text-heading font-semibold text-sm group-hover:text-text-subheading"
                        >
                          <span>Apply Now</span>
                          <FiArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile Horizontal Scroll - 3 Tabs */}
          <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
              {roles.map((role, index) => {
                const isVerified = verificationStatus[role.verifiedKey];
                const isPending = verificationStatus[role.pendingKey];
                const isClickable = !isVerified && !isPending;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileTap={isClickable ? { scale: 0.98 } : {}}
                    onClick={() => isClickable && handleRoleClick(role.path)}
                    className={`group relative ${isClickable ? 'cursor-pointer' : 'cursor-default'} flex-shrink-0`}
                    style={{ width: '240px' }}
                  >
                    <div className={`relative rounded-lg p-4 transition-all duration-200 border-2 overflow-hidden h-full flex flex-col
                      ${isVerified 
                        ? 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200 shadow-[0_6px_12px_rgba(16,185,129,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]' 
                        : isPending
                        ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-200 shadow-[0_6px_12px_rgba(245,158,11,0.15),inset_0_1px_0_rgba(255,255,255,0.8)]'
                        : `bg-gradient-to-br ${role.bgGradient} border-blue-200/50 shadow-[0_4px_8px_rgba(59,130,246,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] active:shadow-[0_6px_16px_rgba(59,130,246,0.2)]`
                      }`}>
                      {/* 3D Light Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/20 to-transparent pointer-events-none" />
                      
                      {/* Content */}
                      <div className="relative z-10 flex flex-col h-full">
                        {/* Icon with 3D effect */}
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-white mb-3 transition-all
                          ${isVerified 
                            ? 'bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-[0_3px_8px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)]' 
                            : isPending
                            ? 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 shadow-[0_3px_8px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)]'
                            : `bg-gradient-to-br ${role.gradient} shadow-[0_3px_6px_rgba(59,130,246,0.3),inset_0_1px_2px_rgba(255,255,255,0.3)]`
                          }`}>
                          {isVerified ? <FiCheck className="w-5 h-5" /> : role.icon}
                        </div>

                        {/* Title */}
                        <h3 className={`text-sm font-bold mb-2 leading-tight
                          ${isVerified ? 'text-emerald-900' : isPending ? 'text-amber-900' : 'text-gray-900'}`}>
                          {isVerified ? role.verifiedTitle : isPending ? role.pendingTitle : role.title}
                        </h3>

                        {/* Description */}
                        <p className={`text-xs leading-relaxed mb-3 flex-grow line-clamp-2
                          ${isVerified ? 'text-emerald-800' : isPending ? 'text-amber-800' : 'text-gray-700'}`}>
                          {isVerified ? 'Verified' : isPending ? role.pendingDescription : role.description}
                        </p>

                        {/* Button/Status Indicator with 3D effect */}
                        {isVerified ? (
                          <div className="w-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-[0_4px_12px_rgba(16,185,129,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center gap-1.5">
                            <FiCheck className="w-3.5 h-3.5" />
                            <span>Verified</span>
                          </div>
                        ) : isPending ? (
                          <div className="w-full bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-[0_4px_12px_rgba(245,158,11,0.4),inset_0_1px_2px_rgba(255,255,255,0.3)] flex items-center justify-center gap-1.5">
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Pending</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-blue-900 font-semibold text-xs">
                            <span>Apply Now</span>
                            <FiArrowRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Visit Career Page CTA - Different Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (!user) {
                navigate('/login', { state: { from: '/career' } });
                return;
              }
              navigate('/career');
            }}
            className="relative bg-gradient-to-r from-recruitment-cta-bg-start to-recruitment-cta-bg-end rounded-2xl p-6 sm:p-8 cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-text-inverted mb-2">
                  Explore More Opportunities
                </h3>
                <p className="text-recruitment-cta-text text-sm sm:text-base">
                  Visit our career page to learn about all available positions and benefits
                </p>
              </div>
              
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-3 rounded-xl backdrop-blur-sm transition-all duration-300"
              >
                <span className="text-text-inverted font-semibold text-sm sm:text-base">Visit Career Page</span>
                <FiArrowRight className="w-5 h-5 text-text-inverted" />
              </motion.div>
            </div>

            {/* Hover Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-blue-900/20 pointer-events-none"
            />
          </motion.div>
        </motion.div>


      </div>
    </section>
  );
};

export default RecruitmentSection;

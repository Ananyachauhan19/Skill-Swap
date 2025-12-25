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
    isTutorVerifier: false
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
        // Check if user is a tutor (from user object)
        const isTutor = user?.isTutor === true;
        console.log('RecruitmentSection - User isTutor check:', isTutor);

        // Check if user is an interviewer
        let isInterviewer = false;
        try {
          const interviewerResponse = await fetch(`${BACKEND_URL}/api/interview/check-interviewer`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (interviewerResponse.ok) {
            const interviewerData = await interviewerResponse.json();
            console.log('RecruitmentSection - Interviewer response:', interviewerData);
            isInterviewer = interviewerData?.isApprovedInterviewer === true || 
                           interviewerData?.isInterviewer === true ||
                           interviewerData?.approved === true;
          }
        } catch (err) {
          console.error('RecruitmentSection - Error checking interviewer status:', err);
        }

        // Check if user is a tutor verifier (employee)
        let isTutorVerifier = false;
        try {
          const verifierResponse = await fetch(`${BACKEND_URL}/api/employee/check-verifier`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (verifierResponse.ok) {
            const verifierData = await verifierResponse.json();
            console.log('RecruitmentSection - Verifier response:', verifierData);
            isTutorVerifier = verifierData?.isTutorVerifier === true ||
                             verifierData?.isEmployee === true ||
                             verifierData?.hasAccess === true ||
                             verifierData?.canVerifyTutors === true;
          }
        } catch (err) {
          console.error('RecruitmentSection - Error checking verifier status:', err);
        }

        console.log('RecruitmentSection - Final verification status:', { isTutor, isInterviewer, isTutorVerifier });
        
        setVerificationStatus({
          isTutor,
          isInterviewer,
          isTutorVerifier
        });
      } catch (error) {
        console.error('RecruitmentSection - Error in checkVerificationStatus:', error);
      }
    };

    checkVerificationStatus();
  }, [user]);

  const roles = [
    {
      title: 'Apply as Tutor',
      description: 'Share your knowledge and help students learn while earning',
      icon: <FiUserCheck className="w-5 h-5" />,
      path: '/tutor/apply',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      verifiedKey: 'isTutor',
      verifiedTitle: 'Verified Tutor'
    },
    {
      title: 'Apply as Tutor Verifier',
      description: 'Review and approve tutor applications to maintain quality',
      icon: <FiUserPlus className="w-5 h-5" />,
      path: '/career',
      gradient: 'from-blue-600 to-blue-700',
      bgGradient: 'from-blue-100 to-blue-200',
      verifiedKey: 'isTutorVerifier',
      verifiedTitle: 'Verified Tutor Verifier'
    },
    {
      title: 'Apply as Interviewer',
      description: 'Conduct mock interviews and help students prepare',
      icon: <FiClipboard className="w-5 h-5" />,
      path: '/register-interviewer',
      gradient: 'from-blue-700 to-blue-800',
      bgGradient: 'from-blue-200 to-blue-300',
      verifiedKey: 'isInterviewer',
      verifiedTitle: 'Verified Interviewer'
    }
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50">
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
            <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
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
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
              Grow Your Career With Us
            </span>
          </motion.h2>
          
          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4"
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
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                  onClick={() => !isVerified && navigate(role.path)}
                  className={`group relative ${!isVerified ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`relative ${isVerified ? 'bg-gradient-to-br from-green-50 to-green-100' : `bg-gradient-to-br ${role.bgGradient}`} rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border-2 ${isVerified ? 'border-green-300' : 'border-blue-200/50 hover:border-blue-400/60'} overflow-hidden h-full flex flex-col backdrop-blur-sm`}>
                    {/* Subtle Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon */}
                      <motion.div
                        whileHover={!isVerified ? { rotate: 15, scale: 1.15 } : {}}
                        transition={{ duration: 0.3 }}
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${isVerified ? 'bg-gradient-to-r from-green-500 to-green-600' : `bg-gradient-to-r ${role.gradient}`} text-white mb-4 shadow-md group-hover:shadow-lg transition-shadow duration-300`}
                      >
                        {isVerified ? <FiCheck className="w-5 h-5" /> : role.icon}
                      </motion.div>

                      {/* Title */}
                      <h3 className={`text-lg font-bold ${isVerified ? 'text-green-900' : 'text-gray-900'} mb-2 leading-tight`}>
                        {isVerified ? role.verifiedTitle : role.title}
                      </h3>

                      {/* Description */}
                      <p className={`${isVerified ? 'text-green-800' : 'text-gray-700'} text-sm leading-relaxed mb-4 flex-grow`}>
                        {isVerified ? 'You are verified and active in this role' : role.description}
                      </p>

                      {/* Button/Status Indicator */}
                      {isVerified ? (
                        <div className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold text-base shadow-lg flex items-center justify-center gap-2">
                          <FiCheck className="w-4 h-4" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-1 text-blue-900 font-semibold text-sm group-hover:text-blue-950"
                        >
                          <span>Apply Now</span>
                          <FiArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>

                    {/* Hover Glow Effect */}
                    {!isVerified && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none"
                      />
                    )}
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
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    whileTap={!isVerified ? { scale: 0.98 } : {}}
                    onClick={() => !isVerified && navigate(role.path)}
                    className={`group relative ${!isVerified ? 'cursor-pointer' : 'cursor-default'} flex-shrink-0`}
                    style={{ width: '240px' }}
                  >
                    <div className={`relative ${isVerified ? 'bg-gradient-to-br from-green-50 to-green-100' : `bg-gradient-to-br ${role.bgGradient}`} rounded-lg p-4 shadow-md active:shadow-lg transition-all duration-200 border-2 ${isVerified ? 'border-green-300' : 'border-blue-200/50'} overflow-hidden h-full flex flex-col backdrop-blur-sm`}>
                      {/* Subtle Background Pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 flex flex-col h-full">
                        {/* Icon */}
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${isVerified ? 'bg-gradient-to-r from-green-500 to-green-600' : `bg-gradient-to-r ${role.gradient}`} text-white mb-3 shadow-md`}>
                          {isVerified ? <FiCheck className="w-5 h-5" /> : role.icon}
                        </div>

                        {/* Title */}
                        <h3 className={`text-sm font-bold ${isVerified ? 'text-green-900' : 'text-gray-900'} mb-2 leading-tight`}>
                          {isVerified ? role.verifiedTitle : role.title}
                        </h3>

                        {/* Description */}
                        <p className={`${isVerified ? 'text-green-800' : 'text-gray-700'} text-xs leading-relaxed mb-3 flex-grow line-clamp-2`}>
                          {isVerified ? 'You are verified' : role.description}
                        </p>

                        {/* Button/Status Indicator */}
                        {isVerified ? (
                          <div className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-semibold text-xs shadow-md flex items-center justify-center gap-1.5">
                            <FiCheck className="w-3.5 h-3.5" />
                            <span>Verified</span>
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
            onClick={() => navigate('/career')}
            className="relative bg-gradient-to-r from-blue-800 to-blue-900 rounded-2xl p-6 sm:p-8 cursor-pointer overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Explore More Opportunities
                </h3>
                <p className="text-blue-100 text-sm sm:text-base">
                  Visit our career page to learn about all available positions and benefits
                </p>
              </div>
              
              <motion.div
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-3 rounded-xl backdrop-blur-sm transition-all duration-300"
              >
                <span className="text-white font-semibold text-sm sm:text-base">Visit Career Page</span>
                <FiArrowRight className="w-5 h-5 text-white" />
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

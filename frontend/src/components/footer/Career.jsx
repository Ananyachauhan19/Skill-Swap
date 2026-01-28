import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiBriefcase,
  FiMapPin,
  FiClock,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiClipboard,
  FiX,
  FiCheckCircle
} from 'react-icons/fi';
import JobApplicationForm from './JobApplicationForm';
import RecruitmentApplication from '../../user/RecruitmentApplication';
import { useAuth } from '../../context/AuthContext';
import { BACKEND_URL } from '../../config';

const Career = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showRecruitmentForm, setShowRecruitmentForm] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    isTutor: false,
    isInterviewer: false,
    isTutorVerifier: false,
    tutorPending: false,
    interviewerPending: false,
    verifierPending: false
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchJobs();
      if (user) {
        await fetchMyApplications();
      }
    };
    loadData();
  }, [user]);

  // Auto-open verifier application via URL query
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const applyParam = urlParams.get('apply');
    if (applyParam === 'verifier') {
      setShowRecruitmentForm(true);
      window.history.replaceState({}, '', '/career');
    }
  }, []);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) {
        setVerificationStatus({
          isTutor: false,
          isInterviewer: false,
          isTutorVerifier: false,
          tutorPending: false,
          interviewerPending: false,
          verifierPending: false
        });
        return;
      }

      try {
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
            console.error('Career - Error checking tutor status:', err);
          }
        }

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
            isInterviewer =
              interviewerData?.isApprovedInterviewer === true ||
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
          console.error('Career - Error checking interviewer status:', err);
        }

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
            isTutorVerifier =
              verifierData?.isTutorVerifier === true ||
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
              verifierPending =
                Array.isArray(recruitmentData) && recruitmentData.some((app) => app.status === 'pending');
            }
          }
        } catch (err) {
          console.error('Career - Error checking verifier status:', err);
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
        console.error('Career - Error in checkVerificationStatus:', error);
      }
    };

    checkVerificationStatus();
  }, [user]);

  useEffect(() => {
    filterJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, jobTypeFilter, jobs]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/career/public/jobs`);
      const jobsData = Array.isArray(response.data?.jobs)
        ? response.data.jobs
        : Array.isArray(response.data)
          ? response.data
          : [];
      setJobs(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplications = async () => {
    try {
      setApplicationsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No authentication token found');
        setMyApplications([]);
        return;
      }
      
      console.log('🔄 Fetching applications with token...');
      const response = await axios.get(`${BACKEND_URL}/api/career/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Raw response from backend:', response.data);
      
      const applicationsData = Array.isArray(response.data?.applications)
        ? response.data.applications
        : Array.isArray(response.data)
          ? response.data
          : [];
      
      console.log(`✅ Found ${applicationsData.length} applications:`, applicationsData);
      
      // Log each application with job details
      applicationsData.forEach((app, index) => {
        console.log(`Application ${index + 1}:`, {
          id: app._id,
          jobId: app.jobPosting?._id,
          jobTitle: app.jobPosting?.jobTitle,
          status: app.status,
          email: app.email
        });
      });
      
      setMyApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setMyApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter(
        job =>
          job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (jobTypeFilter) {
      filtered = filtered.filter(job => job.jobType === jobTypeFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleApply = (job) => {
    // Check if user has already applied
    if (user && hasAppliedToJob(job._id)) {
      alert('You have already submitted an application for this position. You can track your application status in the "My Applications" section above.');
      return;
    }
    
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleViewDetails = (job) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleRoleClick = (path) => {
    if (!user) {
      navigate('/login', { state: { from: path } });
      return;
    }
    navigate(path);
  };

  const handleApplicationSuccess = async () => {
    await fetchJobs();
    if (user) {
      await fetchMyApplications();
    }
    // Scroll to My Applications section
    setTimeout(() => {
      const applicationsSection = document.querySelector('[data-section="my-applications"]');
      if (applicationsSection) {
        applicationsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 500);
  };

  const getJobTypeColor = (type) => {
    switch (type) {
      case 'Internship':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Full-Time':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Part-Time':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Contract':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Freelance':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'under review':
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'shortlisted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected':
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'interviewing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Check if user has already applied to a job
  const hasAppliedToJob = (jobId) => {
    const hasApplied = myApplications.some(app => {
      const appJobId = app.jobPosting?._id || app.jobPosting;
      const match = String(appJobId) === String(jobId);
      return match;
    });
    console.log(`Checking if applied to job ${jobId}:`, hasApplied, `(${myApplications.length} applications)`);
    return hasApplied;
  };

  // Get application status for a specific job
  const getJobApplicationStatus = (jobId) => {
    const application = myApplications.find(app => {
      const appJobId = app.jobPosting?._id || app.jobPosting;
      return String(appJobId) === String(jobId);
    });
    const status = application?.status || null;
    console.log(`Status for job ${jobId}:`, status);
    return status;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 md:pt-24 lg:pt-28 pb-12 md:pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6"
                style={{ color: 'rgb(30, 58, 138)' }}
              >
                Build Your Career
                <span className="block mt-2" style={{ color: 'rgb(79, 70, 229)' }}>
                  With SkillSwapHub
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-base md:text-lg leading-relaxed mb-0 max-w-xl"
                style={{ color: 'rgba(0, 0, 0, 0.6)' }}
              >
                Join our mission to revolutionize education through peer learning. Work with passionate educators, innovators, and learners to create meaningful impact across the globe.
              </motion.p>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="order-1 lg:order-2"
            >
              <img
                src="https://res.cloudinary.com/dbltazdsa/image/upload/v1769578372/Gemini_Generated_Image_kie3lckie3lckie3_emztkr.png"
                alt="Career at SkillSwapHub"
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* My Applications Section */}
      {user && (
        <section data-section="my-applications" className="py-12 md:py-16 px-4 md:px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex items-center justify-between"
            >
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'rgb(30, 58, 138)' }}>
                  My Applications
                </h2>
                <p className="text-sm md:text-base" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  Track the status of your job applications {myApplications.length > 0 && `(${myApplications.length})`}
                </p>
              </div>
              <button
                onClick={fetchMyApplications}
                disabled={applicationsLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {applicationsLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Refresh</span>
                  </>
                )}
              </button>
            </motion.div>

            {applicationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-600 mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Loading applications...</p>
                </div>
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border-2 border-slate-200">
                  <FiBriefcase className="text-2xl text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  No Applications Yet
                </h3>
                <p className="text-sm max-w-md mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  You haven't applied to any positions yet. Browse our job listings below and apply to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                {myApplications.map((application, index) => (
                  <motion.div
                    key={application._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                            {application.jobPosting?.jobTitle || 'Job Position'}
                          </h3>
                          {application.jobPosting?.department && (
                            <p className="text-xs text-slate-500 font-medium">
                              {application.jobPosting.department}
                            </p>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border whitespace-nowrap capitalize ${getStatusColor(application.status)}`}>
                          {application.status || 'pending'}
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <FiMapPin className="text-blue-600 flex-shrink-0 text-sm" />
                          <span className="line-clamp-1">
                            {application.jobPosting?.location || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <FiCalendar className="text-indigo-600 flex-shrink-0 text-sm" />
                          <span>
                            Applied {new Date(application.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {application.jobPosting?.jobType && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <FiBriefcase className="text-purple-600 flex-shrink-0 text-sm" />
                            <span>{application.jobPosting.jobType}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Application ID:</span>
                          <span className="font-mono text-slate-700">
                            #{application._id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Apply for Roles Section */}
      <section id="apply-roles" className="py-12 md:py-16 px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'rgb(30, 58, 138)' }}>
              Apply for Expert Roles
            </h2>
            <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Become a tutor, interviewer, or verifier. Share your expertise and help students achieve their goals.
            </p>
          </motion.div>

          {/* Desktop View */}
          <div className="hidden md:grid md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {/* Tutor Verifier Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <FiUserPlus className="text-2xl text-white" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">Tutor Verifier</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                Review and approve tutor applications. Ensure quality education standards.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (verificationStatus.isTutorVerifier || verificationStatus.verifierPending) return;
                  if (!user) {
                    navigate('/login', { state: { from: '/career?apply=verifier' } });
                    return;
                  }
                  setShowRecruitmentForm(true);
                }}
                disabled={verificationStatus.isTutorVerifier || verificationStatus.verifierPending}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  verificationStatus.isTutorVerifier
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                    : verificationStatus.verifierPending
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {verificationStatus.isTutorVerifier
                  ? '✓ Verified'
                  : verificationStatus.verifierPending
                  ? 'Pending'
                  : 'Apply Now'}
              </button>
            </motion.div>

            {/* Tutor Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <FiUserCheck className="text-2xl text-white" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">Become a Tutor</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                Share your knowledge and expertise. Help students learn new skills.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (verificationStatus.isTutor || verificationStatus.tutorPending) return;
                  handleRoleClick('/tutor/apply');
                }}
                disabled={verificationStatus.isTutor || verificationStatus.tutorPending}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  verificationStatus.isTutor
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                    : verificationStatus.tutorPending
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {verificationStatus.isTutor
                  ? '✓ Verified'
                  : verificationStatus.tutorPending
                  ? 'Pending'
                  : 'Apply Now'}
              </button>
            </motion.div>

            {/* Interviewer Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all duration-300"
            >
              <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                <FiClipboard className="text-2xl text-white" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">Interviewer</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                Conduct mock interviews and assessments. Guide career growth.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (verificationStatus.isInterviewer || verificationStatus.interviewerPending) return;
                  handleRoleClick('/register-interviewer');
                }}
                disabled={verificationStatus.isInterviewer || verificationStatus.interviewerPending}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  verificationStatus.isInterviewer
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                    : verificationStatus.interviewerPending
                    ? 'bg-orange-50 text-orange-700 border border-orange-200 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {verificationStatus.isInterviewer
                  ? '✓ Verified'
                  : verificationStatus.interviewerPending
                  ? 'Pending'
                  : 'Apply Now'}
              </button>
            </motion.div>
          </div>

          {/* Mobile Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {/* Tutor Verifier Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl p-5 border border-slate-200 w-72 flex-shrink-0"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <FiUserPlus className="text-2xl text-white" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">Tutor Verifier</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  Review and approve tutor applications. Ensure quality education standards.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (verificationStatus.isTutorVerifier || verificationStatus.verifierPending) return;
                    if (!user) {
                      navigate('/login', { state: { from: '/career?apply=verifier' } });
                      return;
                    }
                    setShowRecruitmentForm(true);
                  }}
                  disabled={verificationStatus.isTutorVerifier || verificationStatus.verifierPending}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    verificationStatus.isTutorVerifier
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                      : verificationStatus.verifierPending
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {verificationStatus.isTutorVerifier
                    ? '✓ Verified'
                    : verificationStatus.verifierPending
                    ? 'Pending'
                    : 'Apply Now'}
                </button>
              </motion.div>

              {/* Tutor Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white rounded-xl p-5 border border-slate-200 w-72 flex-shrink-0"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <FiUserCheck className="text-2xl text-white" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">Become a Tutor</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  Share your knowledge and expertise. Help students learn new skills.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (verificationStatus.isTutor || verificationStatus.tutorPending) return;
                    handleRoleClick('/tutor/apply');
                  }}
                  disabled={verificationStatus.isTutor || verificationStatus.tutorPending}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    verificationStatus.isTutor
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                      : verificationStatus.tutorPending
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {verificationStatus.isTutor
                    ? '✓ Verified'
                    : verificationStatus.tutorPending
                    ? 'Pending'
                    : 'Apply Now'}
                </button>
              </motion.div>

              {/* Interviewer Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl p-5 border border-slate-200 w-72 flex-shrink-0"
              >
                <div className="w-12 h-12 bg-amber-600 rounded-lg flex items-center justify-center mb-4">
                  <FiClipboard className="text-2xl text-white" />
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">Interviewer</h3>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  Conduct mock interviews and assessments. Guide career growth.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (verificationStatus.isInterviewer || verificationStatus.interviewerPending) return;
                    handleRoleClick('/register-interviewer');
                  }}
                  disabled={verificationStatus.isInterviewer || verificationStatus.interviewerPending}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                    verificationStatus.isInterviewer
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed'
                      : verificationStatus.interviewerPending
                      ? 'bg-orange-50 text-orange-700 border border-orange-200 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {verificationStatus.isInterviewer
                    ? '✓ Verified'
                    : verificationStatus.interviewerPending
                    ? 'Pending'
                    : 'Apply Now'}
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section id="job-listings" className="py-12 md:py-16 px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'rgb(30, 58, 138)' }}>
              We Are Hiring
            </h2>
            <p className="text-sm md:text-base max-w-2xl mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              Explore exciting opportunities to join our team and make an impact in education technology.
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Search by job title, location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-slate-900 placeholder-slate-400"
                  />
                </div>
                <div className="relative">
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full md:w-auto px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer appearance-none bg-white text-sm text-slate-900 pr-8"
                  >
                    <option value="">All Types</option>
                    <option value="Internship">Internship</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                  <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between text-xs">
                <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                  <strong className="text-slate-900 font-bold">{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'position' : 'positions'}
                </span>
                {(searchTerm || jobTypeFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setJobTypeFilter('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Job Cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Loading...</p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-slate-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiBriefcase className="text-2xl text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {searchTerm || jobTypeFilter ? 'No matching jobs' : 'No positions available'}
              </h3>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
                {searchTerm || jobTypeFilter
                  ? 'Try adjusting your search criteria.'
                  : 'Check back soon for new opportunities!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {filteredJobs.map((job, index) => {
                const alreadyApplied = user && hasAppliedToJob(job._id);
                const applicationStatus = alreadyApplied ? getJobApplicationStatus(job._id) : null;
                
                return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={`bg-white rounded-lg border transition-all duration-300 overflow-hidden ${
                    alreadyApplied 
                      ? 'border-orange-200 shadow-sm ring-1 ring-orange-100' 
                      : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="p-4">
                    {alreadyApplied && (
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md w-fit font-bold">
                        <FiCheckCircle className="text-sm" />
                        <span>Already Applied</span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-slate-900 mb-1 line-clamp-1">
                          {job.jobTitle}
                        </h3>
                        {job.department && (
                          <p className="text-xs text-slate-500 font-medium">{job.department}</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold border whitespace-nowrap ${getJobTypeColor(job.jobType)}`}>
                        {job.jobType}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">
                      {job.shortDescription}
                    </p>

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <FiMapPin className="text-blue-600 flex-shrink-0 text-sm" />
                        <span className="line-clamp-1">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <FiUsers className="text-amber-600 flex-shrink-0 text-sm" />
                        <span>{job.applicationCount || 0} applicants</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(job)}
                        className="flex-1 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-900 font-semibold py-2 px-3 rounded-lg transition-all text-xs"
                      >
                        Details
                      </button>
                      {user && hasAppliedToJob(job._id) ? (
                        <div className="flex-1 flex items-center justify-center gap-1 bg-orange-50 border border-orange-300 text-orange-700 font-bold py-2 px-3 rounded-lg text-xs shadow-sm">
                          <FiCheckCircle className="text-sm" />
                          <span>Already Applied</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleApply(job)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg transition-all text-xs"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {user && hasAppliedToJob(job._id) && getJobApplicationStatus(job._id) && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Status:</span>
                          <span className={`px-2 py-0.5 rounded-md font-bold border capitalize ${getStatusColor(getJobApplicationStatus(job._id))}`}>
                            {getJobApplicationStatus(job._id)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white rounded-xl border border-slate-200 mt-16"
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedJob.jobTitle}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${getJobTypeColor(selectedJob.jobType)}`}>
                    {selectedJob.jobType}
                  </span>
                  {selectedJob.department && (
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                      {selectedJob.department}
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                    {selectedJob.location}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJobDetails(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {user && hasAppliedToJob(selectedJob._id) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800 font-semibold mb-1">
                    <FiCheckCircle className="text-lg" />
                    <span>You have applied for this position</span>
                  </div>
                  {getJobApplicationStatus(selectedJob._id) && (
                    <div className="flex items-center gap-2 text-xs text-green-700 ml-6">
                      <span>Application Status:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold border capitalize ${getStatusColor(getJobApplicationStatus(selectedJob._id))}`}>
                        {getJobApplicationStatus(selectedJob._id)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedJob.shortDescription && (
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{selectedJob.shortDescription}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <FiUsers className="text-blue-600" />
                  <span>{selectedJob.applicationCount || 0} applicants</span>
                </div>
                {selectedJob.expiryDate && (
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <FiClock className="text-amber-600" />
                    <span>Closes {new Date(selectedJob.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <h4 className="text-base font-bold text-slate-900 mb-2">Description</h4>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{selectedJob.description}</p>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Requirements</h4>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{selectedJob.requirements}</p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowJobDetails(false)}
                className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-2.5 px-4 rounded-lg transition-all text-sm"
              >
                Close
              </button>
              {user && hasAppliedToJob(selectedJob._id) ? (
                <div className="flex-1 flex items-center justify-center gap-2 bg-orange-50 border border-orange-300 text-orange-700 font-bold py-2.5 px-4 rounded-lg text-sm shadow-sm">
                  <FiCheckCircle />
                  <span>Already Applied</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowJobDetails(false);
                    handleApply(selectedJob);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all text-sm"
                >
                  Apply Now
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Tutor Verifier Recruitment Modal */}
      {showRecruitmentForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl bg-white rounded-xl border border-slate-200 mt-10"
          >
            <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Apply as Tutor Verifier</h3>
                <p className="text-sm text-slate-600">Submit your application for review.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecruitmentForm(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-0">
              <RecruitmentApplication />
            </div>
          </motion.div>
        </div>
      )}

      {/* Application Form Modal */}
      {showApplicationForm && selectedJob && (
        <JobApplicationForm
          job={selectedJob}
          onClose={() => {
            setShowApplicationForm(false);
            setSelectedJob(null);
          }}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default Career;

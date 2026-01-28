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
      {/* Hero Section - Professional Design */}
      <section className="relative pt-16 md:pt-20 pb-10 md:pb-14 px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left Content - Text with Accent Lines */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              {/* Top Accent Line */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-0.5 w-16 bg-gradient-to-r from-blue-900 to-blue-700"></div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Careers</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
                <span className="text-gray-900">Shape The Future Of</span>
                <span className="block mt-2 bg-gradient-to-r from-blue-900 via-blue-800 to-black bg-clip-text text-transparent">
                  Education Technology
                </span>
              </h1>

              {/* Decorative Accent Line */}
              <div className="h-1 w-20 bg-gradient-to-r from-blue-900 to-black rounded-full mb-5"></div>

              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6 max-w-lg">
                Join our mission to revolutionize peer-to-peer learning. Build impactful solutions that connect learners and experts worldwide.
              </p>

              {/* Stats - Compact */}
              <div className="grid grid-cols-3 gap-4 mb-7 max-w-md">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                  <div className="text-2xl font-black text-blue-900">{jobs.length}+</div>
                  <div className="text-xs text-gray-600 font-semibold mt-0.5">Open Roles</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-gray-50 to-white border border-gray-200">
                  <div className="text-2xl font-black text-gray-900">50+</div>
                  <div className="text-xs text-gray-600 font-semibold mt-0.5">Team Size</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-100">
                  <div className="text-2xl font-black text-blue-900">100%</div>
                  <div className="text-xs text-gray-600 font-semibold mt-0.5">Remote</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => document.getElementById('job-listings')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white text-sm font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Browse Jobs
                </button>
                <button
                  onClick={() => document.getElementById('apply-roles')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 py-3 bg-white border-2 border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 text-sm font-bold rounded-lg transition-all duration-200"
                >
                  Expert Roles
                </button>
              </div>
            </motion.div>

            {/* Right Side - Image Only */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="order-1 lg:order-2 relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://res.cloudinary.com/dbltazdsa/image/upload/v1769578372/Gemini_Generated_Image_kie3lckie3lckie3_emztkr.png"
                  alt="Career at SkillSwapHub"
                  className="w-full h-[300px] md:h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center">
                    <FiUsers className="text-white text-lg" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Join Our Team</div>
                    <div className="text-sm font-black text-gray-900">We're Hiring!</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* My Applications Section - Professional Compact Design */}
      {user && (
        <section data-section="my-applications" className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-6 flex items-center justify-between"
            >
              <div>
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-1">
                  My Applications
                </h2>
                <p className="text-xs text-gray-600">
                  Track your application status {myApplications.length > 0 && `(${myApplications.length} total)`}
                </p>
              </div>
              <button
                onClick={fetchMyApplications}
                disabled={applicationsLoading}
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {applicationsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-900"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>Refresh</span>
              </button>
            </motion.div>

            {applicationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Loading applications...</p>
                </div>
              </div>
            ) : myApplications.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3 border-2 border-gray-200">
                  <FiBriefcase className="text-xl text-gray-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  No Applications Yet
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Browse job listings and apply to get started!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                {myApplications.map((application, index) => (
                  <motion.div
                    key={application._id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
                    className="bg-white rounded-lg border border-gray-200 hover:border-blue-900 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-gray-900 mb-1 line-clamp-1">
                            {application.jobPosting?.jobTitle || 'Job Position'}
                          </h3>
                          {application.jobPosting?.department && (
                            <p className="text-xs text-gray-500 font-semibold truncate">
                              {application.jobPosting.department}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-black border whitespace-nowrap capitalize ${getStatusColor(application.status)}`}>
                          {application.status || 'pending'}
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FiMapPin className="text-blue-900 flex-shrink-0 text-xs" />
                          <span className="truncate">
                            {application.jobPosting?.location || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FiCalendar className="text-amber-600 flex-shrink-0 text-xs" />
                          <span>
                            Applied {new Date(application.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {application.jobPosting?.jobType && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <FiBriefcase className="text-purple-600 flex-shrink-0 text-xs" />
                            <span>{application.jobPosting.jobType}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-medium">Application ID:</span>
                          <span className="font-mono text-gray-700 font-bold">
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

      {/* Apply for Expert Roles Section - Professional Design */}
      <section id="apply-roles" className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-gray-200 rounded-full mb-3 shadow-sm">
              <div className="w-2 h-2 bg-blue-900 rounded-full animate-pulse"></div>
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Expert Roles</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              Apply for Expert Roles
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Share your expertise and help learners worldwide
            </p>
          </motion.div>

          {/* Desktop View - Compact Professional Cards */}
          <div className="hidden md:grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {/* Tutor Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              onClick={() => {
                if (verificationStatus.isTutor || verificationStatus.tutorPending) return;
                handleRoleClick('/tutor/apply');
              }}
              className={`relative group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 ${
                verificationStatus.isTutor || verificationStatus.tutorPending
                  ? 'cursor-not-allowed opacity-90'
                  : 'cursor-pointer hover:border-purple-400 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FiUserCheck className="text-white text-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-gray-900 mb-1">Tutor</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    Teach skills and guide learners through sessions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                  verificationStatus.isTutor
                    ? 'bg-green-50 text-green-700 border border-green-300'
                    : verificationStatus.tutorPending
                    ? 'bg-orange-50 text-orange-700 border border-orange-300'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {verificationStatus.isTutor ? '✓ Verified' : verificationStatus.tutorPending ? 'Pending' : 'Apply Now'}
              </button>
            </motion.div>

            {/* Interviewer Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              onClick={() => {
                if (verificationStatus.isInterviewer || verificationStatus.interviewerPending) return;
                handleRoleClick('/register-interviewer');
              }}
              className={`relative group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 ${
                verificationStatus.isInterviewer || verificationStatus.interviewerPending
                  ? 'cursor-not-allowed opacity-90'
                  : 'cursor-pointer hover:border-amber-400 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FiUserPlus className="text-white text-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-gray-900 mb-1">Interviewer</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    Conduct mock interviews and provide feedback.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                  verificationStatus.isInterviewer
                    ? 'bg-green-50 text-green-700 border border-green-300'
                    : verificationStatus.interviewerPending
                    ? 'bg-orange-50 text-orange-700 border border-orange-300'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {verificationStatus.isInterviewer ? '✓ Verified' : verificationStatus.interviewerPending ? 'Pending' : 'Apply Now'}
              </button>
            </motion.div>

            {/* Tutor Verifier Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              onClick={() => {
                if (verificationStatus.isTutorVerifier || verificationStatus.verifierPending) return;
                if (!user) {
                  navigate('/login', { state: { from: '/career?apply=verifier' } });
                  return;
                }
                setShowRecruitmentForm(true);
              }}
              className={`relative group bg-white rounded-xl border border-gray-200 p-5 transition-all duration-200 ${
                verificationStatus.isTutorVerifier || verificationStatus.verifierPending
                  ? 'cursor-not-allowed opacity-90'
                  : 'cursor-pointer hover:border-blue-400 hover:shadow-lg'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-md">
                  <FiClipboard className="text-white text-lg" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-gray-900 mb-1">Tutor Verifier</h3>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    Review and verify tutor applications.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
                  verificationStatus.isTutorVerifier
                    ? 'bg-green-50 text-green-700 border border-green-300'
                    : verificationStatus.verifierPending
                    ? 'bg-orange-50 text-orange-700 border border-orange-300'
                    : 'bg-blue-900 hover:bg-blue-800 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {verificationStatus.isTutorVerifier ? '✓ Verified' : verificationStatus.verifierPending ? 'Pending' : 'Apply Now'}
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

      {/* Job Listings Section - Professional & Scalable */}
      <section id="job-listings" className="py-10 md:py-12 px-4 md:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full mb-3 shadow-sm">
              <div className="w-2 h-2 bg-gray-900 rounded-full animate-pulse"></div>
              <span className="text-xs font-black text-gray-900 uppercase tracking-widest">Job Openings</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
              We Are Hiring
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Explore opportunities to make an impact in education technology
            </p>
          </motion.div>

          {/* Professional Search Bar - Compact & Scalable */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto mb-8"
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                {/* Search Input */}
                <div className="md:col-span-7 relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Job title, keywords, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Job Type Filter */}
                <div className="md:col-span-4 relative">
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent cursor-pointer appearance-none bg-white text-sm text-gray-900"
                  >
                    <option value="">All Job Types</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                  <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none text-sm" />
                </div>

                {/* Clear Button */}
                {(searchTerm || jobTypeFilter) && (
                  <div className="md:col-span-1">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setJobTypeFilter('');
                      }}
                      className="w-full py-2 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                    >
                      <FiX className="text-sm" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  <span className="font-black text-gray-900">{filteredJobs.length}</span> {filteredJobs.length === 1 ? 'position' : 'positions'} available
                </span>
              </div>
            </div>
          </motion.div>

          {/* Job Cards - Compact & Professional */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Loading positions...</p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
                <FiBriefcase className="text-xl text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {searchTerm || jobTypeFilter ? 'No matching jobs' : 'No positions available'}
              </h3>
              <p className="text-sm text-gray-600">
                {searchTerm || jobTypeFilter ? 'Try different filters' : 'Check back soon!'}
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
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.3) }}
                  className="bg-white rounded-lg border border-gray-200 hover:border-blue-900 hover:shadow-lg transition-all duration-200 overflow-hidden group"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-gray-900 mb-1 line-clamp-1">
                          {job.jobTitle}
                        </h3>
                        {job.department && (
                          <p className="text-xs text-gray-500 font-semibold truncate">
                            {job.department}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-black border whitespace-nowrap ${getJobTypeColor(job.jobType)}`}>
                        {job.jobType}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FiMapPin className="text-blue-900 flex-shrink-0 text-xs" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FiClock className="text-gray-400 flex-shrink-0 text-xs" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <FiUsers className="text-amber-600 flex-shrink-0 text-xs" />
                        <span>{job.applicationCount || 0} applicants</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                      {job.shortDescription}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(job)}
                        className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-lg transition-all"
                      >
                        Details
                      </button>
                      {alreadyApplied ? (
                        <button
                          disabled
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border ${getStatusColor(applicationStatus)}`}
                        >
                          {applicationStatus === 'accepted' ? '✓ Accepted' : applicationStatus === 'rejected' ? '✗ Rejected' : '✓ Applied'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleApply(job)}
                          className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md hover:shadow-lg"
                        >
                          Apply Now
                        </button>
                      )}
                    </div>
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

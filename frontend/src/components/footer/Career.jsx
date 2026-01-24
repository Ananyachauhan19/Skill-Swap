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
  FiHome,
  FiUserCheck,
  FiUserPlus,
  FiClipboard,
  FiX
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
  const [verificationStatus, setVerificationStatus] = useState({
    isTutor: false,
    isInterviewer: false,
    isTutorVerifier: false,
    tutorPending: false,
    interviewerPending: false,
    verifierPending: false
  });

  useEffect(() => {
    fetchJobs();
  }, []);

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
      const response = await axios.get('/api/career/public/jobs');
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

  const filterJobs = () => {
    let filtered = jobs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        job =>
          job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply job type filter
    if (jobTypeFilter) {
      filtered = filtered.filter(job => job.jobType === jobTypeFilter);
    }

    setFilteredJobs(filtered);
  };

  const handleApply = (job) => {
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

  const handleApplicationSuccess = () => {
    fetchJobs(); // Refresh jobs to update application count
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Hero Section */}
      <section className="relative pt-16 md:pt-[72px] xl:pt-20 pb-12 sm:pb-16 md:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-indigo-900/5 to-blue-900/5" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto relative z-10"
        >
          <div className="text-center mb-8 sm:mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-block mb-4"
            >
              <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow">
                Career at SkillSwapHub
              </div>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 sm:mb-6 bg-gradient-to-r from-blue-900 to-blue-900 bg-clip-text text-transparent px-2">
              Explore Career Opportunities
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-700 max-w-3xl mx-auto mb-6 leading-relaxed px-3 sm:px-4">
              Build with a learning-first team. Teach, verify, interview, and grow with a platform that connects learners and mentors.
            </p>
          </div>

          {/* Career Info + Apply Tabs */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">Why Career at SkillSwapHub?</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    We’re building a professional, trusted ecosystem for peer learning. If you love education, community, and impact—this is for you.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Remote-friendly</span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Growth-focused</span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">Impact-driven</span>
                  </div>
                </div>

                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold border transition-all ${
                        verificationStatus.isTutorVerifier
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default'
                          : verificationStatus.verifierPending
                          ? 'bg-orange-50 text-orange-800 border-orange-200 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/20'
                      }`}
                    >
                      <FiUserPlus className="text-base" />
                      <span>
                        {verificationStatus.isTutorVerifier
                          ? 'Verified'
                          : verificationStatus.verifierPending
                          ? 'Pending'
                          : 'Tutor Verify'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (verificationStatus.isTutor || verificationStatus.tutorPending) return;
                        handleRoleClick('/tutor/apply');
                      }}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold border transition-all ${
                        verificationStatus.isTutor
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default'
                          : verificationStatus.tutorPending
                          ? 'bg-orange-50 text-orange-800 border-orange-200 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/20'
                      }`}
                    >
                      <FiUserCheck className="text-base" />
                      <span>
                        {verificationStatus.isTutor
                          ? 'Verified'
                          : verificationStatus.tutorPending
                          ? 'Pending'
                          : 'Apply Tutor'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (verificationStatus.isInterviewer || verificationStatus.interviewerPending) return;
                        handleRoleClick('/register-interviewer');
                      }}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold border transition-all ${
                        verificationStatus.isInterviewer
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 cursor-default'
                          : verificationStatus.interviewerPending
                          ? 'bg-orange-50 text-orange-800 border-orange-200 cursor-default'
                          : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500/20'
                      }`}
                    >
                      <FiClipboard className="text-base" />
                      <span>
                        {verificationStatus.isInterviewer
                          ? 'Verified'
                          : verificationStatus.interviewerPending
                          ? 'Pending'
                          : 'Apply Interview'}
                      </span>
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    These apply options remain the same: Interviewer, Tutor, Tutor Verifier.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="max-w-5xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search by job title, location, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="relative">
                  <FiFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl md:hidden" />
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                    className="w-full md:w-auto pl-12 md:pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer appearance-none bg-white"
                  >
                    <option value="">All Job Types</option>
                    <option value="Internship">Internship</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
              </div>
              
              {/* Results Count */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  <strong className="text-gray-900">{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'position' : 'positions'} available
                </span>
                {(searchTerm || jobTypeFilter) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setJobTypeFilter('');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Job Listings */}
      <section className="pb-16 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading opportunities...</p>
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20">
              <FiBriefcase className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {searchTerm || jobTypeFilter ? 'No matching jobs found' : 'No positions available'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchTerm || jobTypeFilter
                  ? 'Try adjusting your search criteria or clearing the filters.'
                  : 'Check back soon for new opportunities!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                >
                  {/* Job Header */}
                  <div className="p-4 border-b border-slate-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-blue-700 transition-colors">
                          {job.jobTitle}
                        </h3>
                        {job.department && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <FiHome className="text-base" />
                            <span className="text-xs">{job.department}</span>
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getJobTypeColor(job.jobType)}`}>
                        {job.jobType}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed">
                      {job.shortDescription}
                    </p>

                    {/* Job Meta Information */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <FiMapPin className="text-blue-700" />
                        <span>{job.location}</span>
                      </div>
                      {job.releaseDate && (
                        <div className="flex items-center gap-2">
                          <FiCalendar className="text-indigo-700" />
                          <span>Posted {new Date(job.releaseDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <FiUsers className="text-amber-700" />
                        <span>{job.applicationCount || 0} applicants</span>
                      </div>
                    </div>

                    {job.expiryDate && new Date(job.expiryDate) > new Date() && (
                      <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                        <FiClock />
                        <span className="text-xs font-medium">
                          Closes on {new Date(job.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(job)}
                        className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-2.5 px-4 rounded-xl transition-all"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleApply(job)}
                        className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:shadow"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Job Details Modal */}
      {showJobDetails && selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-100/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 mt-16">
            <div className="flex items-start justify-between gap-4 p-4 sm:p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">{selectedJob.jobTitle}</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className={`px-3 py-1 rounded-full border ${getJobTypeColor(selectedJob.jobType)}`}>{selectedJob.jobType}</span>
                  {selectedJob.department && (
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {selectedJob.department}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {selectedJob.location}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowJobDetails(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
              {selectedJob.shortDescription && (
                <p className="text-sm text-slate-600 leading-relaxed">{selectedJob.shortDescription}</p>
              )}

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                {selectedJob.releaseDate && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-indigo-700" />
                    <span>Posted {new Date(selectedJob.releaseDate).toLocaleDateString()}</span>
                  </div>
                )}
                {selectedJob.expiryDate && (
                  <div className="flex items-center gap-2">
                    <FiClock className="text-amber-700" />
                    <span>Closes on {new Date(selectedJob.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <FiUsers className="text-amber-700" />
                  <span>{selectedJob.applicationCount || 0} applicants</span>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-bold text-slate-900">Description</h4>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-bold text-slate-900">Requirements</h4>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line leading-relaxed">{selectedJob.requirements}</p>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowJobDetails(false)}
                className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-2.5 px-4 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowJobDetails(false);
                  handleApply(selectedJob);
                }}
                className="flex-1 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-semibold py-2.5 px-4 rounded-xl"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor Verifier Recruitment Modal */}
      {showRecruitmentForm && (
        <div className="fixed inset-0 z-50 bg-slate-100/80 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200 mt-10">
            <div className="flex items-center justify-between gap-4 p-4 sm:p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Apply as Tutor Verifier</h3>
                <p className="mt-1 text-sm text-slate-600">Submit your verifier application. We’ll review and update your status.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecruitmentForm(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-0">
              <RecruitmentApplication />
            </div>
          </div>
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

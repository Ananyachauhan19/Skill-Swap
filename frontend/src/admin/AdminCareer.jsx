import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCalendar,
  FiMapPin,
  FiBriefcase,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiDownload
} from 'react-icons/fi';

const AdminCareer = () => {
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' or 'applications'
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingReview: 0
  });
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  
  const [formData, setFormData] = useState({
    jobTitle: '',
    jobType: 'Full-Time',
    department: '',
    location: '',
    shortDescription: '',
    description: '',
    requirements: '',
    releaseDate: '',
    expiryDate: ''
  });

  useEffect(() => {
    fetchStats();
    fetchJobs();
    fetchApplications();
  }, []);

  const getAuthConfig = () => {
    const rawToken = localStorage.getItem('token');
    const token =
      rawToken &&
      rawToken !== 'null' &&
      rawToken !== 'undefined' &&
      String(rawToken).trim() !== ''
        ? rawToken
        : null;

    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/career/admin/stats', getAuthConfig());
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/career/admin/jobs', getAuthConfig());
      const jobsData = Array.isArray(response.data?.jobs) ? response.data.jobs : [];
      setJobs(jobsData);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get('/api/career/admin/applications', getAuthConfig());
      const applicationsData = Array.isArray(response.data?.applications) ? response.data.applications : [];
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    }
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setFormData({
      jobTitle: '',
      jobType: 'Full-Time',
      department: '',
      location: '',
      shortDescription: '',
      description: '',
      requirements: '',
      releaseDate: '',
      expiryDate: ''
    });
    setShowJobModal(true);
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setFormData({
      jobTitle: job.jobTitle,
      jobType: job.jobType,
      department: job.department || '',
      location: job.location,
      shortDescription: job.shortDescription,
      description: job.description,
      requirements: job.requirements,
      releaseDate: job.releaseDate ? new Date(job.releaseDate).toISOString().split('T')[0] : '',
      expiryDate: job.expiryDate ? new Date(job.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowJobModal(true);
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingJob) {
        await axios.put(`/api/career/admin/jobs/${editingJob._id}`, formData, getAuthConfig());
      } else {
        await axios.post('/api/career/admin/jobs', formData, getAuthConfig());
      }
      
      setShowJobModal(false);
      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Error saving job:', error);
      alert(error.response?.data?.message || 'Failed to save job posting');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    
    try {
      await axios.delete(`/api/career/admin/jobs/${jobId}`, getAuthConfig());
      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job posting');
    }
  };

  const handleToggleJobStatus = async (jobId) => {
    try {
      await axios.patch(
        `/api/career/admin/jobs/${jobId}/toggle-status`,
        {},
        getAuthConfig()
      );
      fetchJobs();
      fetchStats();
    } catch (error) {
      console.error('Error toggling job status:', error);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await axios.patch(`/api/career/admin/applications/${applicationId}/status`,
        { status: newStatus },
        getAuthConfig()
      );
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !jobTypeFilter || job.jobType === jobTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Career Management</h1>
          <p className="text-gray-600 mt-2">Manage job postings and review applications</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalJobs}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FiBriefcase className="text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeJobs}</h3>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.totalApplications}</h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <FiUsers className="text-2xl text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingReview}</h3>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <FiClock className="text-2xl text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 inline-flex">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                activeTab === 'jobs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Job Postings
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-6 py-2.5 rounded-md font-medium transition-all ${
                activeTab === 'applications'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Applications ({stats.totalApplications})
            </button>
          </div>
        </div>

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
        <div>
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by job title or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="">All Types</option>
                <option value="Internship">Internship</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
              <button
                onClick={handleCreateJob}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md whitespace-nowrap font-medium"
              >
                <FiPlus className="text-lg" /> Add New Job
              </button>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Applications
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FiBriefcase className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-semibold text-gray-900">{job.jobTitle}</p>
                            {job.department && (
                              <p className="text-xs text-gray-500">{job.department}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          job.jobType === 'Internship' ? 'bg-purple-100 text-purple-700' :
                          job.jobType === 'Full-Time' ? 'bg-green-100 text-green-700' :
                          job.jobType === 'Part-Time' ? 'bg-yellow-100 text-yellow-700' :
                          job.jobType === 'Contract' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {job.jobType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <FiMapPin className="text-gray-400" />
                          {job.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
                          {job.applicationCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleJobStatus(job._id, job.isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            job.isActive ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            job.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditJob(job)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job._id)}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredJobs.length === 0 && (
              <div className="text-center py-16 bg-gray-50">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FiBriefcase className="text-3xl text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No job postings found</p>
                <p className="text-gray-500 text-sm mt-1">Create your first job posting to get started</p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Job Position
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-700 font-semibold text-sm">
                            {app.firstName[0]}{app.lastName[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-semibold text-gray-900">
                            {app.firstName} {app.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{app.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {app.jobPosting?.jobTitle || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">{app.jobPosting?.jobType}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {app.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateApplicationStatus(app._id, e.target.value)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 outline-none transition-all ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-700 focus:ring-yellow-500' :
                          app.status === 'reviewed' ? 'bg-blue-100 text-blue-700 focus:ring-blue-500' :
                          app.status === 'shortlisted' ? 'bg-purple-100 text-purple-700 focus:ring-purple-500' :
                          app.status === 'accepted' ? 'bg-green-100 text-green-700 focus:ring-green-500' :
                          'bg-red-100 text-red-700 focus:ring-red-500'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        <FiDownload className="h-4 w-4" />
                        Resume
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {applications.length === 0 && (
            <div className="text-center py-16 bg-gray-50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <FiUsers className="text-3xl text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No applications received yet</p>
              <p className="text-gray-500 text-sm mt-1">Applications will appear here once candidates apply</p>
            </div>
          )}
        </div>
        )}

        {/* Job Modal */}
        {showJobModal && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-start justify-center p-4 pt-20 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full my-4 shadow-2xl border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
              </h2>
              <p className="text-gray-600 mt-1 text-sm">Fill in the details below to create a new opportunity</p>
            </div>
            
            <form onSubmit={handleSubmitJob} className="px-6 py-5 space-y-5 bg-white max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium"
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Job Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.jobType}
                    onChange={(e) => setFormData({...formData, jobType: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium cursor-pointer"
                  >
                    <option value="Internship">Internship</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium"
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium"
                    placeholder="e.g., Remote / New York, NY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium"
                  />
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl">
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Short Description <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">(max 200 characters)</span>
                </label>
                <textarea
                  required
                  maxLength={200}
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-white hover:border-gray-300 text-gray-900 font-medium"
                  rows="2"
                  placeholder="Brief summary for job cards..."
                />
                <p className="text-xs text-gray-600 mt-1.5 font-semibold">
                  {formData.shortDescription.length}/200 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium"
                  rows="4"
                  placeholder="Detailed job description, responsibilities, etc..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Requirements <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none bg-gray-50 hover:bg-white hover:border-gray-300 text-gray-900 font-medium"
                  rows="4"
                  placeholder="List qualifications, skills, experience required..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm hover:border-gray-400 hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl text-sm"
                >
                  {loading ? '⏳ Saving...' : editingJob ? '✓ Update Job' : '✓ Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminCareer;

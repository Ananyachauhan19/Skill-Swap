import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import {
  FiUsers,
  FiClock,
  FiCheck,
  FiX,
  FiEye,
  FiSearch,
  FiUserPlus,
  FiAlertCircle,
  FiLoader,
  FiKey,
  FiFileText,
  FiArrowLeft,
  FiUser,
} from 'react-icons/fi';
import UserDetailTabContent from './UserDetailTabContent.jsx';

const RecruitmentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailTab, setDetailTab] = useState('overview');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ employeeId: '', password: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  // User details view state
  const [showingUserDetails, setShowingUserDetails] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userTabStates, setUserTabStates] = useState({});

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/recruitment/admin/applications`, {
        params: { status: statusFilter },
        withCredentials: true,
      });
      // Sort so latest applications appear first
      const sorted = [...(res.data || [])].sort((a, b) => {
        const ad = a.submittedAt || a.createdAt || a.created_at || a.updatedAt || a.updated_at;
        const bd = b.submittedAt || b.createdAt || b.created_at || b.updatedAt || b.updated_at;
        if (!ad && !bd) return 0;
        if (!ad) return 1;
        if (!bd) return -1;
        return new Date(bd).getTime() - new Date(ad).getTime();
      });
      setApplications(sorted);
      // If we have a selected app, keep it in sync with refreshed data
      if (selectedApp) {
        const updated = sorted.find((a) => a._id === selectedApp._id) || null;
        setSelectedApp(updated);
        if (!updated) setDrawerOpen(false);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!employeeForm.employeeId || !employeeForm.password) {
      alert('Please provide both Employee ID and Password');
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        `${BACKEND_URL}/api/recruitment/admin/applications/${selectedApp._id}/approve`,
        employeeForm,
        { withCredentials: true }
      );
      alert('Application approved and employee created successfully!');
      setShowApprovalModal(false);
      setEmployeeForm({ employeeId: '', password: '' });
      loadApplications();
    } catch (err) {
      console.error('Approval error:', err);
      alert(err.response?.data?.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      await axios.post(
        `${BACKEND_URL}/api/recruitment/admin/applications/${selectedApp._id}/reject`,
        { rejectionReason },
        { withCredentials: true }
      );
      alert('Application rejected successfully');
      setShowRejectionModal(false);
      setRejectionReason('');
      loadApplications();
    } catch (err) {
      console.error('Rejection error:', err);
      alert(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoadingUserDetails(true);
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
        setSelectedUserId(userId);
        setShowingUserDetails(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleBackToList = () => {
    setShowingUserDetails(false);
    setSelectedUserId(null);
    setUserDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (user) => {
    if (!user) return '?';
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) {
      return false;
    }

    if (!search.trim()) return true;

    const q = search.trim().toLowerCase();
    return (
      (app.name && app.name.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.institutionName && app.institutionName.toLowerCase().includes(q))
    );
  });

  const statusCounts = {
    all: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const renderDrawerContent = () => {
    if (!selectedApp) return null;

    const app = selectedApp;

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 p-4 bg-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              {app.user?.profilePic ? (
                <img
                  src={app.user.profilePic}
                  alt={app.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {app.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{app.name}</h3>
                
              </div>
            </div>
            <button
              onClick={() => {
                setDrawerOpen(false);
                setSelectedApp(null);
              }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Status badge */}
          <div className="flex items-center justify-between">
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                app.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : app.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {app.status.toUpperCase()}
            </div>
            {app.assignedEmployeeId && (
              <div className="px-3 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-800 border border-green-200">
                Employee ID: {app.assignedEmployeeId}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto">
            <button
              onClick={() => setDetailTab('overview')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                detailTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setDetailTab('documents')}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                detailTab === 'documents' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiFileText size={14} /> Documents
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {detailTab === 'overview' && (
            <div className="space-y-4 text-sm text-gray-800">
              {/* View User Profile Button */}
              {app.user && (app.user._id || app.user) ? (
                <button
                  onClick={() => fetchUserDetails(typeof app.user === 'object' ? app.user._id : app.user)}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <FiUser size={18} />
                  View User Profile
                </button>
              ) : (
                <div className="w-full py-2.5 px-4 bg-gray-100 text-gray-500 font-medium rounded-lg text-center text-sm border border-gray-200">
                  <FiUser size={16} className="inline mr-2" />
                  User profile not available
                </div>
              )}
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Personal & Contact</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Name:</span>{' '}
                    <span className="font-medium text-gray-900">{app.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>{' '}
                    <span className="font-medium text-gray-900">{app.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>{' '}
                    <span className="font-medium text-gray-900">{app.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Age:</span>{' '}
                    <span className="font-medium text-gray-900">{app.age}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Current Role:</span>{' '}
                    <span className="font-medium text-gray-900 capitalize">
                      {app.currentRole?.replace('-', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Institution:</span>{' '}
                    <span className="font-medium text-gray-900">{app.institutionName}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Teaching Profile</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Years of Experience:</span>{' '}
                    <span className="font-medium text-gray-900">{app.yearsOfExperience}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Classes:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {app.selectedClasses?.length ? (
                        app.selectedClasses.map((cls) => (
                          <span
                            key={cls}
                            className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                          >
                            {cls}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No classes selected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Subjects:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {app.selectedSubjects?.length ? (
                        app.selectedSubjects.map((subj) => (
                          <span
                            key={subj}
                            className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded"
                          >
                            {subj}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No subjects selected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Application Info</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Submitted:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—'}
                    </span>
                  </div>
                  {app.reviewedAt && (
                    <div>
                      <span className="text-gray-500">Reviewed:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {new Date(app.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {app.status === 'rejected' && app.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <span className="font-semibold">Rejection Reason:</span> {app.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {detailTab === 'documents' && (
            <div className="space-y-4 text-sm">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Degree Certificates</h4>
                <div className="flex flex-wrap gap-2 items-center">
                  {Array.isArray(app.degrees) && app.degrees.length > 0 ? (
                    app.degrees.map((deg, idx) => (
                      <a
                        key={`${deg.name || 'Degree'}-${idx}`}
                        href={deg.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                      >
                        <FiEye className="w-3 h-3" />
                        <span>{deg.name || `Degree ${idx + 1}`}</span>
                      </a>
                    ))
                  ) : app.degreeCertificateUrl ? (
                    <a
                      href={app.degreeCertificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                    >
                      <FiEye className="w-4 h-4" />
                      View Degree Certificate
                    </a>
                  ) : (
                    <span className="text-xs text-gray-500">No degree certificate uploaded</span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Experience Proof</h4>
                {app.proofOfExperienceUrl ? (
                  <a
                    href={app.proofOfExperienceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                    View Experience Proof
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">No experience proof uploaded</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {app.status === 'pending' && (
          <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white flex gap-3">
            <button
              onClick={() => {
                setSelectedApp(app);
                setShowRejectionModal(true);
              }}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <FiX size={16} /> Reject
            </button>
            <button
              onClick={() => {
                setSelectedApp(app);
                setShowApprovalModal(true);
              }}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
            >
              <FiCheck size={16} /> Approve
            </button>
          </div>
        )}
      </div>
    );
  };

  // Show user details view if selected
  if (showingUserDetails && selectedUserId) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        {/* Back Button Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">User Profile</h1>
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
          >
            <FiArrowLeft size={16} />
            Back to Applications
          </button>
        </div>

        {/* User Detail Content */}
        <div className="flex-1 overflow-hidden">
          {loadingUserDetails ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading user details...</p>
              </div>
            </div>
          ) : userDetails ? (
            <UserDetailTabContent
              userId={selectedUserId}
              userDetails={userDetails}
              isLoadingDetails={loadingUserDetails}
              userTabStates={userTabStates}
              setUserTabStates={setUserTabStates}
              formatDate={formatDate}
              formatDateTime={formatDateTime}
              getInitials={getInitials}
              setShowTutorFeedbackModal={() => {}}
              setShowInterviewerFeedbackModal={() => {}}
              setModalUserId={() => {}}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Failed to load user details</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pl-8 pr-4 pt-2 pb-6 max-w-7xl mx-auto flex flex-col min-h-screen">
      {/* Header Row with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        {/* Left: Heading */}
        <div className="flex-shrink-0">
          <h1 className="text-2xl font-semibold leading-tight text-gray-900 flex items-center gap-2 mb-1">
            <FiUsers className="w-7 h-7" />
            Recruitment Applications
          </h1>
          <p className="text-sm text-gray-600">Review and manage teaching staff applications</p>
        </div>

        {/* Right: Status Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', icon: FiUsers },
              { key: 'pending', label: 'Pending', icon: FiClock },
              { key: 'approved', label: 'Approved', icon: FiCheck },
              { key: 'rejected', label: 'Rejected', icon: FiX },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === key
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  {statusCounts[key]}
                </span>
              </button>
            ))}
          </div>
          <div className="w-full sm:w-56 relative">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, institution..."
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Applications List + Side Panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div
          className={`flex-shrink-0 transition-all duration-300 overflow-y-auto pr-4 ${
            drawerOpen ? 'w-[calc(100%-400px)]' : 'w-full'
          }`}
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-600">
              No applications found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const isSelected = selectedApp && selectedApp._id === app._id;
                return (
                  <div
                    key={app._id}
                    className={`bg-white rounded-xl border p-6 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-300 shadow-md bg-blue-50/40'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      setSelectedApp(app);
                      setDrawerOpen(true);
                      setDetailTab('overview');
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {app.user?.profilePic ? (
                          <img
                            src={app.user.profilePic}
                            alt={app.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                            {app.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.email}</p>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span>Age: {app.age}</span>
                            <span>•</span>
                            <span>{app.yearsOfExperience} years experience</span>
                            <span>•</span>
                            <span className="capitalize">{app.currentRole.replace('-', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : app.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {app.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className={`flex-shrink-0 bg-white border-l border-gray-200 shadow-lg transition-all duration-300 overflow-hidden ${
            drawerOpen ? 'w-[400px]' : 'w-0'
          }`}
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          {drawerOpen && selectedApp && (
            <div className="h-full w-[400px] flex flex-col overflow-hidden">
              {renderDrawerContent()}
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Approve Application</h2>
            <p className="text-gray-600 mb-6">Assign Employee ID and create account for {selectedApp.name}</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID *</label>
                <input
                  type="text"
                  value={employeeForm.employeeId}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="e.g., EMP001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Password *</label>
                <input
                  type="password"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Create password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setEmployeeForm({ employeeId: '', password: '' });
                  setSelectedApp(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <><FiLoader className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><FiUserPlus className="w-4 h-4" /> Approve & Create</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reject Application</h2>
            <p className="text-gray-600 mb-6">Provide a reason for rejecting {selectedApp.name}'s application</p>
            
            <div className="mb-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedApp(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <><FiLoader className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><FiX className="w-4 h-4" /> Reject Application</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentApplications;

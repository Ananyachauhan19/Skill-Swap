import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { 
  FiUsers, FiClock, FiCheck, FiX, FiEye, FiSearch,
  FiUserPlus, FiAlertCircle, FiLoader, FiKey 
} from 'react-icons/fi';

const RecruitmentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ employeeId: '', password: '' });
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

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
      setSelectedApp(null);
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
      setSelectedApp(null);
      loadApplications();
    } catch (err) {
      console.error('Rejection error:', err);
      alert(err.response?.data?.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <FiUsers className="w-8 h-8" />
          Recruitment Applications
        </h1>
        <p className="text-gray-600">Review and manage teaching staff applications</p>
      </div>

      {/* Status Filters + Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'all', label: 'All', icon: FiUsers },
            { key: 'pending', label: 'Pending', icon: FiClock },
            { key: 'approved', label: 'Approved', icon: FiCheck },
            { key: 'rejected', label: 'Rejected', icon: FiX },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                statusFilter === key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white/20">
                {statusCounts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="w-full md:w-64 relative">
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

      {/* Applications List */}
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
          {filteredApplications.map(app => {
            const isSelected = selectedApp && selectedApp._id === app._id;
            return (
              <div
                key={app._id}
                className={`bg-white rounded-xl border p-6 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-300 shadow-md bg-blue-50/40'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedApp(isSelected ? null : app)}
              >
                <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                    {app.name.charAt(0).toUpperCase()}
                  </div>
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
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {app.status.toUpperCase()}
                </div>
              </div>
                {isSelected && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-2">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-500 mb-1">Institution</div>
                        <div className="text-sm text-gray-900">{app.institutionName}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-500 mb-1">Submitted</div>
                        <div className="text-sm text-gray-900">{new Date(app.submittedAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-2">Classes ({app.selectedClasses.length})</div>
                        <div className="flex flex-wrap gap-1">
                          {app.selectedClasses.slice(0, 6).map((cls) => (
                            <span key={cls} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                              {cls}
                            </span>
                          ))}
                          {app.selectedClasses.length > 6 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{app.selectedClasses.length - 6}
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700 mb-2">Subjects ({app.selectedSubjects.length})</div>
                        <div className="flex flex-wrap gap-1">
                          {app.selectedSubjects.slice(0, 6).map((subj) => (
                            <span key={subj} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">
                              {subj}
                            </span>
                          ))}
                          {app.selectedSubjects.length > 6 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              +{app.selectedSubjects.length - 6}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                      {/* Degree certificates (multi-degree aware) */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-semibold text-gray-700 mr-1">Degree Certificates:</span>
                        {Array.isArray(app.degrees) && app.degrees.length > 0 ? (
                          app.degrees.map((deg, idx) => (
                            <a
                              key={`${deg.name || 'Degree'}-${idx}`}
                              href={deg.certificateUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
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
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                          >
                            <FiEye className="w-4 h-4" />
                            View Degree Certificate
                          </a>
                        ) : (
                          <span className="text-xs text-gray-500">No degree certificate uploaded</span>
                        )}
                      </div>

                      {/* Experience proof */}
                      <div className="flex items-center gap-3">
                        <a
                          href={app.proofOfExperienceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                        >
                          <FiEye className="w-4 h-4" />
                          View Experience Proof
                        </a>
                      </div>

                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApp(app);
                              setShowApprovalModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors ml-auto"
                          >
                            <FiCheck className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApp(app);
                              setShowRejectionModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}

                      {app.status === 'approved' && app.assignedEmployeeId && (
                        <div className="ml-auto px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800">
                          Employee ID: {app.assignedEmployeeId}
                        </div>
                      )}
                    </div>

                    {app.status === 'rejected' && app.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-xs font-semibold text-red-800 mb-1">Rejection Reason:</div>
                        <div className="text-sm text-red-700">{app.rejectionReason}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

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

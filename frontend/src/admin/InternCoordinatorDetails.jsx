import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { FiX, FiUser, FiMail, FiBriefcase, FiKey, FiTrash2, FiSave, FiActivity, FiClock, FiUserPlus, FiEdit3, FiTrendingUp, FiUsers, FiAward } from 'react-icons/fi';

const InternCoordinatorDetails = ({ coordinatorId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coordinator, setCoordinator] = useState(null);
  const [activities, setActivities] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    isActive: true,
  });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [coordinatorId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND_URL}/api/admin/intern-employees/${coordinatorId}/details`,
        { withCredentials: true }
      );
      setCoordinator(res.data.employee);
      setActivities(res.data.activities);
      setKpiData(res.data.kpi);
      setFormData({
        name: res.data.employee.name,
        email: res.data.employee.email,
        role: res.data.employee.role,
        isActive: res.data.employee.isActive,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await axios.put(
        `${BACKEND_URL}/api/admin/intern-employees/${coordinatorId}`,
        formData,
        { withCredentials: true }
      );
      setSuccess('Updated successfully');
      if (onUpdate) onUpdate();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await axios.post(
        `${BACKEND_URL}/api/admin/intern-employees/${coordinatorId}/reset-password`,
        { newPassword },
        { withCredentials: true }
      );
      setSuccess('Password reset successfully');
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this intern coordinator? This action cannot be undone.')) {
      return;
    }
    try {
      setSaving(true);
      await axios.delete(
        `${BACKEND_URL}/api/admin/intern-employees/${coordinatorId}`,
        { withCredentials: true }
      );
      if (onUpdate) onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Intern Coordinator Details</h2>
            <p className="text-sm text-gray-600 mt-1">{coordinator?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiUser className="inline mr-2" />
            Details & Actions
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiActivity className="inline mr-2" />
            Activity Log
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Edit Form */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Edit Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiUser className="inline mr-1" />
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiMail className="inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiBriefcase className="inline mr-1" />
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active Account
                  </label>
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <FiSave />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Reset Password */}
              <div className="bg-yellow-50 rounded-lg p-6 space-y-4 border border-yellow-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  <FiKey className="inline mr-2" />
                  Reset Password
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {saving ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>

              {/* Delete Section */}
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <h3 className="font-semibold text-red-900 mb-2">
                  <FiTrash2 className="inline mr-2" />
                  Danger Zone
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Deleting this intern coordinator will permanently remove all their data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete Coordinator'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* KPI Section */}
              {kpiData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 font-medium">Total Interns</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">{kpiData.totalInterns}</p>
                      </div>
                      <FiUsers className="text-blue-600" size={24} />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 font-medium">Active Interns</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">{kpiData.activeInterns}</p>
                      </div>
                      <FiTrendingUp className="text-green-600" size={24} />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 font-medium">Completed Interns</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">{kpiData.completedInterns}</p>
                      </div>
                      <FiAward className="text-purple-600" size={24} />
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FiClock size={16} />
                  Recent Activity
                </h3>
                
                {activities && activities.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {activities.map((activity, index) => {
                      const Icon = activity.activityType.includes('added') ? FiUserPlus : activity.activityType.includes('edited') ? FiEdit3 : FiTrash2;
                      const colorClass = activity.activityType.includes('added') ? 'text-green-600 bg-green-50' : activity.activityType.includes('edited') ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50';
                      
                      return (
                        <div
                          key={activity._id || index}
                          className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                        >
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.activityType === 'intern_added' ? 'Intern Added' : activity.activityType === 'intern_edited' ? 'Intern Updated' : 'Intern Deleted'}
                                </p>
                                {activity.internName && (
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {activity.internName} {activity.internEmployeeCode && `(${activity.internEmployeeCode})`}
                                  </p>
                                )}
                                {activity.details && typeof activity.details === 'object' && (
                                  <div className="text-xs text-gray-500 mt-2">
                                    {activity.details.changes && Array.isArray(activity.details.changes) && activity.details.changes.length > 0 ? (
                                      <div className="space-y-1">
                                        {activity.details.changes.map((change, idx) => (
                                          <p key={idx} className="ml-2">
                                            • <span className="font-medium capitalize">{change.field.replace(/([A-Z])/g, ' $1').trim()}</span>: 
                                            <span className="line-through text-red-600 mx-1">{change.oldValue}</span>
                                            →
                                            <span className="text-green-600 mx-1 font-medium">{change.newValue}</span>
                                          </p>
                                        ))}
                                      </div>
                                    ) : (
                                      Object.entries(activity.details)
                                        .filter(([k, v]) => v && k !== '_id' && k !== 'updated' && k !== 'changes' && k !== 'certificatesRegenerated')
                                        .map(([k, v]) => (
                                          <p key={k}>{k}: {typeof v === 'object' ? JSON.stringify(v) : v}</p>
                                        ))
                                    )}
                                    {activity.details.certificatesRegenerated && (
                                      <p className="text-blue-600 font-medium mt-1">
                                        ✓ Certificates regenerated
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {(() => {
                                  const date = new Date(activity.timestamp);
                                  const now = new Date();
                                  const diffMs = now - date;
                                  const diffMins = Math.floor(diffMs / 60000);
                                  const diffHours = Math.floor(diffMs / 3600000);
                                  const diffDays = Math.floor(diffMs / 86400000);
                                  if (diffMins < 1) return 'Just now';
                                  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                                  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                                  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                                  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiClock size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity recorded yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternCoordinatorDetails;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { FiX, FiUser, FiMail, FiBriefcase, FiKey, FiTrash2, FiSave, FiActivity } from 'react-icons/fi';
import QuizementEmployeeActivityLog from '../quizementEmployee/QuizementEmployeeActivityLog';

const QuizementEmployeeDetails = ({ employeeId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [activities, setActivities] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    status: 'active',
  });
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [employeeId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND_URL}/api/admin/quizement-employees/${employeeId}/details`,
        { withCredentials: true }
      );
      setEmployee(res.data.employee);
      setActivities(res.data.activities);
      setKpiData(res.data.kpi);
      setFormData({
        fullName: res.data.employee.fullName,
        email: res.data.employee.email,
        status: res.data.employee.status,
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
      await axios.put(
        `${BACKEND_URL}/api/admin/quizement-employees/${employeeId}`,
        formData,
        { withCredentials: true }
      );
      setSuccess('Employee updated successfully');
      setTimeout(() => {
        setSuccess('');
        onUpdate();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
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
      await axios.post(
        `${BACKEND_URL}/api/admin/quizement-employees/${employeeId}/reset-password`,
        { newPassword },
        { withCredentials: true }
      );
      setSuccess('Password reset successfully');
      setNewPassword('');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await axios.delete(
        `${BACKEND_URL}/api/admin/quizement-employees/${employeeId}`,
        { withCredentials: true }
      );
      onUpdate();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete employee');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quizement Employee Details</h2>
            <p className="text-sm text-gray-600 mt-1">{employee?.fullName} • {employee?.employeeId}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 flex gap-4 bg-gray-50">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
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
            className={`py-3 px-4 font-medium text-sm transition-colors border-b-2 ${
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
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Edit Form */}
              <div className="bg-blue-50 rounded-lg p-6 space-y-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  <FiUser className="inline mr-2" />
                  Employee Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
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
                  Deleting this employee will permanently remove all their data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete Employee'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <QuizementEmployeeActivityLog 
              activitiesProp={activities}
              kpiDataProp={kpiData}
              compact={true}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizementEmployeeDetails;

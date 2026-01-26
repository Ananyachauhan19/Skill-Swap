import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { FiX, FiUser, FiMail, FiKey, FiTrash2, FiActivity } from 'react-icons/fi';
import AmbassadorActivityProfile from '../components/AmbassadorActivityProfile';

const CampusAmbassadorDetails = ({ ambassadorId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ambassador, setAmbassador] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDetails();
  }, [ambassadorId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      // Fetch ambassador details from the campus ambassadors endpoint
      const res = await axios.get(
        `${BACKEND_URL}/api/admin/campus-ambassadors`,
        { withCredentials: true }
      );
      const found = res.data.ambassadors.find(a => a._id === ambassadorId);
      setAmbassador(found);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
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
        `${BACKEND_URL}/api/admin/campus-ambassadors/${ambassadorId}/reset-password`,
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
    if (!confirm('Are you sure you want to delete this campus ambassador? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      await axios.delete(
        `${BACKEND_URL}/api/admin/campus-ambassadors/${ambassadorId}`,
        { withCredentials: true }
      );
      setSuccess('Campus Ambassador deleted successfully');
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete ambassador');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!ambassador) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Campus Ambassador Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              {ambassador.firstName} {ambassador.lastName} • {ambassador.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiUser size={18} />
            Details & Actions
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
              activeTab === 'activity'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FiActivity size={18} />
            Activity Log
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">
                  <FiUser className="inline mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <p className="text-gray-900">{ambassador.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <p className="text-gray-900">{ambassador.lastName}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <p className="text-gray-900">{ambassador.email}</p>
                  </div>
                  {ambassador.username && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <p className="text-gray-900">{ambassador.username}</p>
                    </div>
                  )}
                </div>
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
                  Deleting this campus ambassador will permanently remove all their data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete Campus Ambassador'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="h-full">
              <AmbassadorActivityProfile 
                ambassadorId={ambassadorId}
                isAdminView={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusAmbassadorDetails;

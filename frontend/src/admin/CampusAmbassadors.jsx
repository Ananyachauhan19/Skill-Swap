import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Trash2, CheckCircle, XCircle, X } from 'lucide-react';
import axios from 'axios';

const CampusAmbassadors = () => {
  const [campusAmbassadors, setCampusAmbassadors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCampusAmbassadors();
  }, []);

  const fetchCampusAmbassadors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/campus-ambassadors', {
        withCredentials: true
      });

      const ambassadors = Array.isArray(response.data?.ambassadors)
        ? response.data.ambassadors
        : [];

      setCampusAmbassadors(ambassadors);
      setError(null);
    } catch (err) {
      setError('Failed to fetch campus ambassadors');
      console.error('Error fetching campus ambassadors:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeCampusAmbassador = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this Campus Ambassador?')) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/admin/users/${userId}`, {
        withCredentials: true
      });
      
      setSuccess('Campus Ambassador removed successfully!');
      setTimeout(() => setSuccess(null), 3000);
      await fetchCampusAmbassadors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove Campus Ambassador');
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createCampusAmbassador = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      console.log('Sending data:', formData);
      await axios.post(
        '/api/admin/create-campus-ambassador',
        formData,
        { withCredentials: true }
      );
      
      setSuccess('Campus Ambassador created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
      setShowCreateForm(false);
      await fetchCampusAmbassadors();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create Campus Ambassador';
      setError(errorMsg);
      console.error('Create campus ambassador error details:', {
        message: err.response?.data?.message,
        status: err.response?.status,
        data: err.response?.data,
        fullError: err
      });
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center space-x-3">
            <Shield size={32} className="text-blue-600" />
            <span>Campus Ambassadors</span>
          </h1>
          <p className="text-gray-600">Assign and manage Campus Ambassador roles for users</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <XCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
            <CheckCircle className="text-green-600" size={20} />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Current Campus Ambassadors */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Current Campus Ambassadors ({campusAmbassadors.length})
            </h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <UserPlus size={20} />
              <span>Create New Ambassador</span>
            </button>
          </div>
          
          {campusAmbassadors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield size={48} className="mx-auto mb-2 opacity-50" />
              <p>No Campus Ambassadors assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campusAmbassadors.map((user) => (
                <div key={user.userId || user._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCampusAmbassador(user._id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Remove Campus Ambassador"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">{user.email}</p>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      Campus Ambassador
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Click "Create New Ambassador" to add a new user with campus ambassador role</li>
            <li>Campus ambassadors can manage institutes and onboard students</li>
            <li>Each campus ambassador can create and manage multiple colleges/schools</li>
            <li>Only new users with unique emails can be added as campus ambassadors</li>
          </ul>
        </div>
      </div>

      {/* Create Campus Ambassador Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-800">Create Campus Ambassador</h2>
              <button 
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ firstName: '', lastName: '', email: '', password: '' });
                  setFormErrors({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={createCampusAmbassador} className="p-6 space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
                {formErrors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
                {formErrors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.lastName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ambassador@university.edu"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Login Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 6 characters"
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  User can change this password after first login
                </p>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ firstName: '', lastName: '', email: '', password: '' });
                    setFormErrors({});
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Ambassador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusAmbassadors;

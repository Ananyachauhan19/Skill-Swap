import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { FiArrowLeft, FiSave, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const NewInternEmployee = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.role || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      setError('');
      await axios.post(
        `${BACKEND_URL}/api/admin/intern-employees`,
        formData,
        { withCredentials: true }
      );
      
      setSuccess('Intern coordinator created successfully! Credentials sent via email.');
      setTimeout(() => {
        navigate('/admin/employees?tab=intern-employees');
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to create intern coordinator';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/employees?tab=intern-employees')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft size={20} />
            Back to Employees
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Intern Coordinator</h1>
          <p className="text-gray-600 mt-1">Create coordinator who can add and manage interns</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <FiAlertCircle className="text-red-600" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <FiCheckCircle className="text-green-600" size={20} />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., HR Manager, Intern Coordinator, HR Executive"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password (min 6 characters)"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Permissions:</strong> Intern Coordinators can add interns with roles, positions, joining dates, and duration. They can generate joining letters and certificates which will be automatically emailed to interns.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <FiSave size={18} />
              {saving ? 'Creating...' : 'Create Employee'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/employees?tab=intern-employees')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewInternEmployee;

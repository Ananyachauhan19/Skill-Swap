import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import {
  FiPlus,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiMail,
  FiLogOut,
  FiEdit3,
  FiTrash2,
  FiActivity,
} from 'react-icons/fi';

const InternCoordinatorDashboard = () => {
  const navigate = useNavigate();
  const [coordinator, setCoordinator] = useState(null);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get coordinator info
      const coordRes = await axios.get(`${BACKEND_URL}/api/intern-coordinator/me`, {
        withCredentials: true,
      });
      
      // Check if must change password - redirect if true
      if (coordRes.data.mustChangePassword) {
        navigate('/intern-coordinator/change-password');
        return;
      }
      
      setCoordinator(coordRes.data);

      // Get interns list
      const internsRes = await axios.get(`${BACKEND_URL}/api/intern-coordinator/interns`, {
        withCredentials: true,
      });
      setInterns(internsRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/intern-coordinator/logout`, {}, {
        withCredentials: true,
      });
      localStorage.removeItem('internEmployee');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleEditIntern = (intern) => {
    setEditingIntern(intern);
    setShowAddModal(true);
  };

  const handleDeleteIntern = async (intern) => {
    if (!confirm(`Are you sure you want to delete ${intern.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(
        `${BACKEND_URL}/api/intern-coordinator/interns/${intern._id}`,
        { withCredentials: true }
      );
      loadData(); // Reload the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete intern');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      terminated: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {status === 'active' && <FiClock className="mr-1" size={12} />}
        {status === 'completed' && <FiCheckCircle className="mr-1" size={12} />}
        {status === 'terminated' && <FiXCircle className="mr-1" size={12} />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const stats = {
    total: interns.length,
    active: interns.filter(i => i.status === 'active').length,
    completed: interns.filter(i => i.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Intern Coordinator Dashboard</h1>
              {coordinator && (
                <p className="text-sm text-gray-600 mt-1">
                  {coordinator.name} • {coordinator.role}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiLogOut size={18} />
                Logout
              </button>
              <button
                onClick={() => navigate('/intern-coordinator/activity-log')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiActivity size={18} />
                View Activity
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interns</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUsers className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Interns</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiClock className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiCheckCircle className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <FiPlus size={20} />
            Add New Intern
          </button>
        </div>

        {/* Interns Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Interns List</h2>
          </div>

          {interns.length === 0 ? (
            <div className="p-12 text-center">
              <FiUsers className="mx-auto text-gray-400" size={48} />
              <p className="mt-4 text-gray-600">No interns added yet</p>
              <p className="text-sm text-gray-500 mt-1">Click "Add New Intern" to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Intern Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Joining Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {interns.map((intern) => (
                    <tr key={intern._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{intern.name}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <FiMail size={12} />
                            {intern.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{intern.position}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {intern.internshipDuration} days
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <FiCalendar size={14} />
                          {formatDate(intern.joiningDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(intern.status)}
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {intern.internEmployeeId}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditIntern(intern)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteIntern(intern)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Intern Modal */}
      {showAddModal && (
        <AddInternModal
          editingIntern={editingIntern}
          onClose={() => {
            setShowAddModal(false);
            setEditingIntern(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingIntern(null);
            loadData();
          }}
        />
      )}
    </div>
  );
};

// Add/Edit Intern Modal Component
const AddInternModal = ({ editingIntern, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: editingIntern?.name || '',
    email: editingIntern?.email || '',
    position: editingIntern?.position || editingIntern?.role || '',
    joiningDate: editingIntern?.joiningDate ? new Date(editingIntern.joiningDate).toISOString().split('T')[0] : '',
    internshipDuration: editingIntern?.internshipDuration || '',
  });

  const isEditing = !!editingIntern;

  // Track initial data to detect changes
  const initialData = editingIntern ? {
    name: editingIntern.name,
    email: editingIntern.email,
    position: editingIntern.position || editingIntern.role,
    joiningDate: editingIntern.joiningDate ? new Date(editingIntern.joiningDate).toISOString().split('T')[0] : '',
    internshipDuration: editingIntern.internshipDuration?.toString() || '',
  } : null;

  // Check if form has changes
  const hasChanges = isEditing ? (
    formData.name !== initialData.name ||
    formData.email !== initialData.email ||
    formData.position !== initialData.position ||
    formData.joiningDate !== initialData.joiningDate ||
    formData.internshipDuration.toString() !== initialData.internshipDuration
  ) : true;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.position || !formData.joiningDate || !formData.internshipDuration) {
      setError('All required fields must be filled');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (isEditing) {
        await axios.put(
          `${BACKEND_URL}/api/intern-coordinator/interns/${editingIntern._id}`,
          {
            name: formData.name,
            email: formData.email,
            position: formData.position,
            role: formData.position,
            joiningDate: formData.joiningDate,
            internshipDuration: formData.internshipDuration,
          },
          { withCredentials: true }
        );
      } else {
        await axios.post(
          `${BACKEND_URL}/api/intern-coordinator/interns`,
          formData,
          { withCredentials: true }
        );
      }
      
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} intern`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Intern' : 'Add New Intern'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiXCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter intern's full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Frontend Developer, Backend Engineer, HR Intern"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date *
                </label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  name="internshipDuration"
                  value={formData.internshipDuration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 90"
                  min="1"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> After adding the intern, a joining letter and certificate will be automatically generated and sent to their email address.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading || (isEditing && !hasChanges)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditing ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  <FiPlus size={18} />
                  {isEditing ? 'Save Changes' : 'Add Intern'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InternCoordinatorDashboard;

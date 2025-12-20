import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaCoins } from 'react-icons/fa';
import { GiTwoCoins } from 'react-icons/gi';
import { BACKEND_URL } from '../config';

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'ONLY_SILVER',
    silverCoins: 0,
    goldenCoins: 0,
    displayOrder: 0
  });

  // Fetch all packages
  const fetchPackages = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/packages`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setPackages(data.data);
      } else {
        showMessage('error', 'Failed to load packages');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      showMessage('error', 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'ONLY_SILVER',
      silverCoins: 0,
      goldenCoins: 0,
      displayOrder: 0
    });
    setEditingPackage(null);
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setFormData({
        name: pkg.name,
        description: pkg.description,
        type: pkg.type,
        silverCoins: pkg.silverCoins,
        goldenCoins: pkg.goldenCoins,
        displayOrder: pkg.displayOrder || 0
      });
      setEditingPackage(pkg);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'silverCoins' || name === 'goldenCoins' || name === 'displayOrder'
        ? parseInt(value) || 0
        : value
    }));
  };

  const handleTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      type,
      // Reset coins based on type
      silverCoins: type === 'ONLY_GOLDEN' ? 0 : prev.silverCoins,
      goldenCoins: type === 'ONLY_SILVER' ? 0 : prev.goldenCoins
    }));
  };

  const calculatePrice = () => {
    return (formData.silverCoins * 0.25) + (formData.goldenCoins * 2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.type === 'ONLY_SILVER' && formData.silverCoins <= 0) {
      showMessage('error', 'Silver-only packages must have silver coins');
      return;
    }
    if (formData.type === 'ONLY_GOLDEN' && formData.goldenCoins <= 0) {
      showMessage('error', 'Golden-only packages must have golden coins');
      return;
    }
    if (formData.type === 'COMBO' && (formData.silverCoins <= 0 || formData.goldenCoins <= 0)) {
      showMessage('error', 'Combo packages must have both silver and golden coins');
      return;
    }

    try {
      const url = editingPackage
        ? `${BACKEND_URL}/api/admin/packages/${editingPackage._id}`
        : `${BACKEND_URL}/api/admin/packages`;
      
      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', editingPackage ? 'Package updated successfully' : 'Package created successfully');
        fetchPackages();
        handleCloseModal();
      } else {
        showMessage('error', data.message || 'Failed to save package');
      }
    } catch (error) {
      console.error('Error saving package:', error);
      showMessage('error', 'Failed to save package');
    }
  };

  const handleToggleActive = async (pkg) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/packages/${pkg._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !pkg.isActive })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', `Package ${!pkg.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchPackages();
      } else {
        showMessage('error', data.message || 'Failed to update package');
      }
    } catch (error) {
      console.error('Error toggling package:', error);
      showMessage('error', 'Failed to update package');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/packages/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Package deleted successfully');
        fetchPackages();
      } else {
        showMessage('error', data.message || 'Failed to delete package');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      showMessage('error', 'Failed to delete package');
    }
  };

  const getTypeBadge = (type) => {
    const styles = {
      ONLY_SILVER: 'bg-gray-100 text-gray-800',
      ONLY_GOLDEN: 'bg-yellow-100 text-yellow-800',
      COMBO: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[type]}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Package Management</h1>
          <p className="text-gray-600 mt-1">Create and manage skill coin packages</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
        >
          <FaPlus /> Create Package
        </button>
      </div>

      {/* Messages */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Packages List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg">No packages found</p>
          <p className="text-gray-500 text-sm mt-2">Create your first package to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className={`bg-white rounded-xl shadow-md border-2 p-6 transition-all ${
                pkg.isActive ? 'border-blue-200' : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                {getTypeBadge(pkg.type)}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    className={`p-2 rounded-lg ${
                      pkg.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={pkg.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {pkg.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                  </button>
                  <button
                    onClick={() => handleOpenModal(pkg)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(pkg._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>

              {/* Package Info */}
              <h3 className="text-xl font-bold text-gray-800 mb-2">{pkg.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>

              {/* Coins */}
              <div className="space-y-2 mb-4">
                {pkg.silverCoins > 0 && (
                  <div className="flex items-center text-gray-700">
                    <FaCoins className="text-gray-400 mr-2" />
                    <span className="font-semibold">{pkg.silverCoins} Silver Coins</span>
                  </div>
                )}
                {pkg.goldenCoins > 0 && (
                  <div className="flex items-center text-yellow-700">
                    <GiTwoCoins className="text-yellow-500 mr-2" />
                    <span className="font-semibold">{pkg.goldenCoins} Golden Coins</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ₹{pkg.priceInINR.toFixed(2)}
              </div>

              {/* Status */}
              <div className="text-sm text-gray-500">
                Status: <span className={pkg.isActive ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Package Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="ONLY_SILVER">Silver Only</option>
                    <option value="ONLY_GOLDEN">Golden Only</option>
                    <option value="COMBO">Combo (Silver + Golden)</option>
                  </select>
                </div>

                {/* Coins */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Silver Coins {formData.type !== 'ONLY_GOLDEN' && '*'}
                    </label>
                    <input
                      type="number"
                      name="silverCoins"
                      value={formData.silverCoins}
                      onChange={handleInputChange}
                      min="0"
                      disabled={formData.type === 'ONLY_GOLDEN'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      required={formData.type !== 'ONLY_GOLDEN'}
                    />
                    <p className="text-xs text-gray-500 mt-1">₹0.25 per coin</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Golden Coins {formData.type !== 'ONLY_SILVER' && '*'}
                    </label>
                    <input
                      type="number"
                      name="goldenCoins"
                      value={formData.goldenCoins}
                      onChange={handleInputChange}
                      min="0"
                      disabled={formData.type === 'ONLY_SILVER'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      required={formData.type !== 'ONLY_SILVER'}
                    />
                    <p className="text-xs text-gray-500 mt-1">₹2 per coin</p>
                  </div>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Order (Optional)
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first. Leave at 0 for newest first.</p>
                </div>

                {/* Calculated Price */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 mb-1">Calculated Price:</p>
                  <p className="text-3xl font-bold text-blue-600">₹{calculatePrice().toFixed(2)}</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    {editingPackage ? 'Update Package' : 'Create Package'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackages;

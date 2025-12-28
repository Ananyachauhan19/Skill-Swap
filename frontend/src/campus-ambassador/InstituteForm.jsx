import React, { useState } from 'react';
import { X } from 'lucide-react';

const InstituteForm = ({ onSubmit, onClose, initialData = null }) => {
  const [formData, setFormData] = useState({
    instituteName: initialData?.instituteName || '',
    instituteId: initialData?.instituteId || '',
    perStudentGoldCoins: initialData?.perStudentGoldCoins || 0,
    perStudentSilverCoins: initialData?.perStudentSilverCoins || 0,
    instituteType: initialData?.instituteType || 'college',
    campusBackgroundImage: null
  });

  const [preview, setPreview] = useState(initialData?.campusBackgroundImage || null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, campusBackgroundImage: 'File size should be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, campusBackgroundImage: file }));
      setPreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, campusBackgroundImage: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.instituteName.trim()) {
      newErrors.instituteName = 'Institute name is required';
    }
    if (!formData.instituteId.trim()) {
      newErrors.instituteId = 'Institute ID is required';
    }
    if (formData.perStudentGoldCoins < 0) {
      newErrors.perStudentGoldCoins = 'Gold coins cannot be negative';
    }
    if (formData.perStudentSilverCoins < 0) {
      newErrors.perStudentSilverCoins = 'Silver coins cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const submitData = new FormData();
    submitData.append('instituteName', formData.instituteName);
    submitData.append('instituteId', formData.instituteId.toUpperCase());
    submitData.append('perStudentGoldCoins', formData.perStudentGoldCoins);
    submitData.append('perStudentSilverCoins', formData.perStudentSilverCoins);
    submitData.append('instituteType', formData.instituteType);
    
    if (formData.campusBackgroundImage) {
      submitData.append('campusBackgroundImage', formData.campusBackgroundImage);
    }

    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {initialData ? 'Edit Institute' : 'Add New Institute'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Institute Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institute Name *
            </label>
            <input
              type="text"
              name="instituteName"
              value={formData.instituteName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter institute name"
            />
            {errors.instituteName && (
              <p className="text-red-500 text-sm mt-1">{errors.instituteName}</p>
            )}
          </div>

          {/* Institute ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institute ID * (Unique)
            </label>
            <input
              type="text"
              name="instituteId"
              value={formData.instituteId}
              onChange={handleChange}
              disabled={!!initialData}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase disabled:bg-gray-100"
              placeholder="e.g., MIT, STANFORD"
            />
            {errors.instituteId && (
              <p className="text-red-500 text-sm mt-1">{errors.instituteId}</p>
            )}
          </div>

          {/* Institute Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institute Type *
            </label>
            <select
              name="instituteType"
              value={formData.instituteType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="college">College</option>
              <option value="school">School</option>
            </select>
          </div>

          {/* Gold Coins Per Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gold Coins Per Student
            </label>
            <input
              type="number"
              name="perStudentGoldCoins"
              value={formData.perStudentGoldCoins}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.perStudentGoldCoins && (
              <p className="text-red-500 text-sm mt-1">{errors.perStudentGoldCoins}</p>
            )}
          </div>

          {/* Silver Coins Per Student */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Silver Coins Per Student
            </label>
            <input
              type="number"
              name="perStudentSilverCoins"
              value={formData.perStudentSilverCoins}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.perStudentSilverCoins && (
              <p className="text-red-500 text-sm mt-1">{errors.perStudentSilverCoins}</p>
            )}
          </div>

          {/* Campus Background Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campus Background Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.campusBackgroundImage && (
              <p className="text-red-500 text-sm mt-1">{errors.campusBackgroundImage}</p>
            )}
            {preview && (
              <div className="mt-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {initialData ? 'Update Institute' : 'Create Institute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InstituteForm;

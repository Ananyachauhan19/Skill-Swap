import React, { useState } from 'react';
import { X, Plus, Trash2, FileSpreadsheet, Upload } from 'lucide-react';

const InstituteForm = ({ onSubmit, onClose, initialData = null }) => {
  const [formData, setFormData] = useState({
    instituteName: initialData?.instituteName || '',
    instituteId: initialData?.instituteId || '',
    instituteType: initialData?.instituteType || 'college',
    campusBackgroundImage: null,
    numberOfCourses: initialData?.numberOfCourses || 0,
    courses: initialData?.courses || []
  });

  const [preview, setPreview] = useState(initialData?.campusBackgroundImage || null);
  const [errors, setErrors] = useState({});
  const [courseInput, setCourseInput] = useState('');
  const [courseFile, setCourseFile] = useState(null);

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

  const handleCourseFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        setErrors(prev => ({ ...prev, courseFile: 'Only Excel and CSV files are allowed' }));
        return;
      }
      setCourseFile(file);
      setErrors(prev => ({ ...prev, courseFile: null }));
    }
  };

  const addCourse = () => {
    if (courseInput.trim()) {
      const newCourse = courseInput.trim();
      if (!formData.courses.includes(newCourse)) {
        setFormData(prev => ({
          ...prev,
          courses: [...prev.courses, newCourse],
          numberOfCourses: prev.courses.length + 1
        }));
      }
      setCourseInput('');
    }
  };

  const removeCourse = (index) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
      numberOfCourses: prev.courses.length - 1
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.instituteName.trim()) {
      newErrors.instituteName = 'Institute name is required';
    }
    if (!formData.instituteId.trim()) {
      newErrors.instituteId = 'Institute ID is required';
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
    submitData.append('instituteType', formData.instituteType);
    submitData.append('numberOfCourses', formData.courses.length);
    submitData.append('courses', JSON.stringify(formData.courses));
    
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Institute' : 'Add New Institute'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 mb-1 text-sm flex items-center gap-2">
              📋 Institute Creation
            </h4>
            <p className="text-xs text-blue-700">
              Create your institute with basic information only. Coin assignment happens separately through Excel Upload or Distribute Coins.
            </p>
          </div>

          {/* Institute Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Institute Name *
            </label>
            <input
              type="text"
              name="instituteName"
              value={formData.instituteName}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter institute name"
            />
            {errors.instituteName && (
              <p className="text-red-500 text-xs mt-1">{errors.instituteName}</p>
            )}
          </div>

          {/* Institute ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Institute ID * (Unique)
            </label>
            <input
              type="text"
              name="instituteId"
              value={formData.instituteId}
              onChange={handleChange}
              disabled={!!initialData}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase disabled:bg-gray-100"
              placeholder="e.g., MIT, STANFORD"
            />
            {errors.instituteId && (
              <p className="text-red-500 text-xs mt-1">{errors.instituteId}</p>
            )}
          </div>

          {/* Institute Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Institute Type *
            </label>
            <select
              name="instituteType"
              value={formData.instituteType}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="college">College</option>
              <option value="school">School</option>
            </select>
          </div>

          {/* Course Management Section */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <FileSpreadsheet size={18} className="text-blue-600" />
              <h4 className="font-semibold text-gray-900 text-sm">Courses / Programs</h4>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {formData.courses.length} added
              </span>
            </div>

            {/* Manual Course Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={courseInput}
                onChange={(e) => setCourseInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCourse())}
                placeholder="Enter course name (e.g., B.Tech, MBA, BBA)"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={addCourse}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus size={16} />
                <span className="text-sm">Add</span>
              </button>
            </div>

            {/* Excel Upload Option */}
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <div className="flex-1 border-t border-gray-300"></div>
                <span>OR upload Excel file</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">Upload Excel with course names</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleCourseFileChange}
                  className="hidden"
                />
              </label>
              {courseFile && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <FileSpreadsheet size={12} />
                  {courseFile.name} selected
                </p>
              )}
              {errors.courseFile && (
                <p className="text-red-500 text-xs mt-1">{errors.courseFile}</p>
              )}
            </div>

            {/* Course List */}
            {formData.courses.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {formData.courses.map((course, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-3 py-1.5 bg-white border border-gray-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-800">{course}</span>
                    <button
                      type="button"
                      onClick={() => removeCourse(index)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.courses.length === 0 && (
              <p className="text-xs text-gray-500 text-center py-2">
                No courses added yet. Add courses manually or upload an Excel file.
              </p>
            )}
          </div>

          {/* Campus Background Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Campus Background Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.campusBackgroundImage && (
              <p className="text-red-500 text-xs mt-1">{errors.campusBackgroundImage}</p>
            )}
            {preview && (
              <div className="mt-3">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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

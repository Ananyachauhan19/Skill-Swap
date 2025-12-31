import React, { useEffect, useState } from 'react';
import { X, Trash2, FileSpreadsheet } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const InstituteForm = ({ onSubmit, onClose, initialData = null, variant = 'modal' }) => {
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
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classSearch, setClassSearch] = useState('');
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classesError, setClassesError] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);

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

  const removeCourse = (index) => {
    setFormData(prev => ({
      ...prev,
      courses: prev.courses.filter((_, i) => i !== index),
      numberOfCourses: prev.courses.length - 1
    }));
  };

  const toggleCourseFromMasterList = (courseName) => {
    const trimmed = courseName.trim();
    if (!trimmed) return;
    setFormData(prev => {
      const exists = prev.courses.includes(trimmed);
      const nextCourses = exists
        ? prev.courses.filter(c => c !== trimmed)
        : [...prev.courses, trimmed];
      return {
        ...prev,
        courses: nextCourses,
        numberOfCourses: nextCourses.length
      };
    });
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

  const isModal = variant !== 'page';

  // Load master course/class list from Google Sheet via skills API
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingClasses(true);
        setClassesError('');
        const res = await fetch(`${BACKEND_URL}/api/skills-list`);
        if (!res.ok) throw new Error('Failed to load course/class list');
        const data = await res.json();
        if (!isMounted) return;
        const classes = Array.isArray(data.classes) ? data.classes : [];
        setAvailableClasses(classes);
      } catch (err) {
        if (isMounted) {
          console.error('Error loading course/class list:', err);
          setClassesError('Unable to load master course/class list. You can still add manually.');
        }
      } finally {
        if (isMounted) {
          setLoadingClasses(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={isModal ? 'fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm' : 'w-full'}>
      <div className={isModal ? 'bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-200' : 'bg-white rounded-2xl border border-slate-200 w-full overflow-y-auto'}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? 'Edit Institute' : 'Add New Institute'}
          </h2>
          {isModal && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          )}
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
              <h4 className="font-semibold text-gray-900 text-sm">Courses / Classes</h4>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {formData.courses.length} added
              </span>
            </div>

            {/* Search & select from master list (Google Sheet) */}
            <div className="mb-3 relative">
              <p className="text-xs text-gray-600 mb-1">
                Search and add from the master course/class list (synced from Google Sheet).
              </p>
              <input
                type="text"
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                onFocus={() => setShowClassDropdown(true)}
                placeholder="Search course/class (e.g., 10th, B.Tech, MBA)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {classesError && (
                <p className="text-[11px] text-red-500 mt-1">{classesError}</p>
              )}
              {showClassDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    {loadingClasses ? (
                      <div className="px-3 py-2 text-xs text-gray-500">Loading course/class list...</div>
                    ) : availableClasses.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500">No master courses/classes available.</div>
                    ) : (
                      (classSearch
                        ? availableClasses.filter(c =>
                            c.toLowerCase().includes(classSearch.trim().toLowerCase())
                          )
                        : availableClasses
                      )
                        .slice(0, 100)
                        .map((course) => {
                          const isSelected = formData.courses.includes(course);
                          return (
                            <label
                              key={course}
                              className={`w-full px-3 py-1.5 text-xs transition flex items-center gap-2 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 cursor-pointer ${
                                isSelected ? 'bg-blue-50/80 font-medium text-blue-900' : 'text-gray-800'
                              }`}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              <input
                                type="checkbox"
                                className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={isSelected}
                                onChange={() => toggleCourseFromMasterList(course)}
                              />
                              <span className="flex-1 truncate">{course}</span>
                            </label>
                          );
                        })
                    )}
                  </div>
                  <div className="flex justify-end px-3 py-1.5 border-t border-gray-200 bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setShowClassDropdown(false)}
                      className="text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full px-3 py-1 shadow-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
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
                No courses added yet. Use the dropdown above to select courses/classes.
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

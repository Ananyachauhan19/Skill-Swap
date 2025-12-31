import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X, Plus, Trash2, Calendar, Clock, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const AssessmentUpload = ({ institutes, onUploadSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    selectedInstitutes: [],
    startTime: '',
    endTime: ''
  });
  const [collegeConfigs, setCollegeConfigs] = useState([]);
  const [instituteCourses, setInstituteCourses] = useState({}); // Stores courses for each institute
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [useAdvancedConfig, setUseAdvancedConfig] = useState(false);
  const [expandedConfig, setExpandedConfig] = useState({});

  // Fetch courses when an institute is selected
  const fetchInstituteCourses = async (instituteId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/campus-ambassador/institutes/${instituteId}/courses`,
        { withCredentials: true }
      );
      setInstituteCourses(prev => ({
        ...prev,
        [instituteId]: response.data.courses || []
      }));
    } catch (err) {
      console.error('Failed to fetch courses for institute:', instituteId, err);
      setInstituteCourses(prev => ({ ...prev, [instituteId]: [] }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setError('Only Excel and CSV files (.xlsx, .xls, .csv) are allowed');
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInstituteToggle = (instituteId) => {
    setFormData(prev => {
      const isSelected = prev.selectedInstitutes.includes(instituteId);
      const selected = isSelected
        ? prev.selectedInstitutes.filter(id => id !== instituteId)
        : [...prev.selectedInstitutes, instituteId];
      return { ...prev, selectedInstitutes: selected };
    });

    // If adding institute, fetch its courses
    if (!formData.selectedInstitutes.includes(instituteId)) {
      fetchInstituteCourses(instituteId);
      setExpandedConfig(prev => ({ ...prev, [instituteId]: true }));
    } else {
      // Remove all configs for this college when deselecting
      setCollegeConfigs(prev => 
        prev.filter(config => config.collegeId !== instituteId)
      );
      setExpandedConfig(prev => {
        const newState = { ...prev };
        delete newState[instituteId];
        return newState;
      });
    }
  };

  const addCourseConfig = (collegeId) => {
    setCollegeConfigs(prev => [
      ...prev,
      {
        collegeId,
        courseId: '',
        compulsorySemesters: []
      }
    ]);
  };

  const removeCourseConfig = (index) => {
    setCollegeConfigs(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateCollegeConfig = (index, field, value) => {
    setCollegeConfigs(prev => 
      prev.map((config, idx) => 
        idx === index
          ? { ...config, [field]: value }
          : config
      )
    );
  };

  const toggleSemester = (index, semester) => {
    setCollegeConfigs(prev => 
      prev.map((config, idx) => {
        if (idx !== index) return config;
        const semesters = config.compulsorySemesters.includes(semester)
          ? config.compulsorySemesters.filter(s => s !== semester)
          : [...config.compulsorySemesters, semester];
        return { ...config, compulsorySemesters: semesters.sort((a, b) => a - b) };
      })
    );
  };

  const getCollegeConfigs = (collegeId) => {
    return collegeConfigs.filter(c => c.collegeId === collegeId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.duration || formData.duration < 1) {
      setError('Duration must be at least 1 minute');
      return;
    }
    if (formData.selectedInstitutes.length === 0) {
      setError('Please select at least one institute');
      return;
    }
    if (!file) {
      setError('Please upload an Excel file');
      return;
    }

    // Validate configurations per institute type
    for (const instituteId of formData.selectedInstitutes) {
      const inst = institutes.find(i => i._id === instituteId);
      const isSchool = inst?.instituteType === 'school';

      const configs = collegeConfigs.filter(c => c.collegeId === instituteId);
      if (configs.length === 0) {
        setError(`Please add at least one ${isSchool ? 'class/course' : 'course'} configuration for ${inst?.instituteName || 'institute'}`);
        return;
      }

      for (const config of configs) {
        if (!config.courseId) {
          setError(`Please select a ${isSchool ? 'class/course' : 'course'} for all configurations in ${inst?.instituteName || 'institute'}`);
          return;
        }

        if (!isSchool && config.compulsorySemesters.length === 0) {
          setError(`Please select at least one compulsory semester for ${config.courseId} in ${inst?.instituteName || 'college'}`);
          return;
        }
      }
    }

    try {
      setLoading(true);

      const uploadData = new FormData();
      uploadData.append('excelFile', file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('duration', formData.duration);
      
      // Include configurations (NEW FORMAT)
      if (collegeConfigs.length > 0) {
        // We already validated per institute/type above, so send all configs
        uploadData.append('collegeConfigs', JSON.stringify(collegeConfigs));
      }
      
      // Include time window if provided
      if (formData.startTime) {
        uploadData.append('startTime', formData.startTime);
      }
      if (formData.endTime) {
        uploadData.append('endTime', formData.endTime);
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/campus-ambassador/assessments/upload`,
        uploadData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setSuccess(`Assessment "${response.data.assessment.title}" created successfully with ${response.data.assessment.questionCount} questions!`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        duration: 30,
        selectedInstitutes: [],
        startTime: '',
        endTime: ''
      });
      setFile(null);
      setCollegeConfigs([]);
      setExpandedConfig({});

      // Notify parent component
      if (onUploadSuccess) {
        setTimeout(() => onUploadSuccess(), 2000);
      }

    } catch (err) {
      console.error('Upload error:', err);
      
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        setError('Validation errors found in Excel file. Please check below.');
      } else {
        setError(err.response?.data?.message || 'Failed to upload assessment');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        'Question': 'What is the capital of France?',
        'Option A': 'London',
        'Option B': 'Paris',
        'Option C': 'Berlin',
        'Option D': 'Madrid',
        'Correct Answer': 'B',
        'Marks': 2
      },
      {
        'Question': 'Which planet is known as the Red Planet?',
        'Option A': 'Venus',
        'Option B': 'Jupiter',
        'Option C': 'Mars',
        'Option D': 'Saturn',
        'Correct Answer': 'C',
        'Marks': 2
      }
    ];

    // Convert to CSV (simplified for download)
    const headers = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks'];
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload New Assessment</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assessment Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Data Structures Mid-Term Exam"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description about the assessment..."
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duration (minutes) *
          </label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Institute Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Institutes *
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {institutes.length === 0 ? (
              <p className="text-gray-500 text-sm">No institutes found. Please create an institute first.</p>
            ) : (
              institutes.map(institute => (
                <label key={institute._id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.selectedInstitutes.includes(institute._id)}
                    onChange={() => handleInstituteToggle(institute._id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{institute.instituteName || institute.name}</span>
                  {institute.courses?.length > 0 && (
                    <span className="text-xs text-gray-400">({institute.courses.length} courses)</span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        {/* Institute Configuration */}
        {formData.selectedInstitutes.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Configure visibility & compulsory rules per institute
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-4 bg-blue-50 p-3 rounded">
              ℹ️ For colleges: pick courses and compulsory semesters (test visible to that course, compulsory only for selected semesters). For schools: pick classes/courses that should see the test as COMPULSORY; all other classes in the school will see it as OPTIONAL.
            </div>

            <div className="space-y-4">
              {formData.selectedInstitutes.map(instituteId => {
                const institute = institutes.find(i => i._id === instituteId);
                const courses = instituteCourses[instituteId] || [];
                const configs = getCollegeConfigs(instituteId);
                const isExpanded = expandedConfig[instituteId];
                const isSchool = institute?.instituteType === 'school';

                return (
                  <div key={instituteId} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* College Header */}
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedConfig(prev => ({ ...prev, [instituteId]: !isExpanded }))}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {institute?.instituteName || institute?.name}
                        </span>
                        {configs.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {configs.length} course{configs.length > 1 ? 's' : ''} configured
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>

                    {/* Expanded Config */}
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {/* Course Configurations */}
                        {configs.map((config, idx) => {
                          const configIndex = collegeConfigs.findIndex(
                            (c, i) => c.collegeId === instituteId && collegeConfigs.slice(0, i + 1).filter(x => x.collegeId === instituteId).length === idx + 1
                          );

                          return (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-semibold text-gray-700">
                                  {isSchool ? 'Class/Course Configuration' : 'Course Configuration'} #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeCourseConfig(configIndex)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Remove this course"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              {/* Course Selection */}
                              <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-600 mb-2">
                                  {isSchool ? 'Select Class/Course *' : 'Select Course *'}
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                  {isSchool
                                    ? 'Students in the selected class/course will see this test as COMPULSORY; others in the school will see it as OPTIONAL.'
                                    : 'The test will be visible to ALL semesters of this course; only selected semesters will be marked as COMPULSORY.'}
                                </p>
                                {courses.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">No courses defined for this college</p>
                                ) : (
                                  <select
                                    value={config.courseId}
                                    onChange={(e) => updateCollegeConfig(configIndex, 'courseId', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">-- Select Course --</option>
                                    {courses.map(course => (
                                      <option key={course} value={course}>{course}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              {!isSchool && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Select Compulsory Semesters *
                                  </label>
                                  <p className="text-xs text-gray-500 mb-2">
                                    Only these semesters will see the "COMPULSORY" badge
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                                      <button
                                        key={sem}
                                        type="button"
                                        onClick={() => toggleSemester(configIndex, sem)}
                                        className={`w-10 h-10 text-xs rounded-full border-2 font-semibold transition-all ${
                                          config.compulsorySemesters.includes(sem)
                                            ? 'bg-red-600 text-white border-red-600 shadow-md'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-red-400 hover:bg-red-50'
                                        }`}
                                      >
                                        {sem}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Add Course Button */}
                        <button
                          type="button"
                          onClick={() => addCourseConfig(instituteId)}
                          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={16} />
                          Add Another Course
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Window (Optional) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock size={14} className="inline mr-1" />
              Start Time (Optional)
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock size={14} className="inline mr-1" />
              End Time (Optional)
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Excel File *
          </label>
          
          <div className="mb-3">
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              📥 Download Template Excel
            </button>
          </div>

          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-3">
              {file ? (
                <>
                  <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-red-600 hover:text-red-800 text-sm underline"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-gray-500">Excel & CSV files (.xlsx, .xls, .csv) - Max 5MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">{error}</p>
              {validationErrors.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="text-xs text-red-700">• {err}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || institutes.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              <span>Create Assessment</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AssessmentUpload;

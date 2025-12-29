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
  const [universitySemesterConfig, setUniversitySemesterConfig] = useState([]);
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

    // If adding institute, fetch its courses and add default config
    if (!formData.selectedInstitutes.includes(instituteId)) {
      fetchInstituteCourses(instituteId);
      setUniversitySemesterConfig(prev => [
        ...prev,
        {
          instituteId,
          courses: [],
          semesters: [],
          isCompulsory: false
        }
      ]);
      setExpandedConfig(prev => ({ ...prev, [instituteId]: true }));
    } else {
      // Remove config when deselecting
      setUniversitySemesterConfig(prev => 
        prev.filter(config => config.instituteId !== instituteId)
      );
      setExpandedConfig(prev => {
        const newState = { ...prev };
        delete newState[instituteId];
        return newState;
      });
    }
  };

  const updateInstituteConfig = (instituteId, field, value) => {
    setUniversitySemesterConfig(prev => 
      prev.map(config => 
        config.instituteId === instituteId
          ? { ...config, [field]: value }
          : config
      )
    );
  };

  const toggleCourse = (instituteId, course) => {
    setUniversitySemesterConfig(prev => 
      prev.map(config => {
        if (config.instituteId !== instituteId) return config;
        const courses = config.courses.includes(course)
          ? config.courses.filter(c => c !== course)
          : [...config.courses, course];
        return { ...config, courses };
      })
    );
  };

  const toggleSemester = (instituteId, semester) => {
    setUniversitySemesterConfig(prev => 
      prev.map(config => {
        if (config.instituteId !== instituteId) return config;
        const semesters = config.semesters.includes(semester)
          ? config.semesters.filter(s => s !== semester)
          : [...config.semesters, semester];
        return { ...config, semesters: semesters.sort((a, b) => a - b) };
      })
    );
  };

  const getInstituteConfig = (instituteId) => {
    return universitySemesterConfig.find(c => c.instituteId === instituteId) || {
      courses: [],
      semesters: [],
      isCompulsory: false
    };
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

    // Validate advanced config if enabled
    if (useAdvancedConfig) {
      for (const config of universitySemesterConfig) {
        if (config.semesters.length === 0) {
          const inst = institutes.find(i => i._id === config.instituteId);
          setError(`Please select at least one semester for ${inst?.instituteName || 'institute'}`);
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
      uploadData.append('instituteIds', JSON.stringify(formData.selectedInstitutes));
      
      // Include advanced semester/course config if enabled
      if (useAdvancedConfig && universitySemesterConfig.length > 0) {
        uploadData.append('universitySemesterConfig', JSON.stringify(universitySemesterConfig));
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
      setUniversitySemesterConfig([]);
      setUseAdvancedConfig(false);

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

        {/* Advanced Configuration Toggle */}
        {formData.selectedInstitutes.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useAdvancedConfig}
                onChange={(e) => setUseAdvancedConfig(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <Settings size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Configure courses, semesters & compulsory settings per institute
              </span>
            </label>

            {useAdvancedConfig && (
              <div className="mt-4 space-y-4">
                {formData.selectedInstitutes.map(instituteId => {
                  const institute = institutes.find(i => i._id === instituteId);
                  const config = getInstituteConfig(instituteId);
                  const courses = instituteCourses[instituteId] || [];
                  const isExpanded = expandedConfig[instituteId];

                  return (
                    <div key={instituteId} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Institute Header */}
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedConfig(prev => ({ ...prev, [instituteId]: !isExpanded }))}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {institute?.instituteName || institute?.name}
                          </span>
                          {config.isCompulsory && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Compulsory</span>
                          )}
                          {config.semesters.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {config.semesters.length} sem
                            </span>
                          )}
                          {config.courses.length > 0 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              {config.courses.length} courses
                            </span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>

                      {/* Expanded Config */}
                      {isExpanded && (
                        <div className="p-4 space-y-4">
                          {/* Compulsory Toggle */}
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.isCompulsory}
                              onChange={(e) => updateInstituteConfig(instituteId, 'isCompulsory', e.target.checked)}
                              className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">Mark as compulsory for selected students</span>
                          </label>

                          {/* Course Selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Select Courses (leave empty for all courses)
                            </label>
                            {courses.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No courses defined for this institute</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {courses.map(course => (
                                  <button
                                    key={course}
                                    type="button"
                                    onClick={() => toggleCourse(instituteId, course)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                      config.courses.includes(course)
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                                    }`}
                                  >
                                    {course}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Semester Selection */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Select Semesters *
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(sem => (
                                <button
                                  key={sem}
                                  type="button"
                                  onClick={() => toggleSemester(instituteId, sem)}
                                  className={`w-8 h-8 text-xs rounded-full border transition-colors ${
                                    config.semesters.includes(sem)
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                  }`}
                                >
                                  {sem}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

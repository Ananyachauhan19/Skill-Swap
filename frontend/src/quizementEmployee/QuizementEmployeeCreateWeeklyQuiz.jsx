import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const QuizementEmployeeCreateWeeklyQuiz = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    isPaid: false,
    bronzeCoinCost: 0,
    silverCoinCost: 0,
    course: ''
  });
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch courses on component mount
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/api/quizement-employee/courses`,
          { withCredentials: true }
        );
        setCourses(response.data.courses || []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setCourses(['BCA', 'BSc CS', 'BCom', 'BA', 'BTech', 'MTech', 'MCA', 'MBA', 'BBA', 'BSc Maths', 'Other']);
      } finally {
        setLoadingCourses(false);
      }
    };
    
    fetchCourses();
  }, []);

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
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'bronzeCoinCost' || name === 'silverCoinCost') {
      const numValue = parseInt(value) || 0;
      setFormData(prev => ({ ...prev, [name]: Math.max(0, numValue) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationErrors([]);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.duration || formData.duration < 1) {
      setError('Duration must be at least 1 minute');
      return;
    }
    if (formData.isPaid && formData.bronzeCoinCost <= 0 && formData.silverCoinCost <= 0) {
      setError('At least one coin cost (Bronze or Silver) must be greater than 0 for paid quizzes');
      return;
    }
    if (!file) {
      setError('Please upload an Excel file');
      return;
    }

    try {
      setLoading(true);

      const uploadData = new FormData();
      uploadData.append('excelFile', file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('duration', formData.duration);
      uploadData.append('isPaid', formData.isPaid);
      uploadData.append('bronzeCoinCost', formData.bronzeCoinCost);
      uploadData.append('silverCoinCost', formData.silverCoinCost);
      uploadData.append('course', formData.course);

      const response = await axios.post(
        `${BACKEND_URL}/api/quizement-employee/weekly-quizzes`,
        uploadData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setSuccess(`Weekly Quiz "${response.data.quiz.title}" created successfully! It will expire in 7 days.`);
      
      setFormData({
        title: '',
        description: '',
        duration: 30,
        isPaid: false,
        bronzeCoinCost: 0,
        silverCoinCost: 0,
        course: ''
      });
      setFile(null);

    } catch (err) {
      console.error('Upload error:', err);
      
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        setError('Validation errors found in Excel file. Please check below.');
      } else {
        setError(err.response?.data?.message || 'Failed to upload weekly quiz');
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
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

    const headers = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks'];
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weekly_quiz_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Create Weekly Quiz</h1>
          <span className="px-2 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold">
            AUTO-EXPIRES IN 7 DAYS
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Upload questions and configure quiz settings. This quiz will automatically expire after 7 days from creation.
        </p>
      </div>

      {/* Info Banner */}
      <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-purple-900 mb-1">About Weekly Quizzes</h3>
            <p className="text-xs text-purple-700 leading-relaxed">
              Weekly quizzes are special time-limited quizzes that automatically expire after 7 days from creation. 
              They appear in a dedicated "Weekly Quiz" section on the user dashboard and are perfect for regular challenges and assessments.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Weekly Quiz</p>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-purple-950">Upload New Weekly Quiz</h2>
              <p className="mt-1 text-xs text-slate-600">Upload questions via Excel file. Quiz will be available for 7 days.</p>
            </div>

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-purple-200 bg-white hover:bg-purple-50 transition text-xs font-semibold text-purple-900"
            >
              <FileSpreadsheet size={16} className="text-purple-900" />
              Download Template
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Same form fields as regular quiz */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Weekly JavaScript Challenge"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Brief description about the weekly quiz..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Course (Optional)
            </label>
            <select
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              disabled={loadingCourses}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
            {loadingCourses && (
              <p className="text-xs text-gray-500 mt-1">Loading courses...</p>
            )}
          </div>

          {/* Paid/Free Section */}
          <div className="border border-purple-100 rounded-xl bg-purple-50/30 p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPaid"
                checked={formData.isPaid}
                onChange={handleInputChange}
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-slate-900">Paid Quiz</span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Enable this to make the quiz require coins to attempt
                </p>
              </div>
            </label>

            {formData.isPaid && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bronze Coin Cost
                    </label>
                    <input
                      type="number"
                      name="bronzeCoinCost"
                      value={formData.bronzeCoinCost}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-600 mt-1">
                      Bronze Coins required (0 to disable)
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Silver Coin Cost
                    </label>
                    <input
                      type="number"
                      name="silverCoinCost"
                      value={formData.silverCoinCost}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-600 mt-1">
                      Silver Coins required (0 to disable)
                    </p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-3">
                  <strong>Note:</strong> At least one coin type must have a value greater than 0.
                </p>
              </div>
            )}
          </div>

          {/* File Upload */}
          <div className="border border-purple-100 rounded-2xl bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-purple-100 bg-purple-50/40">
              <p className="text-sm font-semibold text-purple-950">Upload file *</p>
              <p className="mt-0.5 text-xs text-slate-600">Excel/CSV supported · Max 5MB</p>
            </div>

            <div className="p-5">
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragActive ? 'border-purple-500 bg-purple-50' : 'border-slate-300 hover:border-slate-400'
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
                        <span className="font-semibold text-purple-600">Click to upload</span> or drag and drop
                      </div>
                      <p className="text-xs text-gray-500">Excel & CSV files (.xlsx, .xls, .csv) - Max 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

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

          {success && (
            <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800 font-medium">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                <span>Create Weekly Quiz (7 Days)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizementEmployeeCreateWeeklyQuiz;

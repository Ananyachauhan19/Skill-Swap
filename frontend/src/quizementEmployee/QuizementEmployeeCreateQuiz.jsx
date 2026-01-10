import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config.js';

const QuizementEmployeeCreateQuiz = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30
  });
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

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

      const response = await axios.post(
        `${BACKEND_URL}/api/quizement-employee/quizzes`,
        uploadData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setSuccess(`Quiz "${response.data.quiz.title}" created successfully with ${response.data.quiz.questions.length} questions!`);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        duration: 30
      });
      setFile(null);

    } catch (err) {
      console.error('Upload error:', err);
      
      if (err.response?.data?.errors) {
        setValidationErrors(err.response.data.errors);
        setError('Validation errors found in Excel file. Please check below.');
      } else {
        setError(err.response?.data?.message || 'Failed to upload quiz');
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

    // Convert to CSV
    const headers = ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks'];
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => headers.map(h => `"${row[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
        <p className="text-sm text-gray-600 mt-1">Upload questions and configure quiz settings</p>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Quiz</p>
          <div className="mt-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-blue-950">Upload New Quiz</h2>
              <p className="mt-1 text-xs text-slate-600">Upload questions via Excel file. Quiz will be available to all users.</p>
            </div>

            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-blue-100 bg-white hover:bg-blue-50/40 transition text-xs font-semibold text-blue-900"
            >
              <FileSpreadsheet size={16} className="text-blue-900" />
              Download Template
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quiz Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., JavaScript Fundamentals Quiz"
              />
            </div>

            {/* Duration */}
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
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description about the quiz..."
            />
          </div>

          {/* File Upload */}
          <div className="border border-blue-100 rounded-2xl bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-blue-100 bg-blue-50/40">
              <p className="text-sm font-semibold text-blue-950">Upload file *</p>
              <p className="mt-0.5 text-xs text-slate-600">Excel/CSV supported · Max 5MB</p>
            </div>

            <div className="p-5">
              <div
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
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
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Create Quiz</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuizementEmployeeCreateQuiz;

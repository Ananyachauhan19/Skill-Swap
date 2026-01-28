import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../config';
import { FiX, FiUpload, FiCheck, FiArrowRight, FiArrowLeft } from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const JobApplicationForm = ({ job, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Details
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    
    // Step 2: Education Details
    schoolName: '',
    schoolBoard: '',
    schoolPassingYear: '',
    schoolMarks: '',
    
    intermediateName: '',
    intermediateBoard: '',
    intermediatePassingYear: '',
    intermediateMarks: '',
    
    graduationCollege: '',
    graduationDegree: '',
    graduationUniversity: '',
    graduationPassingYear: '',
    graduationMarks: '',
    
    // Optional: Post Graduation
    postGraduationCollege: '',
    postGraduationDegree: '',
    postGraduationUniversity: '',
    postGraduationPassingYear: '',
    postGraduationMarks: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        alert('Please upload only PDF files');
        return;
      }
      
      // Validate file size (1MB = 1048576 bytes)
      if (file.size > 1048576) {
        alert('File size must be less than 1MB');
        return;
      }
      
      setResumeFile(file);
    }
  };

  const uploadResume = async () => {
    if (!resumeFile) return null;
    
    setResumeUploading(true);
    try {
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      const { error } = await supabase.storage
        .from('job-resume')
        .upload(filePath, resumeFile);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('job-resume')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading resume:', error);
      throw error;
    } finally {
      setResumeUploading(false);
    }
  };

  const validateStep = () => {
    if (currentStep === 1) {
      const { firstName, lastName, email, phone, address } = formData;
      if (!firstName || !lastName || !email || !phone || !address) {
        alert('Please fill all required fields in Basic Details');
        return false;
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
      }
      
      // Phone validation (basic)
      if (phone.length < 10) {
        alert('Please enter a valid phone number');
        return false;
      }
    }
    
    if (currentStep === 2) {
      const {
        schoolName, schoolMarks,
        intermediateName, intermediateMarks,
        graduationCollege, graduationDegree, graduationMarks
      } = formData;
      
      if (!schoolName || !schoolMarks || !intermediateName || !intermediateMarks ||
          !graduationCollege || !graduationDegree || !graduationMarks) {
        alert('Please fill all required education fields (School, Intermediate, and Graduation)');
        return false;
      }
    }
    
    if (currentStep === 3) {
      if (!resumeFile) {
        alert('Please upload your resume (PDF, max 1MB)');
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    try {
      setLoading(true);
      
      // Upload resume first
      const resumeUrl = await uploadResume();
      
      if (!resumeUrl) {
        alert('Failed to upload resume. Please try again.');
        return;
      }
      
      // Submit application
      const applicationData = {
        ...formData,
        resumeUrl,
        jobPosting: job._id
      };
      
      // Get token if user is logged in
      const token = localStorage.getItem('token');
      const config = token ? {
        headers: { Authorization: `Bearer ${token}` }
      } : {};
      
      await axios.post(`${BACKEND_URL}/api/career/applications`, applicationData, config);
      
      alert('Application submitted successfully!');
      
      // Call onSuccess callback to refresh applications
      if (onSuccess) {
        await onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-100/80 backdrop-blur-sm flex items-start justify-center pt-20 pb-6 px-3 sm:px-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-3xl w-full max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">Apply for {job.jobTitle}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">{job.location} • {job.jobType}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <FiX className="text-xl text-slate-500" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-4 sm:px-5 py-4 bg-slate-50">
            <div className="flex items-center justify-between max-w-xl mx-auto">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex items-center">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      currentStep >= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {currentStep > step ? <FiCheck /> : step}
                    </div>
                    <span className={`ml-2 text-xs font-semibold hidden sm:block ${
                      currentStep >= step ? 'text-blue-700' : 'text-slate-500'
                    }`}>
                      {step === 1 ? 'Basic Details' : step === 2 ? 'Education' : 'Resume'}
                    </span>
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${
                      currentStep > step ? 'bg-blue-600' : 'bg-slate-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="px-4 sm:px-5 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address *
                </label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Your full address"
                />
              </div>
            </div>
          )}

          {/* Step 2: Education Details */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Education Details</h3>
              
              {/* School/10th */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">School (10th Standard) *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      name="schoolName"
                      required
                      value={formData.schoolName}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="School Name"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="schoolBoard"
                      value={formData.schoolBoard}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Board (e.g., CBSE, ICSE)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="schoolPassingYear"
                      value={formData.schoolPassingYear}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Passing Year"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="schoolMarks"
                      required
                      value={formData.schoolMarks}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Percentage / CGPA"
                    />
                  </div>
                </div>
              </div>

              {/* Intermediate/12th */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Intermediate (12th Standard) *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      name="intermediateName"
                      required
                      value={formData.intermediateName}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="School/College Name"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="intermediateBoard"
                      value={formData.intermediateBoard}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Board (e.g., CBSE, State Board)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="intermediatePassingYear"
                      value={formData.intermediatePassingYear}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Passing Year"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="intermediateMarks"
                      required
                      value={formData.intermediateMarks}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Percentage / CGPA"
                    />
                  </div>
                </div>
              </div>

              {/* Graduation */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Graduation *</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      name="graduationCollege"
                      required
                      value={formData.graduationCollege}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="College Name"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="graduationDegree"
                      required
                      value={formData.graduationDegree}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Degree (e.g., B.Tech, B.Sc)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="graduationUniversity"
                      value={formData.graduationUniversity}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="University"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="graduationPassingYear"
                      value={formData.graduationPassingYear}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Passing Year"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="graduationMarks"
                      required
                      value={formData.graduationMarks}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Percentage / CGPA"
                    />
                  </div>
                </div>
              </div>

              {/* Post Graduation (Optional) */}
              <div>
                <h4 className="text-xs font-semibold text-slate-700 mb-2">Post Graduation (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      name="postGraduationCollege"
                      value={formData.postGraduationCollege}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="College Name"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="postGraduationDegree"
                      value={formData.postGraduationDegree}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Degree (e.g., M.Tech, MBA)"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="postGraduationUniversity"
                      value={formData.postGraduationUniversity}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="University"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="postGraduationPassingYear"
                      value={formData.postGraduationPassingYear}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Passing Year"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      name="postGraduationMarks"
                      value={formData.postGraduationMarks}
                      onChange={handleInputChange}
                      className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Percentage / CGPA"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Resume Upload */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Upload Resume</h3>
              
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-white">
                <FiUpload className="mx-auto text-4xl text-slate-400 mb-3" />
                <p className="text-sm text-slate-600 mb-2">Upload your resume (PDF only, max 1MB)</p>
                
                {resumeFile ? (
                  <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <p className="text-emerald-800 font-semibold text-sm flex items-center justify-center gap-2">
                      <FiCheck className="text-lg" />
                      {resumeFile.name}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      {(resumeFile.size / 1024).toFixed(2)} KB
                    </p>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="mt-2 text-xs font-semibold text-rose-600 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors text-sm font-semibold">
                    Choose File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-4">
                <h4 className="text-xs font-bold text-slate-900 mb-2">Requirements</h4>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• File format: PDF only</li>
                  <li>• Maximum file size: 1MB</li>
                  <li>• Make sure your resume includes your contact information</li>
                  <li>• Keep it professional and up-to-date</li>
                </ul>
              </div>
            </div>
          )}

          </div>

          {/* Sticky footer buttons */}
          <div className="px-4 sm:px-5 py-4 border-t border-slate-200 bg-white flex justify-between">
            <button
              type="button"
              onClick={currentStep === 1 ? onClose : handleBack}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold"
            >
              {currentStep === 1 ? <FiX /> : <FiArrowLeft />}
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                Next
                <FiArrowRight />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || resumeUploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm font-semibold"
              >
                {loading || resumeUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {resumeUploading ? 'Uploading Resume...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationForm;

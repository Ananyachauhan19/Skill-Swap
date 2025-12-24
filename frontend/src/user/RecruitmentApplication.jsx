import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { 
  FiUser, FiMail, FiCalendar, FiBriefcase, FiBook, 
  FiAward, FiUpload, FiCheck, FiX, FiAlertCircle, FiLoader, FiPhone 
} from 'react-icons/fi';

const RecruitmentApplication = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [existingApplication, setExistingApplication] = useState(null);
  const [classOptions, setClassOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [classSubjectMap, setClassSubjectMap] = useState({});
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [degreeOptions, setDegreeOptions] = useState([]);
  const [degreeDropdownOpen, setDegreeDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    age: '',
    phone: '',
    currentRole: '',
    institutionName: '',
    yearsOfExperience: '',
    selectedClasses: [],
    selectedSubjects: [],
    selectedDegrees: [],
    degreeCertificates: {}, // map degree name -> File
    proofOfExperience: null,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load class/subject options from CSV-driven skills API
    const loadOptions = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/skills-list`);
        const data = res.data || {};

        const classes = Array.isArray(data.classes) ? data.classes : [];
        const subjectsByClass = data.subjectsByClass || {};
        const degrees = Array.isArray(data.degrees) ? data.degrees : [];

        // Build a flat, sorted subject list from subjectsByClass
        const subjectSet = new Set();
        Object.values(subjectsByClass).forEach((arr) => {
          (arr || []).forEach((s) => {
            if (s) subjectSet.add(s);
          });
        });

        setClassOptions(classes);
        setSubjectOptions(Array.from(subjectSet).sort());
        setClassSubjectMap(subjectsByClass);
        setDegreeOptions(degrees);
      } catch (err) {
        console.error('Failed to load class/subject options from CSV skills API:', err);
      }
    };

    // Check for existing application
    const checkExisting = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/recruitment/my-applications`, {
          withCredentials: true,
        });
        const pending = res.data.find(app => app.status === 'pending');
        if (pending) {
          setExistingApplication(pending);
        }
      } catch (err) {
        console.error('Error checking existing application:', err);
      }
    };

    loadOptions();
    checkExisting();
  }, [user, navigate]);

  useEffect(() => {
    if (user && user.phone) {
      setForm(prev => ({ ...prev, phone: user.phone }));
    }
  }, [user]);

  const filteredSubjects = useMemo(() => {
    if (form.selectedClasses.length === 0) {
      return [];
    }
    const subjectSet = new Set();
    form.selectedClasses.forEach(cls => {
      const subjects = classSubjectMap[cls] || [];
      subjects.forEach(subj => subjectSet.add(subj));
    });
    return Array.from(subjectSet).sort();
  }, [form.selectedClasses, classSubjectMap]);

  useEffect(() => {
    // Clear invalid subjects when classes change
    if (form.selectedClasses.length > 0 && form.selectedSubjects.length > 0) {
      const validSubjects = form.selectedSubjects.filter(subj => filteredSubjects.includes(subj));
      if (validSubjects.length !== form.selectedSubjects.length) {
        setForm(prev => ({ ...prev, selectedSubjects: validSubjects }));
      }
    }
  }, [form.selectedClasses, form.selectedSubjects, filteredSubjects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'proofOfExperience' && files && files[0]) {
      setForm(prev => ({ ...prev, proofOfExperience: files[0] }));
    }
  };

  const handleClassToggle = (cls) => {
    setForm(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(cls)
        ? prev.selectedClasses.filter(c => c !== cls)
        : [...prev.selectedClasses, cls]
    }));
  };

  const handleSubjectToggle = (subj) => {
    setForm(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subj)
        ? prev.selectedSubjects.filter(s => s !== subj)
        : [...prev.selectedSubjects, subj]
    }));
  };

  const handleDegreeToggle = (degree) => {
    setForm(prev => {
      const exists = prev.selectedDegrees.includes(degree);
      const selectedDegrees = exists
        ? prev.selectedDegrees.filter(d => d !== degree)
        : [...prev.selectedDegrees, degree];
      // When a degree is unselected, also remove its file reference
      const degreeCertificates = { ...prev.degreeCertificates };
      if (!exists) {
        return { ...prev, selectedDegrees, degreeCertificates };
      }
      delete degreeCertificates[degree];
      return { ...prev, selectedDegrees, degreeCertificates };
    });
  };

  const handleDegreeFileChange = (degree, file) => {
    if (!file) return;
    setForm(prev => ({
      ...prev,
      degreeCertificates: {
        ...prev.degreeCertificates,
        [degree]: file,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (!form.phone) {
        throw new Error('Please provide your phone number');
      }
      if (form.selectedClasses.length === 0) {
        throw new Error('Please select at least one class/course');
      }
      if (form.selectedSubjects.length === 0) {
        throw new Error('Please select at least one subject');
      }
      if (form.selectedDegrees.length === 0) {
        throw new Error('Please select at least one degree');
      }
      const missingDegreeFiles = form.selectedDegrees.filter(d => !form.degreeCertificates[d]);
      if (missingDegreeFiles.length > 0) {
        throw new Error('Please upload a PDF for each selected degree');
      }
      if (!form.proofOfExperience) {
        throw new Error('Please upload proof of experience');
      }

      const formData = new FormData();
      formData.append('age', form.age);
      formData.append('currentRole', form.currentRole);
      formData.append('institutionName', form.institutionName);
      formData.append('yearsOfExperience', form.yearsOfExperience);
      formData.append('phone', form.phone);
      formData.append('selectedClasses', JSON.stringify(form.selectedClasses));
      formData.append('selectedSubjects', JSON.stringify(form.selectedSubjects));
      formData.append('degrees', JSON.stringify(form.selectedDegrees));
      form.selectedDegrees.forEach((degree) => {
        const file = form.degreeCertificates[degree];
        if (file) {
          formData.append('degreeCertificates', file);
        }
      });
      formData.append('proofOfExperience', form.proofOfExperience);

      await axios.post(`${BACKEND_URL}/api/recruitment/submit`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Application submitted successfully! We will review it and get back to you soon.');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20 pt-20 sm:pt-24 pb-8 sm:pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Application Already Submitted</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
                You have a pending recruitment application. We are reviewing it and will get back to you soon.
              </p>
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs sm:text-sm font-medium text-yellow-800">
                Status: <span className="ml-2 capitalize">{existingApplication.status}</span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white text-sm sm:text-base rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-blue-100/20 pt-20 sm:pt-22 pb-4 sm:pb-6 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg sm:rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 text-white">
            <h1 className="text-base sm:text-lg md:text-xl font-bold mb-0.5 sm:mb-1">Join Our Teaching Team</h1>
            <p className="text-xs sm:text-sm text-blue-100">Apply to become a tutor application verifier</p>
          </div>

          <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FiUser className="w-3 h-3" /> Full Name
                </label>
                <input
                  type="text"
                  value={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                  disabled
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FiMail className="w-3 h-3" /> Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FiPhone className="w-3 h-3" /> Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={Boolean(user.phone)}
                  required={!user.phone}
                  className={`w-full px-2.5 py-1.5 text-xs border rounded-md focus:ring-1 focus:border-blue-800 focus:ring-blue-200 outline-none transition-all ${
                    user.phone
                      ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed'
                      : 'border-gray-300'
                  }`}
                  placeholder={user.phone ? undefined : 'Phone number'}
                />
                {user.phone && (
                  <p className="mt-0.5 text-[10px] text-gray-500">Verified</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FiCalendar className="w-3 h-3" /> Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  min="18"
                  max="100"
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-200 focus:border-blue-800 outline-none transition-all"
                  placeholder="Age"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FiBriefcase className="w-3 h-3" /> Role *
                </label>
                <select
                  name="currentRole"
                  value={form.currentRole}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-200 focus:border-blue-800 outline-none transition-all"
                >
                  <option value="">Select role</option>
                  <option value="school-teacher">School Teacher</option>
                  <option value="college-faculty">College Faculty</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FiBook className="w-3 h-3" /> Institution *
                </label>
                <input
                  type="text"
                  name="institutionName"
                  value={form.institutionName}
                  onChange={handleChange}
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-200 focus:border-blue-800 outline-none transition-all"
                  placeholder="School/college name"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                  <FiAward className="w-3 h-3" /> Experience (Years) *
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  required
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-200 focus:border-blue-800 outline-none transition-all"
                  placeholder="5 or 5.5"
                />
              </div>
            </div>

            {/* Classes Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Classes/Courses * ({form.selectedClasses.length})
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setClassDropdownOpen((open) => !open)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700 hover:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-200">
                >
                    <span className="truncate">
                      {form.selectedClasses.length === 0
                        ? 'Select'
                        : form.selectedClasses.slice(0, 1).join(', ') +
                          (form.selectedClasses.length > 1
                            ? ` +${form.selectedClasses.length - 1}`
                            : '')}
                    </span>
                    <span className="ml-1 text-gray-400 text-[10px]">{classDropdownOpen ? '▲' : '▼'}</span>
                  </button>

                  {classDropdownOpen && (
                    <div className="absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {classOptions.length === 0 ? (
                        <div className="px-2.5 py-1.5 text-[11px] text-gray-500">Loading...</div>
                      ) : (
                        classOptions.map((cls) => (
                          <label
                            key={cls}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-blue-50 cursor-pointer text-[11px]"
                          >
                            <input
                              type="checkbox"
                              checked={form.selectedClasses.includes(cls)}
                              onChange={() => handleClassToggle(cls)}
                              className="w-3 h-3 rounded border-gray-300 text-blue-800 focus:ring-blue-200"
                            />
                            <span className="text-gray-700">{cls}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Subjects * ({form.selectedSubjects.length})
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSubjectDropdownOpen((open) => !open)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700 hover:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={form.selectedClasses.length === 0}
                  >
                    <span className="truncate">
                      {form.selectedClasses.length === 0
                        ? 'Select class first'
                        : form.selectedSubjects.length === 0
                          ? 'Select'
                          : form.selectedSubjects.slice(0, 1).join(', ') +
                            (form.selectedSubjects.length > 1
                              ? ` +${form.selectedSubjects.length - 1}`
                              : '')}
                    </span>
                    <span className="ml-1 text-gray-400 text-[10px]">
                      {subjectDropdownOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {subjectDropdownOpen && (
                    <div className="absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {form.selectedClasses.length === 0 ? (
                        <div className="px-2.5 py-1.5 text-[11px] text-amber-600 bg-amber-50">
                          Select class first
                        </div>
                      ) : filteredSubjects.length === 0 ? (
                        <div className="px-2.5 py-1.5 text-[11px] text-gray-500">
                          No subjects found
                        </div>
                      ) : (
                        filteredSubjects.map((subj) => (
                          <label
                            key={subj}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-blue-50 cursor-pointer text-[11px]"
                          >
                            <input
                              type="checkbox"
                              checked={form.selectedSubjects.includes(subj)}
                              onChange={() => handleSubjectToggle(subj)}
                              className="w-3 h-3 rounded border-gray-300 text-blue-800 focus:ring-blue-200"
                            />
                            <span className="text-gray-700">{subj}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1 block">
                  Degrees * ({form.selectedDegrees.length})
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDegreeDropdownOpen((open) => !open)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 border border-gray-300 rounded-md bg-white text-xs text-gray-700 hover:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  >
                    <span className="truncate">
                      {degreeOptions.length === 0
                        ? 'Loading...'
                        : form.selectedDegrees.length === 0
                          ? 'Select'
                          : form.selectedDegrees.slice(0, 1).join(', ') +
                            (form.selectedDegrees.length > 1
                              ? ` +${form.selectedDegrees.length - 1}`
                              : '')}
                    </span>
                    <span className="ml-1 text-gray-400 text-[10px]">{degreeDropdownOpen ? '▲' : '▼'}</span>
                  </button>

                  {degreeDropdownOpen && (
                    <div className="absolute z-20 mt-0.5 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {degreeOptions.length === 0 ? (
                        <div className="px-2.5 py-1.5 text-[11px] text-gray-500">No degrees</div>
                      ) : (
                        degreeOptions.map((deg) => (
                          <label
                            key={deg}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-blue-50 cursor-pointer text-[11px]"
                          >
                            <input
                              type="checkbox"
                              checked={form.selectedDegrees.includes(deg)}
                              onChange={() => handleDegreeToggle(deg)}
                              className="w-3 h-3 rounded border-gray-300 text-blue-800 focus:ring-blue-200"
                            />
                            <span className="text-gray-700">{deg}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-2.5">
              {/* Per-degree certificate uploads */}
              {form.selectedDegrees.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {form.selectedDegrees.map((deg) => (
                    <div key={deg}>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                        <FiUpload className="w-3 h-3" /> {deg.length > 20 ? deg.substring(0, 20) + '...' : deg} *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleDegreeFileChange(deg, e.target.files && e.target.files[0])}
                        className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-200 focus:border-blue-800 outline-none transition-all file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-800 file:font-semibold file:text-[10px] hover:file:bg-blue-100"
                      />
                      {form.degreeCertificates[deg] && (
                        <p className="mt-0.5 text-[10px] text-green-600 flex items-center gap-1">
                          <FiCheck className="w-2.5 h-2.5" /> Uploaded
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Proof of experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                    <FiUpload className="w-3 h-3" /> Proof of Employment *
                  </label>
                  <input
                    type="file"
                    name="proofOfEmployement"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                    className="w-full px-2 py-1 text-[10px] border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-200 focus:border-blue-800 outline-none transition-all file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-800 file:font-semibold file:text-[10px] hover:file:bg-blue-100"
                  />
                  {form.proofOfExperience && (
                    <p className="mt-0.5 text-[10px] text-green-600 flex items-center gap-1">
                      <FiCheck className="w-2.5 h-2.5" /> Uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-2 flex items-start gap-1.5">
                <FiX className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-800">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-md p-2 flex items-start gap-1.5">
                <FiCheck className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-green-800">{message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-xs text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-blue-800 to-blue-900 hover:from-blue-900 hover:to-blue-950 text-white rounded-md font-semibold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="w-3.5 h-3.5" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecruitmentApplication;

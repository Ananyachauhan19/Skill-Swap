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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Already Submitted</h2>
              <p className="text-gray-600 mb-4">
                You have a pending recruitment application. We are reviewing it and will get back to you soon.
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-medium text-yellow-800">
                Status: <span className="ml-2 capitalize">{existingApplication.status}</span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Join Our Teaching Team</h1>
            <p className="text-blue-100">Apply to become a tutor application verifier</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FiUser className="w-4 h-4" /> Full Name
                </label>
                <input
                  type="text"
                  value={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FiMail className="w-4 h-4" /> Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FiPhone className="w-4 h-4" /> Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={Boolean(user.phone)}
                  required={!user.phone}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 outline-none transition-all ${
                    user.phone
                      ? 'border-gray-300 bg-gray-50 text-gray-600 cursor-not-allowed'
                      : 'border-gray-300'
                  }`}
                  placeholder={user.phone ? undefined : 'Enter your phone number'}
                />
                {user.phone && (
                  <p className="mt-1 text-xs text-gray-500">Using your verified account phone number.</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FiCalendar className="w-4 h-4" /> Age *
                </label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  min="18"
                  max="100"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FiBriefcase className="w-4 h-4" /> Current Role *
                </label>
                <select
                  name="currentRole"
                  value={form.currentRole}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select role</option>
                  <option value="school-teacher">School Teacher</option>
                  <option value="college-faculty">College Faculty</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FiBook className="w-4 h-4" /> Institution Name *
                </label>
                <input
                  type="text"
                  name="institutionName"
                  value={form.institutionName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Your school/college name"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <FiAward className="w-4 h-4" /> Years of Experience *
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={form.yearsOfExperience}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="E.g., 5 or 5.5"
                />
              </div>
            </div>

            {/* Classes Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Select Classes/Courses * ({form.selectedClasses.length} selected)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setClassDropdownOpen((open) => !open)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="truncate">
                    {form.selectedClasses.length === 0
                      ? 'Select classes/courses'
                      : form.selectedClasses.slice(0, 2).join(', ') +
                        (form.selectedClasses.length > 2
                          ? ` +${form.selectedClasses.length - 2} more`
                          : '')}
                  </span>
                  <span className="ml-2 text-gray-400 text-xs">{classDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {classDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {classOptions.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">Loading classes...</div>
                    ) : (
                      classOptions.map((cls) => (
                        <label
                          key={cls}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedClasses.includes(cls)}
                            onChange={() => handleClassToggle(cls)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{cls}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subjects Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Select Subjects * ({form.selectedSubjects.length} selected)
                {form.selectedClasses.length > 0 && (
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (filtered by selected classes)
                  </span>
                )}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSubjectDropdownOpen((open) => !open)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={form.selectedClasses.length === 0}
                >
                  <span className="truncate">
                    {form.selectedClasses.length === 0
                      ? 'Select at least one class first'
                      : form.selectedSubjects.length === 0
                        ? 'Select subjects'
                        : form.selectedSubjects.slice(0, 2).join(', ') +
                          (form.selectedSubjects.length > 2
                            ? ` +${form.selectedSubjects.length - 2} more`
                            : '')}
                  </span>
                  <span className="ml-2 text-gray-400 text-xs">
                    {subjectDropdownOpen ? '▲' : '▼'}
                  </span>
                </button>

                {subjectDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {form.selectedClasses.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-amber-600 bg-amber-50">
                        Please select at least one class first
                      </div>
                    ) : filteredSubjects.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No subjects found for selected classes
                      </div>
                    ) : (
                      filteredSubjects.map((subj) => (
                        <label
                          key={subj}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedSubjects.includes(subj)}
                            onChange={() => handleSubjectToggle(subj)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{subj}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Degrees Selection */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Select Degrees * ({form.selectedDegrees.length} selected)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDegreeDropdownOpen((open) => !open)}
                  className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="truncate">
                    {degreeOptions.length === 0
                      ? 'Loading degrees...'
                      : form.selectedDegrees.length === 0
                        ? 'Select degrees'
                        : form.selectedDegrees.slice(0, 2).join(', ') +
                          (form.selectedDegrees.length > 2
                            ? ` +${form.selectedDegrees.length - 2} more`
                            : '')}
                  </span>
                  <span className="ml-2 text-gray-400 text-xs">{degreeDropdownOpen ? '▲' : '▼'}</span>
                </button>

                {degreeDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {degreeOptions.length === 0 ? (
                      <div className="px-4 py-2 text-sm text-gray-500">No degrees configured</div>
                    ) : (
                      degreeOptions.map((deg) => (
                        <label
                          key={deg}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedDegrees.includes(deg)}
                            onChange={() => handleDegreeToggle(deg)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{deg}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* File Uploads */}
            <div className="space-y-6">
              {/* Per-degree certificate uploads */}
              {form.selectedDegrees.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {form.selectedDegrees.map((deg) => (
                    <div key={deg}>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <FiUpload className="w-4 h-4" /> {deg} Certificate (PDF) *
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleDegreeFileChange(deg, e.target.files && e.target.files[0])}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                      />
                      {form.degreeCertificates[deg] && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <FiCheck className="w-3 h-3" /> {form.degreeCertificates[deg].name}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Proof of experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                    <FiUpload className="w-4 h-4" /> Proof of Employement (PDF) *
                  </label>
                  <input
                    type="file"
                    name="proofOfEmployement"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
                  />
                  {form.proofOfExperience && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <FiCheck className="w-3 h-3" /> {form.proofOfExperience.name}
                    </p>
                  )}
                </div>

                <div />
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <FiX className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <FiCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    Submit Application
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

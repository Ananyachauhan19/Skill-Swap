import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Static suggestion lists (could be fetched later)
const ORG_SUGGESTIONS = [
  'Google','Microsoft','Amazon','Meta','Netflix','Salesforce','Adobe','Oracle','IBM','Intel','Uber','Stripe','Airbnb','Infosys','TCS','Wipro','Accenture','Cognizant','IIT Bombay','IIT Delhi','IIT Kanpur','IIT Kharagpur','IIT Madras','BITS Pilani','NIT Trichy','NIT Surathkal','Stanford University','MIT','Harvard University'
];
const ROLE_SUGGESTIONS = [ 'Intern','Junior Developer','Developer','Senior Developer','Lead','Manager','HR','Recruiter','Architect','Director' ];
const QUALIFICATIONS = [ 'BTech','MTech','BCA','MCA','BSc','MSc','MBA','PhD' ];

const capitalizeWords = (v) => v.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1));

const RegisterInterviewer = () => {
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  // Form state
  const [name, setName] = useState(user ? capitalizeWords(`${user.firstName || ''} ${user.lastName || ''}`.trim()) : '');
  const [company, setCompany] = useState(''); // Organization / University
  const [showOrgList, setShowOrgList] = useState(false);
  const [position, setPosition] = useState(''); // Designation
  const [showRoleList, setShowRoleList] = useState(false);
  const [experienceYears, setExperienceYears] = useState('');
  const [age, setAge] = useState('');
  const [totalPastInterviews, setTotalPastInterviews] = useState('');
  const [qualification, setQualification] = useState('');
  const [showQualList, setShowQualList] = useState(false);
  const [resume, setResume] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [application, setApplication] = useState(null);

  const orgBoxRef = useRef(null);
  const roleBoxRef = useRef(null);
  const qualBoxRef = useRef(null);
  const dragRef = useRef(null);

  // Fetch existing application
  useEffect(() => {
    (async () => {
      try {
        setAppLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/interview/application`, { credentials: 'include' });
        if (!res.ok) { setApplication(null); return; }
        const data = await res.json();
        if (data) {
          setApplication(data);
          if (data.name) setName(capitalizeWords(data.name));
          if (data.company) setCompany(data.company);
          if (data.position) setPosition(data.position);
          if (data.experience) {
            // Attempt to parse numeric years
            const yrs = parseInt(String(data.experience).match(/\d+/));
            if (!isNaN(yrs)) setExperienceYears(String(yrs));
          }
          if (typeof data.totalPastInterviews === 'number') setTotalPastInterviews(String(data.totalPastInterviews));
          if (data.qualification) setQualification(data.qualification);
        }
      } catch (e) {
        console.error('Failed to fetch existing application', e);
      } finally {
        setAppLoading(false);
      }
    })();
  }, []);

  // Filtered suggestions
  const filteredOrgs = useMemo(() => {
    if (!company.trim()) return ORG_SUGGESTIONS.slice(0, 8);
    return ORG_SUGGESTIONS.filter(o => o.toLowerCase().includes(company.toLowerCase())).slice(0, 8);
  }, [company]);
  const filteredRoles = useMemo(() => {
    if (!position.trim()) return ROLE_SUGGESTIONS.slice(0, 8);
    return ROLE_SUGGESTIONS.filter(r => r.toLowerCase().includes(position.toLowerCase())).slice(0, 8);
  }, [position]);
  const filteredQuals = useMemo(() => {
    if (!qualification.trim()) return QUALIFICATIONS.slice(0, 8);
    return QUALIFICATIONS.filter(q => q.toLowerCase().includes(qualification.toLowerCase())).slice(0, 8);
  }, [qualification]);

  // Validation
  const validations = {
    name: name.trim().length >= 2,
    company: company.trim().length >= 2,
    position: position.trim().length >= 2,
    experienceYears: (() => { const v = Number(experienceYears); return !isNaN(v) && v >= 0 && v <= 50; })(),
    age: (() => { const v = Number(age); return !isNaN(v) && v >= 18 && v <= 80; })(),
    totalPastInterviews: (() => { const v = Number(totalPastInterviews); return !isNaN(v) && v >= 0 && v <= 10000; })(),
    qualification: qualification.trim().length >= 2,
    resume: !!resume && resume.type === 'application/pdf' && resume.size <= 2 * 1024 * 1024,
  };
  const allValid = Object.values(validations).every(Boolean) && !loading;

  // Resume selection / drag-drop
  const onResumeFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setResume(null); setResumeError('File must be a PDF'); return; }
    if (file.size > 2 * 1024 * 1024) { setResume(null); setResumeError('Max size 2MB'); return; }
    setResumeError('');
    setResume(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    onResumeFile(file);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); dragRef.current?.classList.add('ring-2','ring-blue-400'); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); dragRef.current?.classList.remove('ring-2','ring-blue-400'); };

  const handleSubmit = async () => {
    if (!allValid) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', capitalizeWords(name.trim()));
      form.append('company', company.trim());
      form.append('position', position.trim());
      form.append('experience', experienceYears ? `${experienceYears} years` : '');
      form.append('totalPastInterviews', totalPastInterviews || '0');
      form.append('qualification', qualification.trim());
      // Age not yet persisted server-side; send anyway for potential future use
      form.append('age', age.trim());
      if (resume) form.append('resume', resume);

      const response = await fetch(`${BACKEND_URL}/api/interview/apply`, {
        method: 'POST', credentials: 'include', body: form,
      });
      let json = null; 
      try { 
        json = await response.json(); 
      } catch (error) {
        console.error('Error parsing response:', error);
      }
      if (!response.ok) throw new Error((json && json.message) || 'Failed to submit');
      navigate('/');
    } catch (err) {
      console.error(err); alert(err.message || 'Error');
    } finally { setLoading(false); }
  };

  const helper = (text) => <p className="mt-1 text-xs text-gray-500">{text}</p>;
  const invalidClass = (v) => v ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500' : 'border-red-400 focus:ring-red-500 focus:border-red-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-100 pt-16 md:pt-[72px] xl:pt-20 pb-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Register as Interviewer</h1>
              <p className="text-sm text-gray-600 mt-1">Provide professional details and upload your resume (PDF).</p>
            </div>
            {appLoading ? (
              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-500">Loading…</span>
            ) : application ? (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : application.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{application.status.toUpperCase()}</span>
                {application.resumeUrl && (
                  <a href={application.resumeUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View Resume</a>
                )}
              </div>
            ) : null}
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white ${invalidClass(validations.name)} placeholder-gray-400`}
                placeholder="e.g. Jane Doe"
                value={name}
                onChange={e => setName(capitalizeWords(e.target.value))}
                autoComplete="off"
              />
              {helper('Enter your legal or preferred professional name.')}
            </div>

            {/* Organization / University Combobox */}
            <div className="col-span-1 relative" ref={orgBoxRef}>
              <label className="block text-sm font-medium text-gray-700">Organization / University</label>
              <input
                type="text"
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white ${invalidClass(validations.company)} placeholder-gray-400`}
                placeholder="Start typing to search…"
                value={company}
                onFocus={() => setShowOrgList(true)}
                onChange={e => { setCompany(e.target.value); setShowOrgList(true); }}
                autoComplete="off"
              />
              {helper('Select or type your current organization / institute.')}
              {showOrgList && filteredOrgs.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow animate-fade">
                  {filteredOrgs.map(o => (
                    <button
                      key={o}
                      type="button"
                      onMouseDown={() => { setCompany(o); setShowOrgList(false); }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50 focus:bg-blue-50"
                    >{o}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Designation Combobox */}
            <div className="col-span-1 relative" ref={roleBoxRef}>
              <label className="block text-sm font-medium text-gray-700">Designation / Role</label>
              <input
                type="text"
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white ${invalidClass(validations.position)} placeholder-gray-400`}
                placeholder="e.g. Senior Developer"
                value={position}
                onFocus={() => setShowRoleList(true)}
                onChange={e => { setPosition(capitalizeWords(e.target.value)); setShowRoleList(true); }}
                autoComplete="off"
              />
              {helper('Enter your current job title. You can type a custom title.')}
              {showRoleList && filteredRoles.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow">
                  {filteredRoles.map(r => (
                    <button
                      key={r}
                      type="button"
                      onMouseDown={() => { setPosition(r); setShowRoleList(false); }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                    >{r}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Years of Experience */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
              <input
                type="number"
                min={0}
                max={50}
                step={1}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white ${invalidClass(validations.experienceYears)} placeholder-gray-400`}
                placeholder="e.g. 5"
                value={experienceYears}
                onChange={e => setExperienceYears(e.target.value)}
              />
              {helper('Total professional experience in years (0–50).')}
            </div>

            {/* Age */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input
                type="number"
                min={18}
                max={80}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white ${invalidClass(validations.age)} placeholder-gray-400`}
                placeholder="e.g. 28"
                value={age}
                onChange={e => setAge(e.target.value)}
              />
              {helper('Must be between 18 and 80.')}
            </div>

            {/* Past Interviews */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700">Total Past Interviews Conducted</label>
              <input
                type="number"
                min={0}
                max={10000}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white ${invalidClass(validations.totalPastInterviews)} placeholder-gray-400`}
                placeholder="e.g. 25"
                value={totalPastInterviews}
                onChange={e => setTotalPastInterviews(e.target.value)}
              />
              {helper('Approximate number of interviews you have conducted.')}
            </div>

            {/* Qualification Combobox */}
            <div className="col-span-1 relative" ref={qualBoxRef}>
              <label className="block text-sm font-medium text-gray-700">Highest Qualification</label>
              <input
                type="text"
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm bg-white ${invalidClass(validations.qualification)} placeholder-gray-400`}
                placeholder="Start typing…"
                value={qualification}
                onFocus={() => setShowQualList(true)}
                onChange={e => { setQualification(capitalizeWords(e.target.value)); setShowQualList(true); }}
                autoComplete="off"
              />
              {helper('Select or enter your highest attained qualification.')}
              {showQualList && filteredQuals.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow">
                  {filteredQuals.map(q => (
                    <button
                      key={q}
                      type="button"
                      onMouseDown={() => { setQualification(q); setShowQualList(false); }}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                    >{q}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resume Upload */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700">Resume (PDF)</label>
            <div
              ref={dragRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`mt-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl px-6 py-10 transition ${resume ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'} relative`}
              title="PDF only, max 2MB"
            >
              {!resume && (
                <>
                  <p className="text-sm text-gray-600">Drag & drop your PDF here, or</p>
                  <button
                    type="button"
                    onClick={() => document.getElementById('resumeInput').click()}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v9m0-9l-3 3m3-3l3 3M12 3v9m0 0l3-3m-3 3L9 9"/></svg>
                    Browse File
                  </button>
                  <p className="mt-2 text-xs text-gray-500">PDF only • Max size 2MB</p>
                </>
              )}
              {resume && (
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{resume.name}</p>
                    <p className="text-xs text-gray-500">{(resume.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResume(null)}
                    className="ml-auto text-xs text-red-600 hover:underline"
                  >Remove</button>
                </div>
              )}
              <input
                id="resumeInput"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => onResumeFile(e.target.files[0])}
              />
            </div>
            {resumeError && <p className="mt-2 text-xs text-red-600">{resumeError}</p>}
            {!validations.resume && !resumeError && <p className="mt-2 text-xs text-gray-500">Resume required before submission.</p>}
          </div>

          {/* Submit */}
          <div className="mt-10 flex justify-end">
            <button
              disabled={!allValid}
              onClick={handleSubmit}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${allValid ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' : 'bg-gray-300 text-gray-600'}`}
            >
              {loading && (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" className="opacity-25"/><path d="M4 12a8 8 0 018-8" className="opacity-75"/></svg>
              )}
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">Age field is currently not persisted server-side; update backend if needed.</p>
      </div>
    </div>
  );
};

export default RegisterInterviewer;

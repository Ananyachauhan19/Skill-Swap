import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import { BACKEND_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient';

const MAX_SKILLS = 5;
const DRAFT_KEY = 'tutorApplicationDraft_v1';
const EDUCATION_LEVELS = [
  { value: 'school', label: 'School' },
  { value: 'college', label: 'College' }
];

const SCHOOL_CLASSES = ['9', '10', '11', '12'];
const COLLEGE_TYPES = ['UG', 'PG'];
const COLLEGE_COURSES = ['BCA', 'BSc CS', 'BCom', 'BA', 'BTech', 'MTech', 'MCA', 'MBA', 'BBA', 'BSc Maths'];

function titleCase(str) {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Step icons using SVG
const StepIcon = ({ number, active, completed }) => (
  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
    completed ? 'bg-blue-900 text-white' : active ? 'bg-blue-900 text-white ring-4 ring-blue-200' : 'bg-gray-200 text-gray-500'
  }`}>
    {completed ? '✓' : number}
  </div>
);

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { num: 1, label: 'Basic Details' },
    { num: 2, label: 'Skills' },
    { num: 3, label: 'Documents' },
    { num: 4, label: 'Review' }
  ];

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => (
          <React.Fragment key={step.num}>
            <div className="flex flex-col items-center z-10">
              <StepIcon number={step.num} active={currentStep === step.num} completed={currentStep > step.num} />
              <span className={`mt-3 text-xs font-medium ${currentStep >= step.num ? 'text-blue-900' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.num ? 'bg-blue-900' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const SkillSelector = ({ classes, subjectsByClass, topicsBySubject, value, onChange }) => {
  const [subjectQuery, setSubjectQuery] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [classFocused, setClassFocused] = useState(false);
  const [subjectFocused, setSubjectFocused] = useState(false);
  const [topicFocused, setTopicFocused] = useState(false);
  const activeSubjects = value.class ? (subjectsByClass[value.class] || []) : [];
  const fuseSubjects = useMemo(() => new Fuse(activeSubjects.map(s => ({ name: s })), { keys: ['name'], threshold: 0.4 }), [activeSubjects]);
  const activeSubjectTopics = value.subject ? (topicsBySubject[value.subject] || []) : [];
  const fuseTopics = useMemo(() => new Fuse(activeSubjectTopics.map(t => ({ name: t })), { keys: ['name'], threshold: 0.4 }), [activeSubjectTopics]);

  const filteredClasses = classes || [];
  const filteredSubjects = subjectQuery ? fuseSubjects.search(subjectQuery).map(r => r.item.name) : activeSubjects;
  const filteredTopics = topicQuery ? fuseTopics.search(topicQuery).map(r => r.item.name) : activeSubjectTopics;

  useEffect(() => {
    if (!value.class && !value.subject && !value.topic) {
      setClassFocused(false);
      setSubjectQuery('');
      setTopicQuery('');
    }
  }, [value]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Class / Course</label>
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          value={value.class || ''}
          onChange={e => onChange({ class: e.target.value, subject: '', topic: '' })}
          onFocus={() => setClassFocused(true)}
          onBlur={() => setClassFocused(false)}
        >
          <option value="">Select...</option>
          {filteredClasses.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
        <div className="relative">
          <input
            disabled={!value.class}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder="Search subject..."
            value={subjectQuery}
            onChange={e => setSubjectQuery(e.target.value)}
            onFocus={() => setSubjectFocused(true)}
            onBlur={() => setSubjectFocused(false)}
          />
          {subjectFocused && (
            <div className="absolute left-0 right-0 z-10 max-h-48 overflow-y-auto border border-gray-200 rounded-lg mt-1 bg-white shadow-lg">
              {filteredSubjects.map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => { onChange({ class: value.class, subject: s, topic: '' }); setSubjectQuery(s); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition ${value.subject === s ? 'bg-blue-100 font-medium' : ''}`}
                >{s}</button>
              ))}
              {!filteredSubjects.length && <div className="px-3 py-2 text-xs text-gray-500">No matches</div>}
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Topic</label>
        <div className="relative">
          <input
            disabled={!value.subject}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder={value.subject ? 'Search topic...' : 'Select subject first'}
            value={topicQuery}
            onChange={e => setTopicQuery(e.target.value)}
            onFocus={() => setTopicFocused(true)}
            onBlur={() => setTopicFocused(false)}
          />
          {value.subject && topicFocused && (
            <div className="absolute left-0 right-0 z-10 max-h-48 overflow-y-auto border border-gray-200 rounded-lg mt-1 bg-white shadow-lg">
              <button
                type="button"
                onMouseDown={() => { onChange({ ...value, topic: 'ALL' }); setTopicQuery('ALL'); }}
                className={`w-full text-left px-3 py-2 text-sm font-semibold bg-blue-50 hover:bg-blue-100 transition ${value.topic === 'ALL' ? 'bg-blue-200' : ''}`}
              >ALL (Complete Subject)</button>
              {filteredTopics.map(t => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={() => { onChange({ ...value, topic: t }); setTopicQuery(t); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition ${value.topic === t ? 'bg-blue-100 font-medium' : ''}`}
                >{t}</button>
              ))}
              {!filteredTopics.length && <div className="px-3 py-2 text-xs text-gray-500">No matches</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DragFileInput = ({ label, accept, maxSizeBytes, value, onChange, tooltip, id }) => {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function handleFiles(files) {
    const file = files?.[0];
    if (!file) return;
    if (accept && !accept.split(',').some(a => file.type === a || (a.endsWith('/*') && file.type.startsWith(a.replace('/*',''))))) {
      setError('Invalid file type');
      return;
    }
    if (maxSizeBytes && file.size > maxSizeBytes) {
      setError(`File must be ≤ ${(maxSizeBytes/1024/1024).toFixed(1)}MB`);
      return;
    }
    setError('');
    onChange(file);
  }

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-xs font-medium text-gray-700">{label}</label>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${dragging ? 'border-blue-900 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input id={id} type="file" accept={accept} className="hidden" onChange={e => handleFiles(e.target.files)} />
        {!value && (
          <div>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm text-gray-600">
              Drag & drop or <label htmlFor={id} className="text-blue-900 cursor-pointer font-semibold hover:underline">browse</label>
            </p>
            <p className="text-xs text-gray-500 mt-2">Max {(maxSizeBytes/1024/1024).toFixed(1)}MB</p>
          </div>
        )}
        {value && (
          <div className="flex flex-col items-center">
            <div className="text-4xl mb-2">✓</div>
            <div className="text-sm font-medium text-gray-800">{value.name}</div>
            <p className="text-xs text-gray-500 mt-1">{(value.size/1024).toFixed(1)} KB</p>
            <button type="button" onClick={() => onChange(null)} className="mt-3 text-xs text-red-600 hover:underline font-medium">
              Remove
            </button>
          </div>
        )}
        {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}
      </div>
    </div>
  );
};

const TutorApplication = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [educationLevel, setEducationLevel] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [classOrYear, setClassOrYear] = useState(''); // For school classes 9-12
  const [collegeTrack, setCollegeTrack] = useState(''); // UG / PG
  const [courseName, setCourseName] = useState('');
  const [skills, setSkills] = useState([]); // each { class, subject, topic }
  const [currentSkill, setCurrentSkill] = useState({ class: '', subject: '', topic: '' });
  const [classes, setClasses] = useState([]);
  const [subjectsByClass, setSubjectsByClass] = useState({});
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [marksheetFile, setMarksheetFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [prefillLoaded, setPrefillLoaded] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null); // { applicationType, status }
  const [draftOverride, setDraftOverride] = useState(false);

  // Load subjects/topics
  useEffect(() => {
    (async () => {
      try {
        setLoadingMeta(true);
        const res = await fetch(`${BACKEND_URL}/api/skills-list`);
        if (!res.ok) throw new Error('Failed to load subjects/topics');
        const data = await res.json();
        // If user has pre-added skillsToTeach with class, restrict classes to those
        const userClasses = Array.isArray(user?.skillsToTeach) ? Array.from(new Set(user.skillsToTeach.map(s => s.class).filter(Boolean))) : [];
        const available = data.classes || [];
        const restricted = userClasses.length ? available.filter(c => userClasses.includes(c)) : available;
        setClasses(restricted);
        setSubjectsByClass(data.subjectsByClass || {});
        setTopicsBySubject(data.topicsBySubject || {});
      } catch (e) {
        setSubmitError(e.message);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  // Prefill education/institution/class defaults and any pending edited skills from application
  useEffect(() => {
    (async () => {
      try {
        const [defaultsResp, statusResp] = await Promise.all([
          fetch(`${BACKEND_URL}/api/tutor/apply/defaults`, { credentials: 'include' }),
          fetch(`${BACKEND_URL}/api/tutor/status`, { credentials: 'include' })
        ]);
        if (defaultsResp.ok) {
          const d = await defaultsResp.json();
          if (d.educationLevel) setEducationLevel(d.educationLevel);
          if (d.institutionName) setInstitutionName(d.institutionName);
          if (d.classOrYear) {
            // If school, classOrYear holds class; if college, we cannot infer track/course from a single string; keep as display only.
            setClassOrYear(d.classOrYear);
          }
        }
        if (statusResp.ok && !draftOverride) {
          const s = await statusResp.json();
          const app = s?.application;
          if (Array.isArray(app?.skills) && app.applicationType === 'skills-update' && app.status === 'pending') {
            // Show edited skills by default (pending update request), excluding already-approved skills
            const approved = Array.isArray(user?.skillsToTeach) ? user.skillsToTeach : [];
            const key = (x) => `${(x.class||'').toLowerCase()}::${(x.subject||'').toLowerCase()}::${(x.topic||'').toLowerCase()}`;
            const approvedSet = new Set(approved.map(key));
            const filtered = app.skills.filter(s => !approvedSet.has(key(s))).slice(0, MAX_SKILLS);
            // Only override skills if we actually have new ones; otherwise keep draft/prefilled skills
            if (filtered.length > 0) {
              setSkills(filtered);
            }
            setPendingUpdate({ applicationType: app.applicationType, status: app.status });
          }
        }
      } catch (_) {
        // silent fail; user can fill manually
      } finally {
        setPrefillLoaded(true);
      }
    })();
  }, []);

  // Load draft from localStorage on first mount (after meta loaded so subjects available)
  useEffect(() => {
    if (loadedDraft) return; // prevent re-run
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.educationLevel) setEducationLevel(draft.educationLevel);
        if (draft.institutionName) setInstitutionName(draft.institutionName);
        if (draft.classOrYear) setClassOrYear(draft.classOrYear);
        if (draft.collegeTrack) setCollegeTrack(draft.collegeTrack);
        if (draft.courseName) setCourseName(draft.courseName);
        if (Array.isArray(draft.skills)) {
          const key = (x) => `${(x.class||'').toLowerCase()}::${(x.subject||'').toLowerCase()}::${(x.topic||'').toLowerCase()}`;
          const seen = new Set();
          const deduped = draft.skills.filter(s => {
            const k = key(s);
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          }).slice(0, MAX_SKILLS);
          setSkills(deduped);
          setDraftOverride(true);
        }
        if (draft.currentSkill) setCurrentSkill(draft.currentSkill);
        if (draft.step) {
          const numericStep = Number(draft.step);
          if (numericStep >= 1 && numericStep <= 4) setStep(numericStep);
        }
      }
    } catch (e) {
      // ignore malformed draft
    } finally {
      setLoadedDraft(true);
    }
  }, [loadedDraft]);

  // Autosave draft (debounced) whenever relevant state changes
  useEffect(() => {
    if (!loadedDraft) return; // only after initial load
    const handle = setTimeout(() => {
      const payload = {
        step,
        educationLevel,
        institutionName,
        classOrYear,
        collegeTrack,
        courseName,
        skills,
        currentSkill
        // Files intentionally not stored (cannot serialize File objects)
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {
        // storage quota exceeded; silently ignore
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(handle);
  }, [step, educationLevel, institutionName, classOrYear, collegeTrack, courseName, skills, currentSkill, loadedDraft]);

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setEducationLevel('');
    setInstitutionName('');
    setClassOrYear('');
    setCollegeTrack('');
    setCourseName('');
    setSkills([]);
    setCurrentSkill({ class: '', subject: '', topic: '' });
    setStep(1);
  }

  // Validation per step
  const stepValid = useMemo(() => {
    const isSkillsUpdate = pendingUpdate?.applicationType === 'skills-update';
    if (step === 1) {
      if (!educationLevel) return false;
      if (!institutionName.trim()) return false;
      if (educationLevel === 'school' && !classOrYear) return false;
      if (educationLevel === 'college' && (!collegeTrack || !courseName)) return false;
      return true;
    }
    if (step === 2) {
      // For updates, require at least one new (non-approved) skill to proceed
      return skills.length > 0 && skills.length <= MAX_SKILLS;
    }
    if (step === 3) {
      if (!marksheetFile || !videoFile) return false;
      if (marksheetFile.type !== 'application/pdf') return false;
      if (marksheetFile.size > 1024 * 1024) return false;
      return true;
    }
    if (step === 4) {
      // Block submission if no new skills in update flow
      if (isSkillsUpdate && skills.length === 0) return false;
      return true;
    }
    return false;
  }, [step, educationLevel, institutionName, classOrYear, collegeTrack, courseName, skills, marksheetFile, videoFile]);

  const duplicateSkill = (clazz, subject, topic) => skills.some(s => s.class === clazz && s.subject === subject && s.topic === topic);
  const canAddCurrent = currentSkill.class && currentSkill.subject && currentSkill.topic && !duplicateSkill(currentSkill.class, currentSkill.subject, currentSkill.topic) && skills.length < MAX_SKILLS;

  function next() { if (stepValid && step < 4) setStep(s => s + 1); }
  function back() { if (step > 1) setStep(s => s - 1); }

  function addCurrentSkill() {
    if (!canAddCurrent) return;
    setSkills(prev => [...prev, currentSkill]);
    setCurrentSkill({ class: '', subject: '', topic: '' });
  }
  function removeSkill(idx) { setSkills(prev => prev.filter((_, i) => i !== idx)); }

  async function submitApplication() {
    setSubmitError('');
    setSubmitSuccess('');
    if (!stepValid) return;
    setSubmitting(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append('educationLevel', educationLevel);
      fd.append('institutionName', titleCase(institutionName));
      // Choose classOrYear value depending on education selection
      const classYearValue = educationLevel === 'school' ? classOrYear : `${collegeTrack}-${courseName}`;
      fd.append('classOrYear', classYearValue);
      fd.append('skills', JSON.stringify(skills));
      fd.append('marksheet', marksheetFile);
      fd.append('video', videoFile);
      const isSkillsUpdate = pendingUpdate?.applicationType === 'skills-update';
      const endpoint = isSkillsUpdate ? `${BACKEND_URL}/api/tutor/skills/update-request` : `${BACKEND_URL}/api/tutor/apply`;
      await axios.post(endpoint, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        }
      });
      setSubmitSuccess(isSkillsUpdate ? 'Skills update submitted for admin review.' : 'Application submitted! Logging out...');
      // Clear draft after successful submission
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      if (isSkillsUpdate) {
        // For updates, keep user logged in and navigate to profile status
        setTimeout(() => navigate('/my/profile'), 1200);
      } else {
        // Initial application: logout per original flow
        try { await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true }); } catch {}
        setTimeout(() => navigate('/login'), 1800);
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  // Render Steps
  function renderStep() {
    if (step === 1) {
      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Education Level</label>
              <select 
                value={educationLevel} 
                onChange={e => setEducationLevel(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              >
                <option value="">Select...</option>
                {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Institution Name</label>
              <input 
                value={institutionName} 
                onChange={e => setInstitutionName(titleCase(e.target.value))} 
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent" 
                placeholder="e.g. Green Valley High School" 
              />
            </div>
            {educationLevel === 'school' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Class (9–12)</label>
                <select 
                  value={classOrYear} 
                  onChange={e => setClassOrYear(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                >
                  <option value="">Select class</option>
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {educationLevel === 'college' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Track</label>
                  <select 
                    value={collegeTrack} 
                    onChange={e => setCollegeTrack(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  >
                    <option value="">Select track</option>
                    {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Course Name</label>
                  <select 
                    value={courseName} 
                    onChange={e => setCourseName(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  >
                    <option value="">Select course</option>
                    {COLLEGE_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
          {!stepValid && <p className="text-xs text-red-600 font-medium">Complete all required fields.</p>}
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="space-y-6">
          {loadingMeta && <p className="text-sm text-gray-500">Loading subjects...</p>}
          {!loadingMeta && (
            <div className="grid md:grid-cols-2 gap-8">
              <SkillSelector
                classes={classes}
                subjectsByClass={subjectsByClass}
                topicsBySubject={topicsBySubject}
                value={currentSkill}
                onChange={setCurrentSkill}
              />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={addCurrentSkill}
                    disabled={!canAddCurrent}
                    className="px-5 py-2.5 rounded-lg bg-blue-900 text-white text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition"
                  >
                    Add Skill
                  </button>
                  <div className="text-xs text-gray-500 font-medium">{skills.length}/{MAX_SKILLS}</div>
                </div>
                <div className="space-y-2">
                  {skills.map((s,i) => (
                    <div key={i} className="group flex items-center justify-between bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg">
                      <span className="text-sm font-medium text-gray-800">{s.class} • {s.subject} – {s.topic}</span>
                      <button 
                        type="button" 
                        onClick={() => removeSkill(i)} 
                        className="text-red-600 hover:text-red-700 font-bold text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {!skills.length && <p className="text-sm text-gray-500 text-center py-8">No skills added yet.</p>}
                </div>
                {pendingUpdate?.applicationType === 'skills-update' && skills.length === 0 && (
                  <div className="text-xs text-yellow-800 bg-yellow-100 border border-yellow-200 px-3 py-2 rounded">
                    No new skills detected in your update. Please add at least one skill that isn’t already approved.
                  </div>
                )}
              </div>
            </div>
          )}
          {!stepValid && <p className="text-xs text-red-600 font-medium">Add at least one skill (max 5).</p>}
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="space-y-8">
          <DragFileInput
            id="marksheet"
            label="Latest Marksheet (PDF ≤1MB)"
            accept="application/pdf"
            maxSizeBytes={1024*1024}
            value={marksheetFile}
            onChange={setMarksheetFile}
          />
          <DragFileInput
            id="video"
            label="Teaching Video (MP4/WebM)"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
            maxSizeBytes={50*1024*1024}
            value={videoFile}
            onChange={setVideoFile}
          />
          {!stepValid && <p className="text-xs text-red-600 font-medium">Provide valid PDF marksheet & video.</p>}
        </div>
      );
    }
    if (step === 4) {
      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Education</span>
                <span className="font-medium text-gray-900">{educationLevel === 'school' ? 'School' : 'College'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Institution</span>
                <span className="font-medium text-gray-900">{institutionName || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Class / Track</span>
                <span className="font-medium text-gray-900">{educationLevel === 'school' ? classOrYear : collegeTrack || '—'}</span>
              </div>
              {educationLevel === 'college' && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Course</span>
                  <span className="font-medium text-gray-900">{courseName || '—'}</span>
                </div>
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div className="py-2 border-b">
                <span className="text-gray-600 block mb-2">Skills</span>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s,i) => (
                    <div key={i} className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-medium">
                      {s.class}-{s.subject}-{s.topic}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Marksheet</span>
                <span className="font-medium text-gray-900">{marksheetFile?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Video</span>
                <span className="font-medium text-gray-900">{videoFile?.name || '—'}</span>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
            After submission, an admin will review your application. If approved, tutor features unlock immediately.
          </div>
          {pendingUpdate?.applicationType === 'skills-update' && skills.length === 0 && (
            <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg font-medium">Provide at least one skill to update.</div>
          )}
          {submitError && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-lg font-medium">{submitError}</div>}
          {submitSuccess && <div className="p-3 bg-green-100 text-green-700 text-sm rounded-lg font-medium">{submitSuccess}</div>}
          {submitting && (
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-blue-900 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 pt-16 md:pt-[72px] lg:pt-20">
      <div className="max-w-5xl mx-auto px-6 pb-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-3">Tutor Verification</h1>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Complete the 4-step process to submit your credentials and teaching preview.
          </p>
          {!prefillLoaded && (
            <p className="text-xs text-gray-400 mt-2">Prefilling your verified defaults…</p>
          )}
          {pendingUpdate?.applicationType === 'skills-update' && pendingUpdate.status === 'pending' && (
            <div className="mt-3 inline-block text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded">
              Your updated skills are awaiting admin approval. Until approved, your profile and tutor access continue to use your existing skills.
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={step} />

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-lg p-10 mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={back}
            disabled={step === 1 || submitting}
            className="px-6 py-3 rounded-lg border-2 border-gray-300 text-sm font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={clearDraft}
            disabled={submitting}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
          >
            Reset Draft
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              disabled={!stepValid || submitting}
              className="px-6 py-3 rounded-lg bg-blue-900 text-white text-sm font-semibold disabled:opacity-40 hover:bg-blue-800 transition"
            >
              Next →
            </button>
          ) : (
            <button
              type="button"
              onClick={submitApplication}
              disabled={submitting}
              className="px-8 py-3 rounded-lg bg-blue-900 text-white text-sm font-bold shadow-lg disabled:opacity-50 hover:bg-blue-800 transition flex items-center gap-2"
            >
              {submitting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>}
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorApplication;

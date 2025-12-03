import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Fuse from 'fuse.js';
import { BACKEND_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../lib/supabaseClient';

// Local components (step indicator, skill selector, file uploader) kept inside same file for simplicity

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

const StepIndicator = ({ step }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="text-sm font-medium text-gray-600">Step {step} of 4</div>
    <div className="flex gap-2">
      {[1,2,3,4].map(s => (
        <div key={s} className={`h-2 w-8 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}/>
      ))}
    </div>
  </div>
);

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

  // Clear queries when parent resets selected value (after Add Skill)
  useEffect(() => {
    if (!value.class && !value.subject && !value.topic) {
      setClassFocused(false);
      setSubjectQuery('');
      setTopicQuery('');
    }
  }, [value]);

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-gray-600">Class / Course</label>
        <div className="relative mt-1">
          <select
            className="w-full border rounded px-3 py-2 text-sm"
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
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600">Subject</label>
        <div className="relative mt-1">
          <input
            disabled={!value.class}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
            placeholder="Search subject..."
            value={subjectQuery}
            onChange={e => setSubjectQuery(e.target.value)}
            onFocus={() => setSubjectFocused(true)}
            onBlur={() => setSubjectFocused(false)}
          />
          {subjectFocused && (
            <div className="absolute left-0 right-0 z-10 max-h-40 overflow-y-auto border rounded mt-2 bg-white shadow-sm divide-y">
              {filteredSubjects.map(s => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={() => { onChange({ class: value.class, subject: s, topic: '' }); setSubjectQuery(s); }}
                  className={`w-full text-left px-3 py-1 text-sm hover:bg-blue-50 ${value.subject === s ? 'bg-blue-100 font-medium' : ''}`}
                >{s}</button>
              ))}
              {!filteredSubjects.length && <div className="px-3 py-2 text-xs text-gray-500">No matches</div>}
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
          Topic {value.subject && <span className="text-gray-400">({activeSubjectTopics.length} available)</span>}
        </label>
        <div className="relative mt-1">
          <input
            disabled={!value.subject}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-100"
            placeholder={value.subject ? 'Search topic...' : 'Select subject first'}
            value={topicQuery}
            onChange={e => setTopicQuery(e.target.value)}
            onFocus={() => setTopicFocused(true)}
            onBlur={() => setTopicFocused(false)}
          />
          {value.subject && topicFocused && (
            <div className="absolute left-0 right-0 z-10 max-h-40 overflow-y-auto border rounded mt-2 bg-white shadow-sm divide-y">
              {filteredTopics.map(t => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={() => { onChange({ ...value, topic: t }); setTopicQuery(t); }}
                  className={`w-full text-left px-3 py-1 text-sm hover:bg-indigo-50 ${value.topic === t ? 'bg-indigo-100 font-medium' : ''}`}
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
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        <span className="text-xs text-gray-400" title={tooltip}>ⓘ</span>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input id={id} type="file" accept={accept} className="hidden" onChange={e => handleFiles(e.target.files)} />
        {!value && <>
          <p className="text-sm text-gray-600">Drag & drop or <label htmlFor={id} className="text-blue-600 cursor-pointer font-medium">browse</label></p>
          <p className="text-xs text-gray-400 mt-1">Allowed: {accept} • Max {(maxSizeBytes/1024/1024).toFixed(1)}MB</p>
        </>}
        {value && <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium"><span>✔</span>{value.name}</div>
          <p className="text-xs text-gray-400 mt-1">{(value.size/1024).toFixed(1)} KB</p>
          <button type="button" onClick={() => onChange(null)} className="mt-2 text-xs text-red-600 hover:underline">Remove</button>
        </div>}
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
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

  // Load subjects/topics
  useEffect(() => {
    (async () => {
      try {
        setLoadingMeta(true);
        const res = await fetch(`${BACKEND_URL}/api/skills-list`);
        if (!res.ok) throw new Error('Failed to load subjects/topics');
        const data = await res.json();
        setClasses(data.classes || []);
        setSubjectsByClass(data.subjectsByClass || {});
        setTopicsBySubject(data.topicsBySubject || {});
      } catch (e) {
        setSubmitError(e.message);
      } finally {
        setLoadingMeta(false);
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
        if (Array.isArray(draft.skills)) setSkills(draft.skills.slice(0, MAX_SKILLS));
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
    if (step === 1) {
      if (!educationLevel) return false;
      if (!institutionName.trim()) return false;
      if (educationLevel === 'school' && !classOrYear) return false;
      if (educationLevel === 'college' && (!collegeTrack || !courseName)) return false;
      return true;
    }
    if (step === 2) {
      return skills.length > 0 && skills.length <= MAX_SKILLS;
    }
    if (step === 3) {
      if (!marksheetFile || !videoFile) return false;
      if (marksheetFile.type !== 'application/pdf') return false;
      if (marksheetFile.size > 1024 * 1024) return false;
      return true;
    }
    if (step === 4) return true; // review step always valid
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
      await axios.post(`${BACKEND_URL}/api/tutor/apply`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        }
      });
      setSubmitSuccess('Application submitted! Logging out...');
      // Clear draft after successful submission
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      try { await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true }); } catch {}
      setTimeout(() => navigate('/login'), 1800);
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
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Education Level</label>
              <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                <option value="">Select...</option>
                {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-1">Institution Name<span title="Enter full official name" className="text-xs text-gray-400">ⓘ</span></label>
              <input value={institutionName} onChange={e => setInstitutionName(titleCase(e.target.value))} className="mt-1 w-full border rounded px-3 py-2 text-sm" placeholder="e.g. Green Valley High School" />
            </div>
            {educationLevel === 'school' && (
              <div>
                <label className="text-sm font-medium">Class (9–12)</label>
                <select value={classOrYear} onChange={e => setClassOrYear(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                  <option value="">Select class</option>
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            {educationLevel === 'college' && (
              <>
                <div>
                  <label className="text-sm font-medium">Track</label>
                  <select value={collegeTrack} onChange={e => { setCollegeTrack(e.target.value); }} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select track</option>
                    {COLLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Course Name</label>
                  <select value={courseName} onChange={e => setCourseName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select course</option>
                    {COLLEGE_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}
          </div>
          {!stepValid && <p className="text-xs text-red-600">Complete all required fields.</p>}
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">Skills <span title="Add up to 5 subject-topic pairs you can teach" className="text-xs text-gray-400">ⓘ</span></h2>
          {loadingMeta && <p className="text-sm text-gray-500">Loading subjects...</p>}
          {!loadingMeta && (
            <div className="grid md:grid-cols-2 gap-6">
              <SkillSelector
                classes={classes}
                subjectsByClass={subjectsByClass}
                topicsBySubject={topicsBySubject}
                value={currentSkill}
                onChange={setCurrentSkill}
              />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addCurrentSkill}
                    disabled={!canAddCurrent}
                    className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-40"
                  >Add Skill</button>
                  <div className="text-xs text-gray-500">{skills.length}/{MAX_SKILLS}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s,i) => (
                    <div key={i} className="group flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-full text-xs font-medium">
                      <span>{s.class} • {s.subject} – {s.topic}</span>
                      <button type="button" onClick={() => removeSkill(i)} className="opacity-60 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                  {!skills.length && <p className="text-xs text-gray-500">No skills added yet.</p>}
                </div>
              </div>
            </div>
          )}
          {!stepValid && <p className="text-xs text-red-600">Add at least one skill (max 5).</p>}
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold">Uploads</h2>
          <DragFileInput
            id="marksheet"
            label="Latest Marksheet (PDF ≤1MB)"
            accept="application/pdf"
            maxSizeBytes={1024*1024}
            value={marksheetFile}
            onChange={setMarksheetFile}
            tooltip="Upload your most recent academic marksheet. Ensure clarity and legible text."
          />
          <DragFileInput
            id="video"
            label="Teaching Video (MP4/WebM)"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
            maxSizeBytes={50*1024*1024}
            value={videoFile}
            onChange={setVideoFile}
            tooltip="Record a 2–5 minute teaching sample demonstrating clarity, pacing, and concept explanation."
          />
          {!stepValid && <p className="text-xs text-red-600">Provide valid PDF marksheet & video.</p>}
        </div>
      );
    }
    if (step === 4) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Review & Submit</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-medium">Education:</span> {educationLevel === 'school' ? 'School' : 'College'}</p>
              <p><span className="font-medium">Institution:</span> {institutionName || '—'}</p>
              <p><span className="font-medium">Class / Track:</span> {educationLevel === 'school' ? classOrYear : collegeTrack || '—'}</p>
              {educationLevel === 'college' && <p><span className="font-medium">Course:</span> {courseName || '—'}</p>}
            </div>
            <div className="space-y-2">
              <p className="font-medium">Skills:</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s,i) => <div key={i} className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-1 rounded-full text-xs">{s.class}-{s.subject}-{s.topic}</div>)}
              </div>
              <p><span className="font-medium">Marksheet:</span> {marksheetFile?.name || '—'}</p>
              <p><span className="font-medium">Video:</span> {videoFile?.name || '—'}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
            After submission an admin will review your application. If approved, tutor features unlock automatically 5 minutes after approval.
          </div>
          {submitError && <div className="p-2 bg-red-100 text-red-700 text-xs rounded">{submitError}</div>}
          {submitSuccess && <div className="p-2 bg-green-100 text-green-700 text-xs rounded">{submitSuccess}</div>}
          {submitting && (
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-8 shadow mb-8">
        <h1 className="text-3xl font-semibold mb-2">Tutor Verification</h1>
        <p className="text-sm opacity-90 max-w-2xl">Complete the 4-step process to submit your credentials and teaching preview. Approval triggers a 5‑minute activation delay ensuring system integrity.</p>
      </div>
      <StepIndicator step={step} />
      {renderStep()}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 1 || submitting}
          className="px-5 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 bg-white shadow-sm"
        >Back</button>
        {step < 4 && (
          <button
            type="button"
            onClick={next}
            disabled={!stepValid || submitting}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-40 shadow"
          >Next</button>
        )}
        {step === 4 && (
          <button
            type="button"
            onClick={submitApplication}
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>}
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        )}
        <button
          type="button"
          onClick={clearDraft}
          disabled={submitting}
          className="ml-4 px-4 py-2 rounded-lg border text-xs text-gray-600 hover:bg-gray-50"
        >Reset Draft</button>
      </div>
      <p className="text-[11px] text-gray-500 text-center mt-6">Need help? Hover the info icons (ⓘ) for guidance.</p>
    </div>
  );
};

export default TutorApplication;

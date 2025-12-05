import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Edit2, Save, XCircle, Plus, Trash2 } from 'lucide-react';
import { STATIC_COURSES, STATIC_UNITS } from '../../constants/teachingData';
import { BACKEND_URL } from '../../config.js';
import { useSkillMates } from '../../context/SkillMatesContext.jsx';

const SkillMateHeaderAction = () => {
  const { count, open } = useSkillMates();
  return (
    <div className="w-full flex justify-end -mt-2">
      <button
        onClick={open}
        className="inline-flex items-center gap-2 bg-blue-700 text-white px-3 py-1.5 rounded-md hover:bg-blue-800 shadow-sm"
        aria-label="Open SkillMates"
      >
        <span>SkillMates</span>
        <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">{count}</span>
      </button>
    </div>
  );
};

const UserInfoSection = ({
  profile,
  editingField,
  fieldDraft,
  startEdit,
  cancelEdit,
  handleArrayChange,
  handleArrayAdd,
  handleArrayRemove,
  onSaveEdit,
}) => {
  const [classes, setClasses] = useState([]);
  const [subjectsByClass, setSubjectsByClass] = useState({});
  const [topicsBySubject, setTopicsBySubject] = useState({});
  const [originalSkills, setOriginalSkills] = useState([]);
  const [pendingUpdate, setPendingUpdate] = useState(null); // { applicationType, status }

  // Normalize skills for deep compare
  const normalizeSkills = (skills) =>
    (Array.isArray(skills) ? skills : [])
      .map((s) => ({
        class: s.class || '',
        subject: s.subject || '',
        topic: s.topic || '',
      }))
      .sort((a, b) => (a.class + a.subject + a.topic).localeCompare(b.class + b.subject + b.topic));

  const areSkillsEqual = (a, b) => {
    const na = normalizeSkills(a);
    const nb = normalizeSkills(b);
    return JSON.stringify(na) === JSON.stringify(nb);
  };
  const handleCertFileUpload = async (index, file) => {
    if (!file) return;
    if (!file.type.includes('pdf')) {
      toast.error('Please select a PDF file.');
      return;
    }
    try {
      // Mock file upload (replace with actual upload logic)
      const mockUrl = `https://placehold.co/cert-${index}.pdf`;
      handleArrayChange('certificates', index, mockUrl, 'url');
    } catch {
      toast.error('Failed to upload certificate.');
    }
  };

  const handleSave = async () => {
    const editedSkills = fieldDraft.skillsToTeach || [];
    const skillsChanged = !areSkillsEqual(originalSkills, editedSkills);

    // Check if user only removed skills (no additions)
    const approved = Array.isArray(profile?.skillsToTeach) ? profile.skillsToTeach : [];
    const key = (x) => `${(x.class||'').toLowerCase()}::${(x.subject||'').toLowerCase()}::${(x.topic||'').toLowerCase()}`;
    const approvedSet = new Set(approved.map(key));
    const editedSet = new Set(editedSkills.map(key));
    
    // Check if any new skills were added (skills in edited but not in approved)
    const hasNewSkills = editedSkills.some(s => !approvedSet.has(key(s)));
    const onlyRemovedSkills = skillsChanged && !hasNewSkills;

    // If only removing skills, save immediately without approval
    if (onlyRemovedSkills) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            skillsToTeach: editedSkills,
            certificates: fieldDraft.certificates || profile.certificates || [],
            experience: fieldDraft.experience || profile.experience || [],
          }),
        });
        
        if (!response.ok) {
          const err = await response.json();
          toast.error(err.message || 'Failed to update profile');
          return;
        }
        
        const updatedUser = await response.json();
        const updatedProfile = {
          ...profile,
          ...fieldDraft,
          skillsToTeach: editedSkills,
        };
        
        if (onSaveEdit) {
          onSaveEdit(updatedProfile);
        }
        toast.success('Skills updated successfully');
        cancelEdit();
        return;
      } catch (error) {
        toast.error('Failed to update profile');
        return;
      }
    }

    // If skills changed with additions, navigate to Tutor Verification
    if (skillsChanged && hasNewSkills) {
      try {
        // Clear any server-side pending skills-update so a fresh request is created
        try {
          await fetch(`${BACKEND_URL}/api/tutor/skills/revert-pending`, { method: 'POST', credentials: 'include' });
        } catch (_) {}
        const DRAFT_KEY = 'tutorApplicationDraft_v1';
        // Exclude already-approved skills and dedupe
        const seen = new Set();
        const filtered = (editedSkills || []).filter(s => {
          const k = key(s);
          if (approvedSet.has(k)) return false; // skip already approved
          if (seen.has(k)) return false; // skip duplicate in edited list
          seen.add(k);
          return true;
        });
        const payload = {
          step: 2,
          skills: filtered,
          currentSkill: { class: '', subject: '', topic: '' },
        };
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(payload)); } catch {}
      } catch {}
    }

    // Save non-skills fields locally via onSaveEdit, but keep existing skills until approval
    const updatedProfile = {
      ...profile,
      ...fieldDraft,
      skillsToTeach: skillsChanged && hasNewSkills ? profile.skillsToTeach || [] : editedSkills,
      certificates: fieldDraft.certificates || profile.certificates || [],
      experience: fieldDraft.experience || profile.experience || [],
    };
    if (onSaveEdit) {
      onSaveEdit(updatedProfile);
    }
    cancelEdit();

    // Navigate to apply/tutor for verification when new skills added
    if (skillsChanged && hasNewSkills) {
      try {
        // Use location navigation via window to avoid hook
        window.location.href = '/tutor/apply';
      } catch {
        // fallback toast
        toast('Navigate to Tutor Verification to complete review');
      }
    }
  };

  // Load classes/subjects/topics from CSV-backed endpoint
  useEffect(() => {
    const loadSkillsList = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/skills-list`, { credentials: 'include' });
        const data = await res.json();
        setClasses(Array.isArray(data.classes) ? data.classes : []);
        setSubjectsByClass(data.subjectsByClass || {});
        setTopicsBySubject(data.topicsBySubject || {});
      } catch {
        // Fallback to statics if API fails
        setClasses(STATIC_COURSES);
        setSubjectsByClass({});
        setTopicsBySubject({});
      }
    };
    const loadStatus = async () => {
      try {
        const s = await fetch(`${BACKEND_URL}/api/tutor/status`, { credentials: 'include' });
        if (!s.ok) return;
        const j = await s.json();
        const app = j?.application;
        if (app && app.applicationType === 'skills-update' && app.status === 'pending') {
          setPendingUpdate({ applicationType: app.applicationType, status: app.status });
        } else {
          setPendingUpdate(null);
        }
      } catch (_) {
        setPendingUpdate(null);
      }
    };
    loadSkillsList();
    loadStatus();
  }, []);

  // Track original skills from current profile when editor opens OR when profile changes
  useEffect(() => {
    setOriginalSkills(profile.skillsToTeach || []);
  }, [editingField, profile.skillsToTeach]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8 flex flex-col md:flex-row gap-4 sm:gap-8 items-center mb-2">
      <div className="flex-1 flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-blue-900 text-lg">User Info</div>
          <div className="flex items-center gap-2">
            <SkillMateHeaderAction />
            {editingField !== 'userInfo' && (
              <button onClick={() => startEdit('userInfo')} className="text-blue-600 hover:text-blue-800">
                <Edit2 size={18} />
              </button>
            )}
          </div>
        </div>
        {pendingUpdate?.applicationType === 'skills-update' && pendingUpdate.status === 'pending' && (
          <div className="mb-2 text-xs bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-2 rounded">
            Your updated skills are awaiting admin approval. Until approved, your profile and tutor access continue to use your existing skills.
          </div>
        )}
        {editingField === 'userInfo' ? (
          <>
            {/* Certificates */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Certificates:</div>
              <div className="flex flex-col gap-2 bg-blue-50 p-2 rounded-md border border-blue-200">
                {(fieldDraft.certificates || []).map((cert, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-24"
                      value={cert.name || ''}
                      onChange={(e) => handleArrayChange('certificates', i, e.target.value, 'name')}
                      placeholder="Certificate Name"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-20"
                      value={cert.issuer || ''}
                      onChange={(e) => handleArrayChange('certificates', i, e.target.value, 'issuer')}
                      placeholder="Issuer"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-12"
                      value={cert.date || ''}
                      onChange={(e) => handleArrayChange('certificates', i, e.target.value, 'date')}
                      placeholder="Date"
                    />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleCertFileUpload(i, e.target.files[0])}
                      className="text-xs"
                    />
                    {cert.url && (
                      <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline text-xs">
                        View Cert
                      </a>
                    )}
                    <button onClick={() => handleArrayRemove('certificates', i)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('certificates', { name: '', issuer: '', date: '', url: '' })}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"
                >
                  <Plus size={14} /> Add Certificate
                </button>
              </div>
            </div>
            {/* What I Can Teach */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">What I Can Teach:</div>
              <div className="flex flex-col gap-2">
                {(fieldDraft.skillsToTeach || []).map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={s.class || ''}
                      onChange={(e) => {
                        handleArrayChange('skillsToTeach', i, e.target.value, 'class');
                        // Reset dependent fields when class changes
                        handleArrayChange('skillsToTeach', i, '', 'subject');
                        handleArrayChange('skillsToTeach', i, '', 'topic');
                      }}
                    >
                      <option value="">Select Class/Course</option>
                      {classes.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={s.subject || ''}
                      onChange={(e) => {
                        handleArrayChange('skillsToTeach', i, e.target.value, 'subject');
                        // Reset topic when subject changes
                        handleArrayChange('skillsToTeach', i, '', 'topic');
                      }}
                      disabled={!s.class}
                    >
                      <option value="">Select Subject</option>
                      {(subjectsByClass[s.class] || []).map((subj) => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={s.topic || ''}
                      onChange={(e) => handleArrayChange('skillsToTeach', i, e.target.value, 'topic')}
                      disabled={!s.subject}
                    >
                      <option value="">Select Topic</option>
                      <option value="ALL" className="font-semibold bg-blue-50">ALL (Complete Subject)</option>
                      {(topicsBySubject[s.subject] || []).map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                    <button onClick={() => handleArrayRemove('skillsToTeach', i)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('skillsToTeach', { subject: '', topic: '' })}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"
                >
                  <Plus size={14} /> Add Skill
                </button>
              </div>
            </div>
            {/* Experience */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Experience:</div>
              <div className="flex flex-col gap-2">
                {(fieldDraft.experience || []).map((exp, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-20"
                      value={exp.position || ''}
                      onChange={(e) => handleArrayChange('experience', i, e.target.value, 'position')}
                      placeholder="Position"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-20"
                      value={exp.company || ''}
                      onChange={(e) => handleArrayChange('experience', i, e.target.value, 'company')}
                      placeholder="Company"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-16"
                      value={exp.duration || ''}
                      onChange={(e) => handleArrayChange('experience', i, e.target.value, 'duration')}
                      placeholder="Duration"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-32"
                      value={exp.description || ''}
                      onChange={(e) => handleArrayChange('experience', i, e.target.value, 'description')}
                      placeholder="Description"
                    />
                    <button onClick={() => handleArrayRemove('experience', i)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleArrayAdd('experience', { position: '', company: '', duration: '', description: '' })}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"
                >
                  <Plus size={14} /> Add Experience
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSave}
                disabled={areSkillsEqual(originalSkills, fieldDraft.skillsToTeach || [])}
                className={`px-3 py-1 rounded flex items-center gap-1 ${
                  areSkillsEqual(originalSkills, fieldDraft.skillsToTeach || [])
                    ? 'bg-green-600/50 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Save size={16} /> Save
              </button>
              <button onClick={cancelEdit} className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 flex items-center gap-1">
                <XCircle size={16} /> Cancel
              </button>
            </div>
            {(() => {
              const editedSkills = fieldDraft.skillsToTeach || [];
              const approved = Array.isArray(profile?.skillsToTeach) ? profile.skillsToTeach : [];
              const key = (x) => `${(x.class||'').toLowerCase()}::${(x.subject||'').toLowerCase()}::${(x.topic||'').toLowerCase()}`;
              const approvedSet = new Set(approved.map(key));
              const hasNewSkills = editedSkills.some(s => !approvedSet.has(key(s)));
              const skillsChanged = !areSkillsEqual(originalSkills, editedSkills);
              const onlyRemoving = skillsChanged && !hasNewSkills;
              
              if (onlyRemoving) {
                return (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    ℹ️ Removing skills will update immediately without admin approval
                  </div>
                );
              } else if (skillsChanged && hasNewSkills) {
                return (
                  <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                    ⚠️ Adding new skills requires admin approval and verification documents
                  </div>
                );
              }
              return null;
            })()}
          </>
        ) : (
          <>
            {/* Certificates */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Certificates:</div>
              <ul className="flex flex-wrap gap-2">
                {profile.certificates && profile.certificates.length > 0 ? (
                  profile.certificates.map((cert, i) => (
                    <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                      {cert.name || ''} {cert.issuer ? `by ${cert.issuer}` : ''} {cert.date ? `(${cert.date})` : ''}
                      {cert.url && (
                        <a href={cert.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-700 underline text-xs">
                          Cert
                        </a>
                      )}
                    </li>
                  ))
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </ul>
            </div>
            {/* What I Can Teach */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">What I Can Teach:</div>
              <ul className="flex flex-wrap gap-2">
                {(profile.skillsToTeach || []).length > 0 ? (
                  profile.skillsToTeach.map((s, i) => (
                    <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                      {s.class ? `${s.class} • ` : ''}{s.subject} {s.topic ? `> ${s.topic}` : ''}
                    </li>
                  ))
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </ul>
            </div>
            {/* Experience */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Experience:</div>
              <ul className="list-disc list-inside text-gray-700 text-sm">
                {profile.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp, i) => (
                    <li key={i}>
                      {exp.position ? <span className="font-semibold">{exp.position}</span> : null}
                      {exp.company ? ` at ${exp.company}` : ''}
                      {exp.duration ? ` (${exp.duration})` : ''}
                      {exp.description ? `: ${exp.description}` : ''}
                    </li>
                  ))
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserInfoSection;
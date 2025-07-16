import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../../config.js';
import { STATIC_COURSES, STATIC_UNITS, STATIC_TOPICS } from '../../constants/teachingData';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [userForModal, setUserForModal] = useState(null);
  const [username, setUsername] = useState('');
  const [skillsToTeach, setSkillsToTeach] = useState([{ subject: '', topic: '', subtopic: '' }]);
  const [role, setRole] = useState('learner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to check if profile is incomplete
  const isProfileIncomplete = (user) => {
    return (
      !user?.username ||
      user.username.startsWith('user') ||
      !(user.skillsToTeach && user.skillsToTeach.length)
    );
  };

  // Fetch latest user profile on mount
  useEffect(() => {
    async function fetchAndSetUser() {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          Cookies.set('user', JSON.stringify(user));
          setUserForModal(user);
          setUsername(user?.username || '');
          setSkillsToTeach(
            Array.isArray(user?.skillsToTeach) && user.skillsToTeach.length > 0
              ? user.skillsToTeach
              : [{ subject: '', topic: '', subtopic: '' }]
          );
          setRole(user?.role || 'learner');
          if (isProfileIncomplete(user)) {
            setShowCompleteProfileModal(true);
          } else {
            setShowCompleteProfileModal(false);
          }
        } else {
          setShowCompleteProfileModal(false);
        }
      } catch {
        setShowCompleteProfileModal(false);
      }
    }
    fetchAndSetUser();
  }, []);

  // Handle profile completion and update user data
  const handleCompleteProfile = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        Cookies.set('user', JSON.stringify(user));
        setUserForModal(user);
        setUsername(user?.username || '');
        setSkillsToTeach(
          Array.isArray(user?.skillsToTeach) && user.skillsToTeach.length > 0
            ? user.skillsToTeach
            : [{ subject: '', topic: '', subtopic: '' }]
        );
        setRole(user?.role || 'learner');
        if (isProfileIncomplete(user)) {
          setShowCompleteProfileModal(true);
        } else {
          setShowCompleteProfileModal(false);
          navigate('/home');
        }
      } else {
        setShowCompleteProfileModal(false);
      }
    } catch {
      setShowCompleteProfileModal(false);
    }
  };

  const handleAddSkill = () => {
    setSkillsToTeach([...skillsToTeach, { subject: '', topic: '', subtopic: '' }]);
  };

  const handleRemoveSkill = (idx) => {
    setSkillsToTeach(skillsToTeach.filter((_, i) => i !== idx));
  };

  const handleSkillChange = (idx, field, value) => {
    setSkillsToTeach(skillsToTeach.map((s, i) =>
      i === idx ? { ...s, [field]: value, ...(field === 'subject' ? { topic: '', subtopic: '' } : field === 'topic' ? { subtopic: '' } : {}) } : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if ((role === 'teacher' || role === 'both') && (!skillsToTeach.length || skillsToTeach.some(s => !s.subject || !s.topic || !s.subtopic))) {
      setError('Please select subject, topic, and subtopic for each teaching skill.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          role,
          skillsToTeach,
        }),
      });
      if (res.ok) {
        await handleCompleteProfile();
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!showCompleteProfileModal || !userForModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Complete Your Profile</h2>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <label className="block mb-2">
          Username
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </label>
        <div className="mb-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Register as:</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="role"
                value="teacher"
                checked={role === 'teacher'}
                onChange={() => setRole('teacher')}
              />
              Teacher
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="role"
                value="learner"
                checked={role === 'learner'}
                onChange={() => setRole('learner')}
              />
              Learner
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="role"
                value="both"
                checked={role === 'both'}
                onChange={() => setRole('both')}
              />
              Both
            </label>
          </div>
        </div>
        {(role === 'teacher' || role === 'both') && (
          <div className="mb-2">
            <div className="font-medium mb-1">What I Can Teach</div>
            {skillsToTeach.map((skill, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select
                  className="border rounded px-2 py-1"
                  value={skill.subject}
                  onChange={e => handleSkillChange(idx, 'subject', e.target.value)}
                  required={role === 'teacher' || role === 'both'}
                >
                  <option value="">Select Subject</option>
                  {STATIC_COURSES.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                </select>
                <select
                  className="border rounded px-2 py-1"
                  value={skill.topic}
                  onChange={e => handleSkillChange(idx, 'topic', e.target.value)}
                  required={role === 'teacher' || role === 'both'}
                  disabled={!skill.subject}
                >
                  <option value="">Select Topic</option>
                  {(STATIC_UNITS[skill.subject] || []).map(topic => <option key={topic} value={topic}>{topic}</option>)}
                </select>
                <select
                  className="border rounded px-2 py-1"
                  value={skill.subtopic}
                  onChange={e => handleSkillChange(idx, 'subtopic', e.target.value)}
                  required={role === 'teacher' || role === 'both'}
                  disabled={!skill.topic}
                >
                  <option value="">Select Subtopic</option>
                  {(STATIC_TOPICS[skill.topic] || []).map(subtopic => <option key={subtopic} value={subtopic}>{subtopic}</option>)}
                </select>
                {skillsToTeach.length > 1 && (
                  <button type="button" onClick={() => handleRemoveSkill(idx)} className="text-red-500 ml-1">Remove</button>
                )}
              </div>
            ))}
            <button type="button" onClick={handleAddSkill} className="text-blue-600 underline text-xs mt-1">Add Another</button>
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;
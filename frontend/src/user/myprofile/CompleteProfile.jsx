import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../../config.js';
import { STATIC_COURSES, STATIC_UNITS, STATIC_TOPICS } from '../../constants/teachingData';

const CompleteProfile = ({ onProfileComplete }) => {
  const navigate = useNavigate();
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [userForModal, setUserForModal] = useState(null);
  const [username, setUsername] = useState('');
  const [skillsToTeach, setSkillsToTeach] = useState([{ subject: '', topic: '', subtopic: '' }]);
  const [role, setRole] = useState('learner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isProfileIncomplete = (user) => {
    return (
      !user?.username ||
      user.username.startsWith('user') ||
      !(user.skillsToTeach && user.skillsToTeach.length)
    );
  };

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
          onProfileComplete();
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
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/40 transition-opacity duration-300 ease-in-out">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-xl animate-modal-enter"
      >
        <h2 className="text-3xl font-bold mb-6 text-blue-900">Complete Your Profile</h2>
        {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
        <label className="block mb-4 text-gray-800 text-sm">
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-800 mb-2">Register as:</label>
          <div className="flex gap-4">
            {['teacher', 'learner', 'both'].map((option) => (
              <label key={option} className="flex items-center gap-1 text-gray-800 text-sm">
                <input
                  type="radio"
                  name="role"
                  value={option}
                  checked={role === option}
                  onChange={() => setRole(option)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </label>
            ))}
          </div>
        </div>
        {(role === 'teacher' || role === 'both') && (
          <div className="mb-6">
            <div className="font-medium mb-2 text-gray-800 text-sm">What I Can Teach</div>
            {skillsToTeach.map((skill, idx) => (
              <div key={idx} className="flex gap-2 mb-3">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={skill.subject}
                  onChange={(e) => handleSkillChange(idx, 'subject', e.target.value)}
                  required
                >
                  <option value="">Select Subject</option>
                  {STATIC_COURSES.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={skill.topic}
                  onChange={(e) => handleSkillChange(idx, 'topic', e.target.value)}
                  required
                  disabled={!skill.subject}
                >
                  <option value="">Select Topic</option>
                  {(STATIC_UNITS[skill.subject] || []).map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={skill.subtopic}
                  onChange={(e) => handleSkillChange(idx, 'subtopic', e.target.value)}
                  required
                  disabled={!skill.topic}
                >
                  <option value="">Select Subtopic</option>
                  {(STATIC_TOPICS[skill.topic] || []).map((subtopic) => (
                    <option key={subtopic} value={subtopic}>
                      {subtopic}
                    </option>
                  ))}
                </select>
                {skillsToTeach.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-red-500 text-sm ml-1 hover:text-red-700 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddSkill}
              className="text-blue-600 underline text-xs mt-2 hover:text-blue-800 transition-colors"
            >
              Add Another
            </button>
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-3 rounded-lg mt-4 w-full hover:bg-blue-800 hover:scale-105 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;

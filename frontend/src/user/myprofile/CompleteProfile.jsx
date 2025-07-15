import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../../config.js';
import { STATIC_COURSES, STATIC_UNITS, STATIC_TOPICS } from '../../constants/teachingData';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [skillsToTeach, setSkillsToTeach] = useState([
    { subject: '', topic: '', subtopic: '' }
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!skillsToTeach.length || skillsToTeach.some(s => !s.subject || !s.topic || !s.subtopic)) {
      setError('Please select subject, topic, and subtopic for each teaching skill.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          skillsToTeach,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update profile');
      }
      // Optionally update user cookie
      const updatedUser = await res.json();
      Cookies.set('user', JSON.stringify(updatedUser), { expires: 1 });
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>
        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        <div className="mb-6">
          <label className="block text-gray-700 mb-1">What do you want to teach?</label>
          {skillsToTeach.map((skill, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <select
                className="border rounded px-2 py-1"
                value={skill.subject}
                onChange={e => handleSkillChange(idx, 'subject', e.target.value)}
                required
              >
                <option value="">Select Subject</option>
                {STATIC_COURSES.map(subj => <option key={subj} value={subj}>{subj}</option>)}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={skill.topic}
                onChange={e => handleSkillChange(idx, 'topic', e.target.value)}
                required
                disabled={!skill.subject}
              >
                <option value="">Select Topic</option>
                {(STATIC_UNITS[skill.subject] || []).map(topic => <option key={topic} value={topic}>{topic}</option>)}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={skill.subtopic}
                onChange={e => handleSkillChange(idx, 'subtopic', e.target.value)}
                required
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
        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile; 
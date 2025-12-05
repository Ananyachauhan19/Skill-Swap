import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../../config.js';

const CompleteProfile = ({ onProfileComplete }) => {
  const navigate = useNavigate();
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [userForModal, setUserForModal] = useState(null);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('learner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isProfileIncomplete = (user) => {
    // Incomplete when username missing or auto-generated placeholder
    return !user?.username || user.username.startsWith('user');
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
        setRole(user?.role || 'learner');
        if (isProfileIncomplete(user)) {
          setShowCompleteProfileModal(true);
        } else {
          setShowCompleteProfileModal(false);
          onProfileComplete();
          // Navigate based on role selection
          if (role === 'teacher' || role === 'both') {
            navigate('/apply/tutor');
          } else {
            navigate('/home');
          }
        }
      } else {
        setShowCompleteProfileModal(false);
      }
    } catch {
      setShowCompleteProfileModal(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
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

import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaStar, FaUser } from 'react-icons/fa';
import { BACKEND_URL } from '../../config.js';
import { useAuth } from '../../context/AuthContext';

const PastInterviewSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth() || {};

  useEffect(() => {
    let mounted = true;
    async function fetchPast() {
      setLoading(true); setError('');
      try {
        // Derive past completed interviews for the current user from requests endpoint
        const res = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch past interviews');
        const data = await res.json();
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [...(data.sent || []), ...(data.received || [])];
        const completed = list.filter(iv => iv.status === 'completed');
        completed.sort((a, b) => new Date(b.scheduledAt || b.updatedAt || 0) - new Date(a.scheduledAt || a.updatedAt || 0));
        setItems(completed);
      } catch (e) {
        console.error('PastInterviewSection fetch error:', e);
        if (!mounted) return;
        setError('Could not load past interviews.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (user) fetchPast(); else setLoading(false);
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <section className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 border border-blue-200">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 mt-4">Loading your past interviews...</p>
        </div>
      </section>
    );
  }

  if (!user || error || items.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl shadow-lg p-6 sm:p-8 border border-blue-200">
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-12 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent rounded-full"></div>
        <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 text-center">Your Past Interviews</h2>
        <div className="w-12 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((iv) => {
          const youAreInterviewer = String(iv.assignedInterviewer?._id || iv.assignedInterviewer) === String(user?._id);
          const other = youAreInterviewer ? iv.requester : iv.assignedInterviewer;
          const name = `${other?.firstName || other?.username || 'User'} ${other?.lastName || ''}`.trim();
          const avatar = other?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DBEAFE&color=1E40AF&bold=true`;
          return (
            <div key={iv._id} className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-6 shadow-md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">{iv.company || 'Interview Session'}</h3>
                  <p className="text-sm text-gray-600">{iv.position || 'Position'}</p>
                </div>
                <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">Completed</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover border border-blue-200" />
                <div>
                  <p className="text-xs text-gray-500">{youAreInterviewer ? 'Interviewee' : 'Interviewer'}</p>
                  <p className="text-sm font-semibold text-blue-900">{name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaCalendarAlt className="text-blue-600" />
                <span>{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleString() : 'N/A'}</span>
              </div>
              {iv.rating && (
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-blue-100">
                  <FaStar className="text-yellow-500" />
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < iv.rating ? 'text-yellow-500' : 'text-gray-300'} size={14} />
                  ))}
                  <span className="text-xs text-gray-600 ml-2">{iv.rating}/5</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PastInterviewSection;
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
      <section className="w-full bg-home-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Loading your past interviews...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!user || error || items.length === 0) return null;

  return (
    <section className="w-full bg-home-bg py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-2">Your Past Interviews</h2>
          <p className="text-center text-gray-600">Review your completed interview sessions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((iv) => {
            const youAreInterviewer = String(iv.assignedInterviewer?._id || iv.assignedInterviewer) === String(user?._id);
            const other = youAreInterviewer ? iv.requester : iv.assignedInterviewer;
            const name = `${other?.firstName || other?.username || 'User'} ${other?.lastName || ''}`.trim();
            const avatar = other?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DBEAFE&color=1E40AF&bold=true`;
            return (
              <div key={iv._id} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{iv.company || 'Interview Session'}</h3>
                    <p className="text-sm text-gray-600 mt-1">{iv.position || 'Position'}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-md bg-green-100 text-green-700 font-medium whitespace-nowrap ml-3">Completed</span>
                </div>
                
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                  <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-200" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{youAreInterviewer ? 'Interviewee' : 'Interviewer'}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1 truncate">{name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
                  <FaCalendarAlt className="text-blue-600 flex-shrink-0" />
                  <span className="truncate">{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                </div>
                
                {iv.rating && (
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < iv.rating ? 'text-yellow-500' : 'text-gray-300'} size={16} />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-900 ml-1">{iv.rating}.0</span>
                    <span className="text-xs text-gray-500">/5</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PastInterviewSection;
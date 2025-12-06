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
      <section className="bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-12 border border-slate-200/50 shadow-sm">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
          <p className="text-slate-600 mt-4 text-sm">Loading your past interviews...</p>
        </div>
      </section>
    );
  }

  if (!user || error || items.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-12 border border-slate-200/50 shadow-sm">
      <div className="mb-6 sm:mb-10">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-2 sm:mb-3 tracking-tight">Your Past Interviews</h2>
        <p className="text-center text-slate-500 text-xs sm:text-sm">Review your completed interview sessions</p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {items.map((iv) => {
            const youAreInterviewer = String(iv.assignedInterviewer?._id || iv.assignedInterviewer) === String(user?._id);
            const other = youAreInterviewer ? iv.requester : iv.assignedInterviewer;
            const name = `${other?.firstName || other?.username || 'User'} ${other?.lastName || ''}`.trim();
            const avatar = other?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff&bold=true`;
            return (
              <div key={iv._id} className="bg-white border border-slate-200/50 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-blue-900/30 transition-all hover:shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">{iv.company || 'Interview Session'}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">{iv.position || 'Position'}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-md bg-green-100 text-green-700 font-semibold whitespace-nowrap ml-3">Completed</span>
                </div>
                
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                  <img src={avatar} alt={name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-blue-900/20" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide font-medium">{youAreInterviewer ? 'Interviewee' : 'Interviewer'}</p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-1 truncate">{name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 mb-4">
                  <svg className="w-4 h-4 text-blue-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate">{iv.scheduledAt ? new Date(iv.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                </div>
                
                {iv.rating && (
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < iv.rating ? 'text-yellow-500' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 ml-1">{iv.rating}.0</span>
                    <span className="text-xs text-slate-500">/5</span>
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
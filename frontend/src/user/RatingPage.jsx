import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

const Star = ({ filled, onClick, onMouseEnter, onMouseLeave, size = 36 }) => (
  <button
    type="button"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    className="transition-transform hover:scale-110 focus:outline-none"
    aria-label="Rate"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? '#f59e0b' : 'none'}
      stroke={filled ? '#f59e0b' : '#d1d5db'}
      strokeWidth="2"
      className="drop-shadow-sm"
      width={size}
      height={size}
    >
      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.518 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.977 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.977-2.89a1 1 0 00-1.176 0l-3.977 2.89c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.977-2.89c-.783-.57-.38-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.518-4.674z" />
    </svg>
  </button>
);

const RatingPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('');
  const [pollTries, setPollTries] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/session-requests/${sessionId}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load session');
        const data = await res.json();
  setSession(data);
  setSessionStatus(data?.status || '');
        // If already rated by this role, skip
        const myId = user?._id;
        if (myId) {
          const amRequester = String(data.requester) === String(myId) || String(data.requester?._id) === String(myId);
          const already = amRequester ? data.ratingByRequester || data.rating : data.ratingByTutor;
          if (already) {
            try {
              localStorage.removeItem('pendingRatingSessionId');
            } catch {/* ignore */}
            navigate('/session-requests', { replace: true });
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    if (sessionId) load();
  }, [sessionId, navigate, user]);

  // Poll until session becomes completed (enables submit reliably even on fallback navigation)
  useEffect(() => {
    if (!session || sessionStatus === 'completed' || pollTries > 10) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/session-requests/${sessionId}`, { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          setSession(j);
          setSessionStatus(j?.status || '');
        }
      } finally {
        setPollTries((n) => n + 1);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [session, sessionId, sessionStatus, pollTries]);

  const counterpart = useMemo(() => {
    if (!session || !user) return null;
    const myId = String(user._id);
    const isRequester = String(session.requester?._id || session.requester) === myId;
    return isRequester ? session.tutor : session.requester;
  }, [session, user]);

  const canSubmit = rating > 0 && feedback.trim().length > 0 && !submitting && sessionStatus === 'completed';

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setSubmitting(true);
      const res = await fetch(`${BACKEND_URL}/api/session-requests/rate/${sessionId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to submit rating');
      try {
        localStorage.removeItem('pendingRatingSessionId');
      } catch {/* ignore */}
      navigate('/session-requests', { replace: true });
    } catch (e) {
      setError(e.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent closing or navigating away accidentally before submitting
  useEffect(() => {
    const handler = (e) => {
      if (!session) return; // don't trap before load
      if (rating === 0 || feedback.trim().length === 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [session, rating, feedback]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 pt-16 md:pt-[72px] xl:pt-20 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
            <h1 className="text-white text-2xl font-extrabold">Rate Your Session</h1>
            <p className="text-blue-100 mt-1 text-sm">Please leave a star rating and a short feedback. This is required to continue.</p>
          </div>

          <form onSubmit={submit} className="p-6">
            {loading ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-blue-300 border-t-transparent"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            ) : (
              <>
                {sessionStatus !== 'completed' && (
                  <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm">
                    Finalizing your session… You can review now; submit will enable in a moment.
                  </div>
                )}
                {/* Counterpart details */}
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={counterpart?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent((counterpart?.firstName || '') + ' ' + (counterpart?.lastName || ''))}&background=bfdbfe&color=1e3a8a&bold=true`}
                    alt="User"
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
                  />
                  <div>
                    <p className="text-sm text-gray-500">You are rating</p>
                    <p className="text-lg font-bold text-gray-900">{`${counterpart?.firstName || ''} ${counterpart?.lastName || ''}`.trim() || counterpart?.username || 'User'}</p>
                    <p className="text-xs text-gray-500">{session?.subject} • {session?.topic}</p>
                  </div>
                </div>

                {/* Stars */}
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map((s) => (
                      <Star
                        key={s}
                        filled={s <= (hover || rating)}
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                      />
                    ))}
                  </div>
                  {rating > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                {/* Feedback */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    placeholder="Share what went well and what could improve..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Feedback is required. Be respectful and constructive.</p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${canSubmit ? 'bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900' : 'bg-blue-300 cursor-not-allowed'}`}
                >
                  {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingPage;

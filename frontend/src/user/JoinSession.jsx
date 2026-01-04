import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import VideoCall from '../components/VideoCall.jsx';

const parseStartDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;

  const isoCandidate = `${dateStr} ${timeStr}`;
  let parsed = new Date(isoCandidate);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  const m = String(dateStr).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = m[1];
    const mm = m[2];
    const yyyy = m[3];
    parsed = new Date(`${yyyy}-${mm}-${dd} ${timeStr}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
};

const formatTwo = (n) => String(n).padStart(2, '0');

const formatRemaining = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${formatTwo(hours)}:${formatTwo(minutes)}:${formatTwo(seconds)}`;
};

export default function JoinSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('countdown');
  const [tabVisible, setTabVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kind, setKind] = useState(null); // 'session' | 'request'
  const [data, setData] = useState(null);

  const [now, setNow] = useState(Date.now());
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setTabVisible(false);
    const t = setTimeout(() => setTabVisible(true), 20);
    return () => clearTimeout(t);
  }, [activeTab]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      setError('');
      setData(null);
      setKind(null);

      try {
        const s = await api.get(`/api/sessions/${id}`);
        if (!mounted) return;
        setKind('session');
        setData(s.data);
      } catch (e1) {
        try {
          const r = await api.get(`/api/session-requests/${id}`);
          if (!mounted) return;
          setKind('request');
          setData(r.data);
        } catch (e2) {
          if (!mounted) return;
          const msg = e2?.response?.data?.message || e1?.response?.data?.message || 'Failed to load session.';
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (id) run();

    return () => {
      mounted = false;
    };
  }, [id]);

  const sessionMeta = useMemo(() => {
    if (!data) return null;

    if (kind === 'session') {
      const sessionType = data.sessionType || 'normal';
      const startAt = parseStartDateTime(data.date, data.time);
      const creatorId = data.creator && (data.creator._id || data.creator);
      const invitedId = data.invitedSkillMate && (data.invitedSkillMate._id || data.invitedSkillMate);
      const otherPartyName = (() => {
        if (!user) return '';
        const me = String(user._id);
        if (creatorId && String(creatorId) === me) {
          const invited = data.invitedSkillMate;
          return invited?.name || [invited?.firstName, invited?.lastName].filter(Boolean).join(' ') || invited?.username || '';
        }
        const creator = data.creator;
        return creator?.name || [creator?.firstName, creator?.lastName].filter(Boolean).join(' ') || creator?.username || '';
      })();

      const myRole = (() => {
        if (!user) return null;
        const me = String(user._id);
        if (creatorId && String(creatorId) === me) return 'host';
        if (invitedId && String(invitedId) === me) return 'guest';
        return null;
      })();

      return {
        id: data._id,
        subject: data.subject,
        topic: data.topic,
        status: data.status,
        startAt,
        sessionType,
        myRole,
        otherPartyName,
      };
    }

    if (kind === 'request') {
      const startAt = null;
      const tutorId = data.tutor && (data.tutor._id || data.tutor);
      const requesterId = data.requester && (data.requester._id || data.requester);
      const otherPartyName = (() => {
        if (!user) return '';
        const me = String(user._id);
        if (tutorId && String(tutorId) === me) {
          const requester = data.requester;
          return [requester?.firstName, requester?.lastName].filter(Boolean).join(' ') || requester?.username || '';
        }
        const tutor = data.tutor;
        return [tutor?.firstName, tutor?.lastName].filter(Boolean).join(' ') || tutor?.username || '';
      })();

      const myRole = (() => {
        if (!user) return null;
        const me = String(user._id);
        if (tutorId && String(tutorId) === me) return 'host';
        if (requesterId && String(requesterId) === me) return 'guest';
        return null;
      })();

      return {
        id: data._id,
        subject: data.subject,
        topic: data.topic,
        status: data.status,
        startAt,
        sessionType: 'request',
        myRole,
        otherPartyName,
      };
    }

    return null;
  }, [data, kind, user]);

  const remainingMs = useMemo(() => {
    if (!sessionMeta?.startAt) return 0;
    return sessionMeta.startAt.getTime() - now;
  }, [sessionMeta, now]);

  const isBeforeStart = Boolean(sessionMeta?.startAt) && remainingMs > 0;

  const [coinValidation, setCoinValidation] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!sessionMeta || kind !== 'request') return;
      try {
        const res = await api.get(`/api/session-requests/validate-join/${sessionMeta.id}`);
        if (cancelled) return;
        setCoinValidation(res.data || null);
      } catch (e) {
        if (cancelled) return;
        // Soft-fail: keep join buttons enabled but surface any message if needed
        const msg = e?.response?.data?.message || null;
        setCoinValidation(prev => prev || (msg ? { error: msg } : null));
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [sessionMeta, kind]);

  const canStart = useMemo(() => {
    if (!sessionMeta) return false;
    if (sessionMeta.myRole !== 'host') return false;
    if (sessionMeta.status !== 'approved') return false;
    if (isBeforeStart) return false;
    if (kind === 'request' && coinValidation && coinValidation.hasEnough === false) return false;
    return true;
  }, [sessionMeta, isBeforeStart, kind, coinValidation]);

  const canJoin = useMemo(() => {
    if (!sessionMeta) return false;
    if (sessionMeta.status !== 'active') return false;
    if (isBeforeStart) return false;
    if (kind === 'request' && coinValidation && coinValidation.hasEnough === false) return false;
    return true;
  }, [sessionMeta, isBeforeStart, kind, coinValidation]);

  const handleStart = async () => {
    try {
      if (!sessionMeta) return;
      if (kind === 'request') {
        await api.post(`/api/session-requests/start/${sessionMeta.id}`);
      } else {
        await api.post(`/api/sessions/${sessionMeta.id}/start`);
      }

      // Refresh after start
      setShowVideo(false);
      setLoading(true);
      setError('');
      const s = kind === 'request'
        ? await api.get(`/api/session-requests/${sessionMeta.id}`)
        : await api.get(`/api/sessions/${sessionMeta.id}`);
      setData(s.data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.response?.data?.error || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndCall = async () => {
    // For SessionRequest-based sessions, ending the call must mark it complete.
    if (kind === 'request' && sessionMeta?.id) {
      try {
        await api.post(`/api/session-requests/complete/${sessionMeta.id}`);
        try {
          localStorage.setItem('pendingRatingSessionId', String(sessionMeta.id));
        } catch {
          // ignore
        }
        setShowVideo(false);
        navigate(`/rate/${sessionMeta.id}`);
        return;
      } catch (e) {
        setError(e?.response?.data?.message || 'Failed to complete session');
      }
    }

    setShowVideo(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-16 md:pt-[72px] xl:pt-20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-slate-200 border-t-teal-600 mx-auto shadow-sm"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-teal-600 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 text-slate-700 font-semibold">Preparing your session</div>
          <div className="text-slate-500 text-sm mt-1">Loading details…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-16 md:pt-[72px] xl:pt-20 flex">
        <div className="max-w-3xl w-full mx-auto px-4 py-10">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm">
            <div className="text-rose-700 font-semibold text-lg">Unable to open session</div>
            <div className="text-slate-600 text-sm mt-2">{error}</div>
            <div className="mt-6 flex gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition-colors"
                onClick={() => navigate('/session-requests')}
              >
                Back to Requests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionMeta) {
    return null;
  }

  const title = sessionMeta.sessionType === 'expert' ? 'Expert Session' : 'Join Session';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-16 md:pt-[72px] xl:pt-20">
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    sessionMeta.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : sessionMeta.status === 'approved'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : sessionMeta.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {String(sessionMeta.status || '').toUpperCase()}
                </span>
              </div>
              <div className="text-slate-600 text-sm mt-1">
                <span className="font-medium text-slate-800">{sessionMeta.subject}</span>
                {sessionMeta.topic ? <span> • {sessionMeta.topic}</span> : null}
                {sessionMeta.otherPartyName ? <span> • with {sessionMeta.otherPartyName}</span> : null}
              </div>
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-white text-slate-800 text-sm hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors"
              onClick={() => navigate('/session-requests')}
            >
              Back
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-4 py-2 font-semibold transition-all rounded-lg text-sm ${
                    activeTab === 'schedule' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Scheduled
                </button>
                <button
                  onClick={() => setActiveTab('countdown')}
                  className={`px-4 py-2 font-semibold transition-all rounded-lg text-sm ${
                    activeTab === 'countdown' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Countdown
                </button>
              </div>

              <div className="text-xs text-slate-500">
                {sessionMeta.myRole === 'host' ? 'Host access' : 'Participant access'}
              </div>
            </div>

            <div
              className={`p-5 sm:p-6 transition-opacity duration-300 ${tabVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              {activeTab === 'schedule' ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  {sessionMeta.startAt ? (
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-slate-700 text-sm font-semibold">Scheduled time</div>
                        <div className="text-slate-900 font-bold text-xl mt-1">
                          {String(data.date)} at {String(data.time)}
                        </div>
                        <div className="text-slate-500 text-sm mt-1">
                          Join/Start becomes available at the scheduled time.
                        </div>
                      </div>
                      <div className="text-sm text-slate-700">
                        {isBeforeStart ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                            Waiting for start
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            Time reached
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-700 text-sm">
                      This session has no fixed scheduled time. It will be available when the host starts it.
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                  {sessionMeta.startAt ? (
                    <div className="flex items-center justify-between gap-6 flex-wrap">
                      <div>
                        <div className="text-slate-700 text-sm font-semibold">Countdown</div>
                        <div className="mt-2 flex items-end gap-3">
                          <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            {isBeforeStart ? formatRemaining(remainingMs) : '00:00:00'}
                          </div>
                          <div className="text-xs text-slate-500 mb-1">HH:MM:SS</div>
                        </div>
                        <div className="text-slate-600 text-sm mt-2">
                          {isBeforeStart
                            ? 'Buttons unlock automatically when the timer ends.'
                            : 'If the session is live, you can join now.'}
                        </div>
                      </div>

                      <div className="w-full sm:w-64">
                        <div className="text-xs text-slate-500 mb-2">Availability</div>
                        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isBeforeStart ? 'bg-amber-500 w-1/3 animate-pulse' : 'bg-emerald-500 w-full'
                            }`}
                          />
                        </div>
                        <div className="text-xs text-slate-600 mt-2">
                          {isBeforeStart ? 'Locked until start time' : 'Unlocked'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-700 text-sm">Countdown is not available for this session.</div>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                <div className="text-sm text-slate-600">
                  {sessionMeta.myRole === 'host' ? 'You are the host for this session.' : 'You are invited to this session.'}
                </div>

                <div className="flex gap-2">
                  {sessionMeta.myRole === 'host' && sessionMeta.status === 'approved' && (
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        canStart
                          ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                      onClick={handleStart}
                      disabled={!canStart}
                    >
                      Start Session
                    </button>
                  )}

                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      canJoin
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                    onClick={() => setShowVideo(true)}
                    disabled={!canJoin}
                  >
                    Join Session
                  </button>
                </div>
              </div>

              {isBeforeStart && (
                <div className="mt-4 text-xs text-slate-500">
                  Join/Start is disabled until the scheduled time.
                </div>
              )}

              {kind === 'request' && coinValidation && coinValidation.hasEnough === false && (
                <div className="mt-4 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {`Insufficient ${String(coinValidation.coinType || 'silver').toUpperCase()} balance to join session. `}
                  Please add more coins or create a new request with a different coin type.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-slate-500">
            Keep this page open — it will unlock automatically at the scheduled time.
          </div>
          <button
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors"
            onClick={() => navigate('/session-requests')}
          >
            Go to Session Requests
          </button>
        </div>
      </div>

      {showVideo && canJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          <VideoCall
            sessionId={sessionMeta.id}
            userRole={sessionMeta.myRole === 'host' ? 'teacher' : 'student'}
            username={user?.username || user?.firstName || ''}
            onEndCall={handleEndCall}
            coinType={kind === 'request' ? (data.coinType || 'silver') : 'silver'}
          />
        </div>
      )}
    </div>
  );
}

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useAuth } from '../context/AuthContext.jsx';
import { BACKEND_URL } from '../config.js';
import { useToast } from './ToastContext.js';

// Listens to realtime notifications and raises context toasts
const ToastSocketBridge = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user._id) return;

    // Ensure server knows our user (already in App, but safe here)
    socket.emit('register', user._id);
    socket.emit('join', user._id); // join personal room for notification events

    const onNotification = (n) => {
      if (!n || !n.type) return;
      
      // Re-emit for other components like NotificationSection
      window.dispatchEvent(new CustomEvent('socket-notification', { detail: n }));
      
      // SkillMate notifications
      if (n.type === 'skillmate-requested') {
        const requester = n.requesterName || 'A user';
        addToast({
          title: 'New SkillMate Request',
          message: `${requester} sent you a SkillMate request.`,
          variant: 'info',
          timeout: 0,
          actions: [
            n.skillMateId
              ? {
                  label: 'Approve',
                  variant: 'primary',
                  onClick: async () => {
                    try {
                      await fetch(`${BACKEND_URL}/api/skillmates/requests/approve/${n.skillMateId}` , {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                      });
                      addToast({ title: 'Approved', message: 'You are now SkillMates.', variant: 'success' });
                    } catch {
                      addToast({ title: 'Error', message: 'Failed to approve request.', variant: 'error' });
                    }
                  }
                }
              : { label: 'OK', variant: 'primary' },
          ],
        });
        return;
      }

      if (n.type === 'skillmate-approved') {
        addToast({ title: 'SkillMate Approved', message: n.message || 'Your SkillMate request was approved.', variant: 'success' });
        return;
      }

      if (n.type === 'skillmate-rejected') {
        addToast({ title: 'SkillMate Rejected', message: n.message || 'Your SkillMate request was rejected.', variant: 'error' });
        return;
      }
      // Handle session request to tutor
      if (n.type === 'session-requested') {
        const requester = n.requesterName || 'A learner';
        const subject = n.subject || 'Subject';
        const topic = n.topic || 'Topic';
        addToast({
          title: 'New Session Request',
          message: `${requester} requested a session on ${subject} – ${topic}.`,
          variant: 'info',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate('/session-requests'),
            },
            {
              label: 'Ignore',
              variant: 'ghost',
              onClick: async () => {
                if (!n.sessionId) return;
                try {
                  await fetch(`${BACKEND_URL}/api/session-requests/reject/${n.sessionId}`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                  });
                } catch {
                  // best-effort
                }
              },
            },
          ],
        });
        return;
      }

      if (n.type === 'session-approved') {
        addToast({
          title: 'Request Approved',
          message: 'Your request was approved. You’ll be notified to join when the tutor starts the session.',
          variant: 'success',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate('/session-requests'),
            },
          ],
        });
        return;
      }

      if (n.type === 'session-rejected') {
        addToast({
          title: 'Request Denied',
          message: 'Your request was denied. You may send again if needed.',
          variant: 'error',
          timeout: 0,
          actions: [
            { label: 'Okay', variant: 'primary' },
          ],
        });
        return;
      }

      if (n.type === 'session-started') {
        addToast({
          title: 'Session Started',
          message: 'Your session has started. Join now!',
          variant: 'success',
          timeout: 0,
          actions: [
            {
              label: 'Join Now',
              variant: 'primary',
              onClick: () => {
                try {
                  if (n.sessionId) {
                    const role = (user && n.tutor && user._id === n.tutor._id) ? 'tutor' : 'student';
                    localStorage.setItem('pendingJoinSession', JSON.stringify({ sessionId: n.sessionId, role, ts: Date.now() }));
                  }
                } catch {
                  // ignore write errors
                }
                navigate('/session-requests', { state: { openFromToast: true } });
              },
            },
          ],
        });
        return;
      }

      if (n.type === 'session-completed') {
        // Force rating page for both roles
        if (n.sessionId) {
          try {
            localStorage.setItem('pendingRatingSessionId', String(n.sessionId));
          } catch {
            /* ignore storage write errors */
          }
          navigate(`/rate/${n.sessionId}`);
          return;
        }
      }

      // Interview notifications
      if (n.type === 'interview-requested') {
        const requester = n.requesterName || 'A user';
        addToast({
          title: 'New Interview Request',
          message: `${requester} requested an interview session.`,
          variant: 'info',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate('/interview-requests'),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-approved') {
        addToast({
          title: 'Interview Approved',
          message: 'Your interview request was approved. You'll be notified when the interviewer starts the session.',
          variant: 'success',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate('/interview-requests'),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-rejected') {
        addToast({
          title: 'Interview Denied',
          message: 'Your interview request was denied. You may request again if needed.',
          variant: 'error',
          timeout: 0,
          actions: [
            { label: 'Okay', variant: 'primary' },
          ],
        });
        return;
      }

      if (n.type === 'interview-started') {
        addToast({
          title: 'Interview Started',
          message: 'Your interview has started. Join now!',
          variant: 'success',
          timeout: 0,
          actions: [
            {
              label: 'Join Now',
              variant: 'primary',
              onClick: () => {
                try {
                  if (n.interviewId || n.sessionId) {
                    const interviewId = n.interviewId || n.sessionId;
                    const role = (user && n.interviewer && user._id === n.interviewer._id) ? 'interviewer' : 'interviewee';
                    localStorage.setItem('pendingJoinInterview', JSON.stringify({ interviewId, role, ts: Date.now() }));
                  }
                } catch {
                  // ignore write errors
                }
                navigate('/interview-requests', { state: { openFromToast: true } });
              },
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-cancelled') {
        addToast({
          title: 'Interview Cancelled',
          message: n.message || 'The interview has been cancelled.',
          variant: 'warning',
          timeout: 0,
          actions: [
            { label: 'Okay', variant: 'primary' },
          ],
        });
        return;
      }
    };

    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [user, addToast, navigate]);

  return null;
};

export default ToastSocketBridge;

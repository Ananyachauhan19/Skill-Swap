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
    };

    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [user, addToast, navigate]);

  return null;
};

export default ToastSocketBridge;

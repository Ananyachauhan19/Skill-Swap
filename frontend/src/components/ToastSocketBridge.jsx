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

  const sanitizeToastText = (text) => {
    if (typeof text !== 'string') return text;
    // Strip any localhost/loopback URLs that may have been stored in older notifications.
    // We intentionally remove them rather than replacing to avoid leaking dev URLs in UI.
    return text
      .replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s]*)?/gi, '')
      .replace(/\blocalhost(\:\d+)?(\/[^\s]*)?/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'skillswaphubb@gmail.com').toLowerCase();
  const isAdminUser = !!(user && user.email && user.email.toLowerCase() === adminEmail);
  const interviewRequestsReceivedPath = isAdminUser ? '/admin/interview-requests' : '/session-requests?tab=interview&view=received';
  const interviewRequestsSentPath = isAdminUser ? '/admin/interview-requests' : '/session-requests?tab=interview&view=sent';

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
              label: 'Open Join Page',
              variant: 'primary',
              onClick: () => {
                if (n.sessionId) {
                  navigate(`/join-session/${n.sessionId}`);
                } else {
                  navigate('/session-requests');
                }
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

      // Expert session notifications
      if (n.type === 'expert-session-invited') {
        addToast({
          title: 'Expert Session Invitation',
          message: n.message || 'You have received an expert session invitation.',
          variant: 'info',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate('/session-requests?tab=expert'),
            },
          ],
        });
        return;
      }

        if (n.type === 'expert-session-reminder') {
          addToast({
            title: 'Starting soon',
            message: n.message || 'Your expert session starts in 5 minutes.',
            variant: 'info',
            timeout: 6000,
            actions: [
              {
                label: 'Open Join Page',
                variant: 'primary',
                onClick: () => {
                  if (n.sessionId) {
                    navigate(`/join-session/${n.sessionId}`);
                  } else {
                    navigate('/session-requests?tab=expert');
                  }
                },
              },
            ],
          });
          return;
        }

      if (n.type === 'expert-session-approved') {
        addToast({
          title: 'Expert Session Accepted',
          message: n.message || 'Your expert session invitation was accepted.',
          variant: 'success',
          timeout: 0,
          actions: [
            { label: 'View', variant: 'primary', onClick: () => navigate('/session-requests?tab=expert') },
          ],
        });
        return;
      }

      if (n.type === 'expert-session-rejected') {
        addToast({
          title: 'Expert Session Declined',
          message: n.message || 'Your expert session invitation was declined.',
          variant: 'error',
          timeout: 0,
          actions: [
            { label: 'View', variant: 'primary', onClick: () => navigate('/session-requests?tab=expert') },
          ],
        });
        return;
      }

      // Interview notifications
      if (n.type === 'interview-request-submitted') {
        const company = n.company || 'the company';
        const position = n.position || 'the role';
        const rid = n.requestId ? ` (Request ID: ${n.requestId})` : '';
        addToast({
          title: 'Request Sent Successfully',
          message: `Your mock interview request for ${company} — ${position} has been submitted successfully.${rid}`,
          variant: 'success',
          timeout: 5000,
          actions: [
            {
              label: 'View Requests',
              variant: 'primary',
              onClick: () => navigate(interviewRequestsSentPath),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-assigned') {
        const requester = n.requesterName || 'A candidate';
        const company = n.company || 'a company';
        const position = n.position || 'a role';
        const rid = n.requestId ? ` (Request ID: ${n.requestId})` : '';
        addToast({
          title: 'New Interview Request',
          message: `${requester} requested a mock interview for ${company} — ${position}.${rid}`,
          variant: 'info',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate(interviewRequestsReceivedPath),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-requested') {
        const requester = n.requesterName || 'A user';
        const company = n.company || 'a company';
        const position = n.position || 'a role';
        const rid = n.requestId ? ` (Request ID: ${n.requestId})` : '';
        addToast({
          title: 'New Interview Request',
          message: `${requester} requested a mock interview for ${company} — ${position}.${rid}`,
          variant: 'info',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate(interviewRequestsReceivedPath),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-approved') {
        const company = n.company || 'the company';
        const position = n.position || 'the role';
        const rid = n.requestId ? ` (Request ID: ${n.requestId})` : '';
        addToast({
          title: 'Interview Approved',
          message: `Good news — your mock interview for ${company} — ${position} was approved.${rid}`,
          variant: 'success',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate(interviewRequestsSentPath),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-approved-confirmation') {
        const company = n.company || 'the company';
        const position = n.position || 'the role';
        const rid = n.requestId ? ` (Request ID: ${n.requestId})` : '';
        addToast({
          title: 'Interview Confirmed',
          message: sanitizeToastText(n.message) || `You approved the mock interview for ${company} — ${position}.${rid}`,
          variant: 'success',
          timeout: 0,
          actions: [
            {
              label: 'Check Details',
              variant: 'primary',
              onClick: () => navigate(interviewRequestsReceivedPath),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-rejected') {
        const company = n.company || 'the company';
        const position = n.position || 'the role';
        const rid = n.requestId ? ` (Request ID: ${n.requestId})` : '';
        addToast({
          title: 'Interview Denied',
          message: n.message || `Your mock interview request for ${company} — ${position} was declined.${rid}`,
          variant: 'error',
          timeout: 0,
          actions: [
            { label: 'Okay', variant: 'primary' },
          ],
        });
        return;
      }

      if (n.type === 'interview-scheduled') {
        const company = n.company || 'the company';
        const position = n.position || 'the role';
        const rid = n.requestId ? ` (Request ID: ${n.requestId})` : '';
        addToast({
          title: 'Interview Scheduled',
          message: sanitizeToastText(n.message) || `Your mock interview session for ${company} — ${position} has been scheduled. Check the details and join the session.${rid}`,
          variant: 'success',
          timeout: 0,
          actions: [
            {
              label: 'View Details',
              variant: 'primary',
              onClick: () => navigate('/session-requests?tab=interview&view=sent'),
            },
          ],
        });
        return;
      }

      if (n.type === 'interview-scheduled-confirmation') {
        addToast({
          title: 'Schedule Saved',
          message: sanitizeToastText(n.message) || 'Interview time saved successfully.',
          variant: 'success',
          timeout: 4000,
          actions: [{ label: 'OK', variant: 'primary' }],
        });
        return;
      }

      if (n.type === 'interview-rated') {
        addToast({
          title: 'Interview Rated',
          message: n.message || 'Thanks for your feedback!',
          variant: 'success',
          timeout: 4000,
          actions: [{ label: 'OK', variant: 'primary' }],
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
                const interviewId = n.interviewId || n.sessionId;
                if (interviewId) {
                  navigate(`/interview-call/${interviewId}`);
                } else {
                  navigate(interviewRequestsPath);
                }
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

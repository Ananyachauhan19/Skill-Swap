import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaCheck, 
  FaTimes, 
  FaClock, 
  FaUser, 
  FaPlay, 
  FaVideo, 
  FaUserFriends, 
  FaHandshake,
  FaHome,
  FaBars,
  FaFileAlt
} from 'react-icons/fa';
import { MdMoreVert, MdReport } from 'react-icons/md';
import { BACKEND_URL } from '../config.js';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import SessionRatingModal from '../components/SessionRatingModal.jsx';
import DateTimePicker from '../components/DateTimePicker.jsx';
import { useToast } from '../components/ToastContext';

const SessionRequests = () => {
  const [interviewRequests, setInterviewRequests] = useState({ received: [], sent: [] });
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [requests, setRequests] = useState({ received: [], sent: [] });
  const [expertSessionRequests, setExpertSessionRequests] = useState({ received: [], sent: [] });
  const [skillMateRequests, setSkillMateRequests] = useState({ received: [], sent: [] });
  const [campusRequests, setCampusRequests] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [requestType, setRequestType] = useState('session');
  const [readyToStartSession, setReadyToStartSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [cancelledMessage, setCancelledMessage] = useState('');
  const [interviewBanner, setInterviewBanner] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== 'undefined' && window.innerWidth >= 768);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingContext, setRatingContext] = useState(null); // { sessionId, expertName, sessionType }
  const [negotiationModalState, setNegotiationModalState] = useState({ open: false, request: null });
  const [postponeModalState, setPostponeModalState] = useState({ open: false, request: null });

  // Deep-link support: /session-requests?tab=expert&view=sent
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      const view = params.get('view');
      
      // Set request type from tab param
      if (tab === 'session' || tab === 'expert' || tab === 'skillmate' || tab === 'interview' || tab === 'campus') {
        setRequestType(tab);
      }
      
      // Set active tab from view param
      if (view === 'sent' || view === 'received') {
        setActiveTab(view);
      }
      
      // Legacy support for old URLs without explicit params
      if (tab === 'expert' && !view) {
        setActiveTab('received');
      }
      if (tab === 'interview' && !view) {
        setActiveTab('received');
      }

      const early = params.get('interviewEarly');
      if (early === '1') {
        addToast({
          title: 'Interview join not yet available',
          message: 'You can join your interview 15 minutes before the scheduled time.',
          variant: 'info',
          timeout: 5000,
        });

        // Clean the URL so the message doesn't re-trigger on refresh
        params.delete('interviewEarly');
        const search = params.toString();
        navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
      }
    } catch {
      // ignore
    }
  }, [location.search, location.pathname, addToast, navigate]);

  useEffect(() => {
    const savedActiveSession = localStorage.getItem('activeSession');
    if (savedActiveSession) {
      try {
        const session = JSON.parse(savedActiveSession);
        if (session.status === 'active' || (session.sessionRequest && session.sessionRequest.status === 'active')) {
          setActiveSession(session);
        } else {
          localStorage.removeItem('activeSession');
        }
      } catch {
        localStorage.removeItem('activeSession');
      }
    }
    checkActiveSessionFromBackend();
  }, []);

  const checkActiveSessionFromBackend = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/active`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (
          data.activeSession &&
          ((data.activeSession.status && data.activeSession.status === 'active') ||
            (data.activeSession.sessionRequest && data.activeSession.sessionRequest.status === 'active'))
        ) {
          setActiveSession(data.activeSession);
        } else {
          setActiveSession(null);
          localStorage.removeItem('activeSession');
        }
      }
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    fetchSessionRequests();
    fetchSkillMateRequests();
    fetchInterviewRequests();
    fetchExpertSessionRequests();
    fetchCampusRequests();
  }, []);

  useEffect(() => {
    if (activeSession) {
      const sessionWithTimestamp = {
        ...activeSession,
        timestamp: Date.now(),
      };
      localStorage.setItem('activeSession', JSON.stringify(sessionWithTimestamp));
    } else {
      localStorage.removeItem('activeSession');
    }
  }, [activeSession]);

  useEffect(() => {
    if (!user || !user._id) return;

    socket.emit('register', user._id);

    socket.on('session-request-received', () => {
      fetchSessionRequests();
    });

    socket.on('skillmate-request-received', () => {
      fetchSkillMateRequests();
    });

    socket.on('skillmate-request-approved', () => {
      fetchSkillMateRequests();
    });

    socket.on('skillmate-request-rejected', () => {
      fetchSkillMateRequests();
    });

    socket.on('session-started', (data) => {
      let role = null;
      if (user && data.tutor && user._id === data.tutor._id) role = 'tutor';
      if (user && data.requester && user._id === data.requester._id) role = 'student';
      if (role) {
        const newActiveSession = {
          sessionId: data.sessionId,
          sessionRequest: data.sessionRequest,
          role,
        };
        setActiveSession(newActiveSession);
        setReadyToStartSession(null);
      }
    });

    socket.on('session-cancelled', (data) => {
      setActiveSession(null);
      setReadyToStartSession(null);
      localStorage.removeItem('activeSession');
      setCancelledMessage(data.message || 'Session was cancelled.');
      setTimeout(() => setCancelledMessage(''), 5000);
    });

    socket.on('end-call', ({ sessionId }) => {
      if (activeSession && activeSession.sessionId === sessionId) {
        setActiveSession(null);
        setReadyToStartSession(null);
        localStorage.removeItem('activeSession');
      }
    });

    socket.on('session-completed', ({ sessionId }) => {
      // Close any active call UI
      if (activeSession && activeSession.sessionId === sessionId) {
        setActiveSession(null);
        setReadyToStartSession(null);
        localStorage.removeItem('activeSession');
      }
        if (sessionId) {
          setTimeout(() => {
            try {
              const pending = localStorage.getItem('pendingRatingSessionId');
              if (!pending) {
                localStorage.setItem('pendingRatingSessionId', String(sessionId));
                navigate(`/rate/${sessionId}`);
              }
            } catch {
              navigate(`/rate/${sessionId}`);
            }
          }, 1500);
        }
    });

    socket.on('notification', (notification) => {
      try {
        if (!notification) return;
        const t = notification.type || '';
        if (t.startsWith('interview') || notification.requestId) {
          fetchInterviewRequests();
          fetchSessionRequests();
        }
        if (t.startsWith('expert-session')) {
          fetchExpertSessionRequests();
        }
        // Show toaster for interview schedule/reschedule notifications
        if (t === 'interview-scheduled' || t === 'interview-rescheduled' || t === 'interview-scheduled-confirmation' || t === 'interview-rescheduled-confirmation') {
          const notifUserId = String(notification.userId || notification.userId?._id || '');
          if (user && String(user._id) === notifUserId) {
            const isReschedule = t.includes('rescheduled');
            const isConfirmation = t.includes('confirmation');
            
            addToast({
              title: isReschedule ? (isConfirmation ? 'Interview Rescheduled' : 'Interview Time Changed') : (isConfirmation ? 'Interview Scheduled' : 'New Interview Time'),
              message: notification.message || `Your interview session has been ${isReschedule ? 'rescheduled' : 'scheduled'}.`,
              variant: isConfirmation ? 'info' : 'success',
              timeout: 6000,
              actions: [
                {
                  label: 'View Details',
                  variant: 'primary',
                  onClick: () => navigate('/session-requests?tab=interview&view=received'),
                },
              ],
            });

            setInterviewBanner({
              message: notification.message || `Your interview has been ${isReschedule ? 'rescheduled' : 'scheduled'}`,
              requestId: notification.requestId,
            });
            setTimeout(() => setInterviewBanner(null), 12000);
          }
        }
      } catch {
        // Silent fail
      }
    });

    // Listen for real-time interview time updates
    socket.on('interview-time-update', (data) => {
      console.log('[Socket] Interview time update received:', data);
      
      let title = 'Interview Update';
      let message = data.message || 'Your interview has been updated.';
      let variant = 'info';
      
      // Handle different notification types with detailed information
      switch (data.type) {
        case 'schedule':
        case 'schedule-confirmation':
          title = '? Interview Scheduled';
          message = data.scheduledAt 
            ? `Your mock interview for ${data.position} at ${data.company} is scheduled for ${new Date(data.scheduledAt).toLocaleString()}`
            : data.message || `Interview scheduled for ${data.position} at ${data.company}`;
          variant = 'success';
          break;
          
        case 'reschedule':
        case 'reschedule-confirmation':
          title = '?? Interview Rescheduled';
          message = data.scheduledAt 
            ? `Your interview for ${data.position} at ${data.company} has been rescheduled to ${new Date(data.scheduledAt).toLocaleString()}`
            : data.message || `Interview rescheduled for ${data.position} at ${data.company}`;
          variant = 'warning';
          break;
          
        case 'slots-suggested':
          title = '?? Time Slots Available';
          const slotsCount = data.slots?.length || 0;
          message = `The interviewer has suggested ${slotsCount} time slot${slotsCount !== 1 ? 's' : ''} for your ${data.position} interview at ${data.company}. Please review and select your preferred time.`;
          variant = 'info';
          break;
          
        case 'alternate-slots-suggested':
          title = '?? Alternate Slots Proposed';
          const altSlotsCount = data.slots?.length || 0;
          message = `The candidate has proposed ${altSlotsCount} alternate time slot${altSlotsCount !== 1 ? 's' : ''} for the ${data.position} interview at ${data.company}. ${data.reason ? `Reason: ${data.reason}` : 'Please review and respond.'}`;
          variant = 'warning';
          break;
          
        case 'alternate-rejected':
          title = '? Alternate Slots Declined';
          message = data.message || `Your alternate time slots for ${data.position} at ${data.company} were not available. Please choose from the original suggestions.`;
          variant = 'error';
          break;
          
        default:
          title = '?? Interview Update';
          message = data.message || `Update for your ${data.position} interview at ${data.company}`;
      }
      
      addToast({
        title,
        message,
        variant,
        timeout: 8000,
        actions: [
          {
            label: 'View Details',
            variant: 'primary',
            onClick: () => {
              navigate('/session-requests?tab=interview&view=received');
              // Scroll to the specific request if ID is available
              if (data.requestId) {
                setTimeout(() => {
                  const element = document.getElementById(`interview-${data.requestId}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
                    setTimeout(() => {
                      element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
                    }, 3000);
                  }
                }, 500);
              }
            },
          },
        ],
      });

      // Refetch interview requests to show updated data
      fetchInterviewRequests();
    });

    return () => {
      socket.off('session-request-received');
      socket.off('session-started');
      socket.off('session-cancelled');
      socket.off('end-call');
      socket.off('session-completed');
      socket.off('skillmate-request-received');
      socket.off('skillmate-request-approved');
      socket.off('skillmate-request-rejected');
      socket.off('notification');
      socket.off('interview-time-update');
    };
  }, [user, activeSession, navigate]);

  // Helper function to calculate total pending requests
  const calculateTotalPendingCount = () => {
    // Session requests - pending only
    const sessionPending = [...requests.received, ...requests.sent].filter(
      (req) => req.status === 'pending'
    ).length;

    // Expert session requests - pending only
    const expertPending = [...expertSessionRequests.received, ...expertSessionRequests.sent].filter(
      (req) => req.status === 'pending'
    ).length;

    // SkillMate requests - pending only
    const skillmatePending = [...skillMateRequests.received, ...skillMateRequests.sent].filter(
      (req) => req.status === 'pending'
    ).length;

    // Campus requests - pending only
    const campusPending = [...campusRequests.received, ...campusRequests.sent].filter(
      (req) => req.status === 'pending'
    ).length;

    // Interview requests - pending OR scheduled
    const interviewPending = [...(interviewRequests?.received || []), ...(interviewRequests?.sent || [])].filter(
      (req) => {
        const status = (req.status || '').toLowerCase();
        return status === 'pending' || status === 'scheduled';
      }
    ).length;

    const total = sessionPending + expertPending + skillmatePending + campusPending + interviewPending;
    
    return {
      total,
      session: sessionPending,
      expert: expertPending,
      skillmate: skillmatePending,
      campus: campusPending,
      interview: interviewPending
    };
  };

  // Helper function to notify the navbar about request count changes
  const notifyRequestCountUpdate = () => {
    try {
      const counts = calculateTotalPendingCount();
      
      // 1. Dispatch CustomEvent for same-page updates (instant)
      window.dispatchEvent(new CustomEvent('requestCountChanged', { 
        detail: counts 
      }));
      
      // 2. Emit socket event for cross-page updates (when user is on different page)
      if (socket && user?._id) {
        socket.emit('request-count-update', {
          userId: user._id,
          counts: counts
        });
        console.log('[SessionRequests] ?? Emitted socket event & CustomEvent - Total:', counts.total, 'Details:', counts);
      } else {
        console.log('[SessionRequests] ? Dispatched CustomEvent only - Total:', counts.total, 'Details:', counts);
      }
    } catch (error) {
      console.error('Failed to notify request count update:', error);
    }
  };

  // Notify navbar whenever request data changes - THIS TRIGGERS AUTOMATICALLY!
  useEffect(() => {
    // Calculate and send counts immediately whenever ANY request data changes
    notifyRequestCountUpdate();
    console.log('[SessionRequests] Request data changed, updating navbar count...');
  }, [requests, expertSessionRequests, skillMateRequests, campusRequests, interviewRequests]);

  const fetchSessionRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/all`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Filter to show only requests from the last 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const filterRecent = (requests) => {
          return requests.filter(req => {
            const requestDate = new Date(req.createdAt || req.requestedAt);
            return requestDate >= twoDaysAgo;
          });
        };
        
        setRequests({
          received: filterRecent(data.received || []),
          sent: filterRecent(data.sent || [])
        });
      } else {
        setError('Failed to fetch session requests');
      }
    } catch {
      setError('Failed to fetch session requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillMateRequests = async () => {
    try {
      const receivedResponse = await fetch(`${BACKEND_URL}/api/skillmates/requests/received`, {
        credentials: 'include',
      });

      const sentResponse = await fetch(`${BACKEND_URL}/api/skillmates/requests/sent`, {
        credentials: 'include',
      });

      if (receivedResponse.ok && sentResponse.ok) {
        const receivedData = await receivedResponse.json();
        const sentData = await sentResponse.json();

        setSkillMateRequests({
          received: receivedData,
          sent: sentData,
        });
      }
    } catch {
      // Silent fail
    }
  };

  const fetchInterviewRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/interview/requests`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        
        // Filter to show only requests from the last 2 days,
        // but ALWAYS keep scheduled interviews until they are completed/cancelled.
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        
        const filterRecent = (requests) => {
          return (requests || []).filter((req) => {
            const status = (req.status || '').toLowerCase();

            // Keep scheduled interviews visible regardless of how old the request is,
            // as long as they are not yet marked completed/cancelled/etc.
            if (status === 'scheduled') return true;

            const requestDate = new Date(req.createdAt || req.requestedAt);
            return requestDate >= twoDaysAgo;
          });
        };
        
        setInterviewRequests({
          received: filterRecent(data.received || []),
          sent: filterRecent(data.sent || [])
        });
      }
    } catch {
      // Silent fail
    }
  };

  const fetchExpertSessionRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/expert`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        // Filter to show only requests from the last 2 days (consistent with other tabs)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const filterRecent = (items) => {
          return (items || []).filter((req) => {
            const requestDate = new Date(req.createdAt || req.requestedAt);
            return requestDate >= twoDaysAgo;
          });
        };

        setExpertSessionRequests({
          received: filterRecent(data.received || []),
          sent: filterRecent(data.sent || []),
        });
      }
    } catch {
      // Silent fail
    }
  };

  const fetchCampusRequests = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/campus`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();

        // Filter to show only requests from the last 2 days (consistent with other tabs)
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const filterRecent = (items) => {
          return (items || []).filter((req) => {
            const requestDate = new Date(req.createdAt || req.requestedAt);
            return requestDate >= twoDaysAgo;
          });
        };

        setCampusRequests({
          received: filterRecent(data.received || []),
          sent: filterRecent(data.sent || []),
        });
      }
    } catch {
      // Silent fail
    }
  };

  const handleApprove = async (requestId, type = 'session') => {
    try {
      if (type === 'session') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/approve/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const approvedRequest = requests.received.find((req) => req._id === requestId);
          if (approvedRequest) {
            setReadyToStartSession(approvedRequest);
          }
          addToast({ title: 'Approved', message: 'Request approved successfully.', variant: 'success', timeout: 2500 });
          fetchSessionRequests();
          notifyRequestCountUpdate();
        } else {
          addToast({ title: 'Error', message: 'Failed to approve request.', variant: 'error', timeout: 3000 });
        }
      } else if (type === 'skillmate') {
        socket.emit('approve-skillmate-request', { requestId });
        addToast({ title: 'Approved', message: 'SkillMate request approved.', variant: 'success', timeout: 2500 });
        fetchSkillMateRequests();
        notifyRequestCountUpdate();
      } else if (type === 'campus') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/campus/approve/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          addToast({ title: 'Approved', message: 'Campus request approved successfully.', variant: 'success', timeout: 2500 });
          fetchCampusRequests();
          notifyRequestCountUpdate();
        } else {
          addToast({ title: 'Error', message: 'Failed to approve campus request.', variant: 'error', timeout: 3000 });
        }
      } else if (type === 'expert') {
        const response = await fetch(`${BACKEND_URL}/api/sessions/expert/approve/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          addToast({ title: 'Accepted', message: 'Expert session invitation accepted.', variant: 'success', timeout: 2500 });
          fetchExpertSessionRequests();
          notifyRequestCountUpdate();
        } else {
          addToast({ title: 'Error', message: 'Failed to accept expert invitation.', variant: 'error', timeout: 3000 });
        }
      }
    } catch {
      setError(`Failed to approve ${type} request`);
      addToast({ title: 'Error', message: `Failed to approve ${type} request.`, variant: 'error', timeout: 3000 });
    }
  };

  const handleReject = async (requestId, type = 'session') => {
    try {
      if (type === 'session') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          addToast({ title: 'Rejected', message: 'Request rejected.', variant: 'warning', timeout: 2500 });
          fetchSessionRequests();
          notifyRequestCountUpdate();
        } else {
          addToast({ title: 'Error', message: 'Failed to reject request.', variant: 'error', timeout: 3000 });
        }
      } else if (type === 'skillmate') {
        socket.emit('reject-skillmate-request', { requestId });
        addToast({ title: 'Rejected', message: 'SkillMate request rejected.', variant: 'warning', timeout: 2500 });
        fetchSkillMateRequests();
        notifyRequestCountUpdate();
      } else if (type === 'campus') {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/campus/reject/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          addToast({ title: 'Rejected', message: 'Campus request rejected.', variant: 'warning', timeout: 2500 });
          fetchCampusRequests();
          notifyRequestCountUpdate();
        } else {
          addToast({ title: 'Error', message: 'Failed to reject campus request.', variant: 'error', timeout: 3000 });
        }
      } else if (type === 'expert') {
        const response = await fetch(`${BACKEND_URL}/api/sessions/expert/reject/${requestId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          addToast({ title: 'Declined', message: 'Expert session invitation declined.', variant: 'warning', timeout: 2500 });
          fetchExpertSessionRequests();
          notifyRequestCountUpdate();
        } else {
          addToast({ title: 'Error', message: 'Failed to decline expert invitation.', variant: 'error', timeout: 3000 });
        }
      }
    } catch {
      setError(`Failed to reject ${type} request`);
      addToast({ title: 'Error', message: `Failed to reject ${type} request.`, variant: 'error', timeout: 3000 });
    }
  };

  const handleStartSession = async () => {
    if (readyToStartSession) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/start/${readyToStartSession._id}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          setActiveSession({
            sessionId: data.sessionRequest._id,
            sessionRequest: data.sessionRequest,
            role: 'tutor',
          });
          navigate(`/join-session/${data.sessionRequest._id}`);
        }
      } catch {
        setError('Failed to start session');
      }
    }
  };

  const handleCancelSession = async () => {
    if (activeSession) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/session-requests/cancel/${activeSession.sessionId}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          setActiveSession(null);
          setReadyToStartSession(null);
          localStorage.removeItem('activeSession');
          notifyRequestCountUpdate(); // Notify navbar
        }
      } catch {
        setError('Failed to cancel session');
      }
    }
  };

  const submitSessionRating = async ({ rating, feedback }) => {
    try {
      if (!ratingContext || !ratingContext.sessionId) return;
      const res = await fetch(`${BACKEND_URL}/api/session-requests/rate/${ratingContext.sessionId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to submit rating');
      setShowRatingModal(false);
      setRatingContext(null);
      // Refresh lists to reflect new rating in UIs that show it
      fetchSessionRequests();
      notifyRequestCountUpdate(); // Notify navbar
    } catch (err) {
      alert(err.message || 'Failed to submit rating');
    }
  };

  const handleJoinInterview = (request) => {
    try {
      navigate(`/interview-call/${request._id}`);
    } catch (e) {
      console.error('Failed to join interview', e);
      addToast({
        title: 'Join failed',
        message: 'Unable to open the interview call. Please try again.',
        variant: 'error',
        timeout: 4000,
      });
    }
  };

  const handleRejectInterview = async (requestId) => {
    if (!window.confirm('Are you sure you want to reject this interview request? This action cannot be undone.')) {
      return;
    }

    const reason = window.prompt('Optional: Provide a reason for rejection');

    try {
      const response = await fetch(`${BACKEND_URL}/api/interview/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          requestId,
          reason: reason || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to reject interview');
      }

      addToast({
        title: 'Interview Rejected',
        message: 'The interview request has been rejected.',
        variant: 'warning',
        timeout: 3000,
      });

      // Refresh interview requests
      fetchInterviewRequests();
      notifyRequestCountUpdate();
    } catch (error) {
      console.error('Error rejecting interview:', error);
      addToast({
        title: 'Error',
        message: error.message || 'Failed to reject interview request.',
        variant: 'error',
        timeout: 4000,
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return String(dateString);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-gray-100 text-gray-600 border border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayName = (request, isReceived, type) => {
    if (type === 'expert') {
      const other = isReceived ? request.creator : request.invitedSkillMate;
      if (other) return `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.username || 'User';
      return 'User';
    }
    if (isReceived) {
      const r = request.requester || request.requesterId || request.requesterDetails;
      if (r) return `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.username || 'User';
      return 'User';
    } else {
      const t = request.tutor || request.recipient || request.assignedInterviewer || request.recipientDetails;
      if (t) return `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.username || 'User';
      return 'User';
    }
  };

  const ScheduleInterviewInline = ({ request, onScheduled }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    const submitSchedule = async () => {
      if (!date || !time) {
        addToast({
          title: 'Missing time',
          message: 'Please select both a date and a time.',
          variant: 'warning',
          timeout: 3500,
        });
        return;
      }
      const dt = new Date(`${date}T${time}`);
      
      // Check if the scheduled time is in the past
      if (dt < new Date()) {
        addToast({
          title: 'Invalid time',
          message: 'Cannot schedule an interview in the past. Please select a future date and time.',
          variant: 'error',
          timeout: 4000,
        });
        return;
      }
      
      setLoadingSchedule(true);
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/schedule`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request._id, scheduledAt: dt.toISOString() }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.message || 'Failed to schedule');
        
        const scheduledTimeStr = dt.toLocaleString();
        addToast({
          title: 'Interview Scheduled',
          message: `Successfully scheduled for ${scheduledTimeStr}. The candidate has been notified.`,
          variant: 'success',
          timeout: 6000,
          actions: [
            {
              label: 'View Details',
              variant: 'primary',
              onClick: () => navigate('/session-requests?tab=interview&view=received'),
            },
          ],
        });
        
        // Refresh the interview requests list
        onScheduled && onScheduled();
        fetchInterviewRequests();
        notifyRequestCountUpdate();
      } catch (err) {
        console.error(err);
        addToast({
          title: 'Scheduling failed',
          message: err?.message || 'Unable to schedule the interview. Please try again.',
          variant: 'error',
          timeout: 4500,
        });
      } finally {
        setLoadingSchedule(false);
      }
    };

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-56 min-w-[14rem]">
          <DateTimePicker
            date={date}
            time={time}
            onChange={(d, t) => {
              setDate(d);
              setTime(t);
            }}
          />
        </div>
        <button
          className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={submitSchedule}
          disabled={loadingSchedule}
        >
          {loadingSchedule ? 'Scheduling...' : 'Schedule'}
        </button>
      </div>
    );
  };

  const RequestCard = ({ request, isReceived, type }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    
    const getUserForProfile = () => {
      if (type === 'expert') {
        return isReceived ? request.creator : request.invitedSkillMate;
      }
      if (isReceived) {
        return request.requester || request.requesterId || request.requesterDetails;
      } else {
        return request.tutor || request.recipient || request.assignedInterviewer || request.recipientDetails;
      }
    };
    
    const handleReportClick = () => {
      navigate('/report', {
        state: {
          request: {
            _id: request._id,
            type: type,
            status: request.status,
            subject: request.subject,
            topic: request.topic,
            company: request.company,
            position: request.position,
            message: request.message,
            createdAt: request.createdAt,
            scheduledAt: request.scheduledAt
          },
          reportedUser: getUserForProfile(),
          isReceived: isReceived
        }
      });
      setMenuOpen(false);
    };
    
    const handleUsernameClick = () => {
      const userForProfile = getUserForProfile();
      if (userForProfile && userForProfile.username) {
        navigate(`/profile/${userForProfile.username}`);
      }
    };
    
    return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            type === 'skillmate' 
              ? 'bg-purple-50' 
              : type === 'expert'
                ? 'bg-indigo-50'
                : type === 'campus'
                  ? 'bg-blue-50'
                  : 'bg-teal-50'
          }`}>
            {type === 'skillmate' ? (
              <FaUserFriends className="text-purple-600 text-sm" />
            ) : type === 'expert' ? (
              <FaUserFriends className="text-indigo-600 text-sm" />
            ) : type === 'campus' ? (
              <FaUser className="text-blue-600 text-sm" />
            ) : (
              <FaUser className="text-teal-600 text-sm" />
            )}
          </div>
          <div>
            <h3 
              className="text-sm font-semibold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleUsernameClick}
              title="View profile"
            >
              {getDisplayName(request, isReceived, type)}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              {type === 'expert' ? (
                isReceived ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    Expert session invitation
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    Expert session created
                  </>
                )
              ) : type === 'campus' ? (
                isReceived ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Campus session request
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    Campus session requested
                  </>
                )
              ) : isReceived ? (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Requested from you
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  Requested by you
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(request.status || 'pending')}`}>
            {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
          </span>
          {isReceived && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="More options"
              >
                <MdMoreVert className="text-slate-600" size={18} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                    <button
                      onClick={handleReportClick}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                    >
                      <MdReport size={16} />
                      Report
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {(request.subject || request.topic || type === 'skillmate') && (
        <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
          {type === 'skillmate' ? (
            <p className="text-xs text-slate-600 font-medium flex items-center gap-2">
              <FaHandshake className="text-purple-500" />
              Connection request for skill sharing
            </p>
          ) : (
            <div className="text-xs text-slate-600 space-y-1">
              {request.subject && (
                <div className="flex items-start gap-2">
                  <span className={`font-medium min-w-[50px] ${type === 'expert' ? 'text-indigo-700' : 'text-teal-700'}`}>Subject:</span>
                  <span className="text-slate-700">{request.subject}</span>
                </div>
              )}
              {request.topic && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-teal-700 min-w-[50px]">Topic:</span>
                  <span className="text-slate-700">{request.topic}</span>
                </div>
              )}
            </div>
          )}
          {request.message && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 italic">"{request.message}"</p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
            <FaClock className="text-slate-500" size={10} />
          </div>
          <span className="font-medium">{formatDate(request.createdAt)}</span>
        </div>

        <div className="flex gap-2">
          {(type === 'session' || type === 'expert') && (request.status === 'approved' || request.status === 'active') && (
            <button
              onClick={() => navigate(`/join-session/${request._id}`)}
              className={`${
                type === 'expert'
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
              } px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5`}
            >
              <FaVideo size={10} /> Join Session
            </button>
          )}
          {type === 'skillmate' && (
            <button
              onClick={() => {
                const otherUser = isReceived ? request.requester : request.recipient;
                navigate(`/profile/${otherUser?.username || otherUser?._id}`);
              }}
              className="bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-teal-200"
            >
              <FaUser size={10} /> View Profile
            </button>
          )}
          {isReceived && request.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(request._id, type)}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-emerald-200"
              >
                <FaCheck size={10} /> Approve
              </button>
              <button
                onClick={() => handleReject(request._id, type)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-rose-200"
              >
                <FaTimes size={10} /> Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
    );
  };

  // Helper function to check if expired interview should be removed (2 days after expiry)
  const shouldRemoveExpiredInterview = (request) => {
    if (request.status === 'scheduled' && request.scheduledAt) {
      try {
        const scheduledTime = new Date(request.scheduledAt).getTime();
        const expiryTime = scheduledTime + 12 * 60 * 60 * 1000; // 12 hours after scheduled
        const removalTime = expiryTime + 2 * 24 * 60 * 60 * 1000; // 2 days after expiry
        return Date.now() >= removalTime;
      } catch {
        return false;
      }
    }
    return false;
  };

  const InterviewRequestCard = ({ request, isReceived }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    
    const isPending = request.status === 'pending';
    const isAssignedInterviewer =
      user &&
      request.assignedInterviewer &&
      String(user._id) === String(request.assignedInterviewer._id || request.assignedInterviewer);

    // Check if this is a sent request waiting for admin assignment (status='pending' and no assignedInterviewer)
    const waitingForAdminAssignment = !isReceived && request.status === 'pending' && !request.assignedInterviewer;

    // Check if interview is expired (12 hours after scheduled time)
    let isExpired = false;
    let canJoinInterview = false;
    if (request.status === 'scheduled' && request.scheduledAt) {
      try {
        const scheduledTime = new Date(request.scheduledAt).getTime();
        const expiryTime = scheduledTime + 12 * 60 * 60 * 1000; // 12 hours after scheduled time
        const joinOpenTime = scheduledTime - 15 * 60 * 1000; // 15 minutes before
        
        isExpired = Date.now() >= expiryTime;
        canJoinInterview = Date.now() >= joinOpenTime && !isExpired;
      } catch {
        canJoinInterview = false;
      }
    }

    // Determine display status based on context
    let displayStatus = request.status;
    let displayLabel = '';
    
    if (isExpired) {
      displayStatus = 'expired';
      displayLabel = 'Expired';
    } else if (waitingForAdminAssignment) {
      displayStatus = 'pending';
      displayLabel = 'Waiting for Admin Assignment';
    } else if (request.status === 'assigned' && isAssignedInterviewer) {
      // Interviewer sees 'assigned' as 'pending' (waiting for them to schedule)
      displayStatus = 'pending';
      displayLabel = 'Pending';
    } else if (request.status === 'assigned' && !isReceived) {
      // Requester sees 'assigned' as assigned (admin assigned an interviewer)
      displayStatus = 'assigned';
      displayLabel = 'Assigned';
    } else {
      displayLabel = displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1);
    }
    
    const handleReportClick = () => {
      const reportedUser = isReceived ? request.requester : request.assignedInterviewer;
      navigate('/report', {
        state: {
          request: {
            _id: request._id,
            type: 'interview',
            status: request.status,
            company: request.company,
            position: request.position,
            message: request.message,
            createdAt: request.createdAt,
            scheduledAt: request.scheduledAt
          },
          reportedUser: reportedUser,
          isReceived: isReceived
        }
      });
      setMenuOpen(false);
    };
    
    const handleUsernameClick = () => {
      const targetUser = isReceived ? request.requester : request.assignedInterviewer;
      if (targetUser && targetUser.username) {
        navigate(`/profile/${targetUser.username}`);
      }
    };

    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <FaUser className="text-amber-600 text-sm" />
            </div>
            <div>
              <h3 
                className="text-sm font-semibold text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={handleUsernameClick}
                title="View profile"
              >
                {isReceived
                  ? `${request.requester?.firstName || ''} ${request.requester?.lastName || ''}`.trim()
                  : `${request.assignedInterviewer?.firstName || ''} ${request.assignedInterviewer?.lastName || ''}`.trim()}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                {isReceived 
                  ? (isAssignedInterviewer ? 'Interview request received' : 'Interviewer response received') 
                  : 'Awaiting interviewer assignment'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(displayStatus)}`}>
              {displayLabel}
            </span>
            {isReceived && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                  title="More options"
                >
                  <MdMoreVert className="text-slate-600" size={18} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                      <button
                        onClick={handleReportClick}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2"
                      >
                        <MdReport size={16} />
                        Report
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Show helper message for requests waiting for admin assignment */}
        {waitingForAdminAssignment && (
          <div className="mb-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Admin Review:</strong> Our admin will assign you a suitable interviewer soon. You'll be notified once an interviewer is assigned.
            </p>
          </div>
        )}
        
        {/* Show helper message when interviewer has responded */}
        {isReceived && !isAssignedInterviewer && request.assignedInterviewer && (
          <div className="mb-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700">
              <strong>Interviewer Response:</strong> {request.assignedInterviewer.firstName || 'The interviewer'} has responded to your interview request.
            </p>
          </div>
        )}

        {/* Show postpone information */}
        {request.status === 'scheduled' && request.postponedBy && request.postponeReason && (
          <div className="mb-3 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Interview Rescheduled:</strong> This interview was rescheduled by the interviewer.
            </p>
            {request.originalScheduledAt && (
              <p className="text-xs text-blue-600 mt-1">
                Original time: {new Date(request.originalScheduledAt).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-blue-600 mt-1 italic">"{request.postponeReason}"</p>
          </div>
        )}

        <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
          <div className="flex items-start gap-2 text-xs">
            <span className="font-medium text-amber-700 min-w-[60px]">Company:</span>
            <span className="text-slate-700 font-medium">{request.company || '�'}</span>
          </div>
          <div className="flex items-start gap-2 text-xs">
            <span className="font-medium text-amber-700 min-w-[60px]">Position:</span>
            <span className="text-slate-700 font-medium">{request.position || '�'}</span>
          </div>
          {request.message && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-500 italic">"{request.message}"</p>
            </div>
          )}
          {request.resumeUrl && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <a
                  href={request.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  <FaFileAlt size={12} />
                  View Resume
                </a>
                <span className="text-slate-400">•</span>
                <a
                  href={request.resumeUrl}
                  download={request.resumeFileName || 'resume.pdf'}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Download
                </a>
                <span className="text-xs text-slate-500">
                  ({request.resumeFileName || 'resume.pdf'})
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
              <FaClock className="text-slate-500" size={10} />
            </div>
            <span className="font-medium">{formatDate(request.scheduledAt || request.createdAt)}</span>
          </div>

          <div className="flex gap-2">
            {request.status === 'scheduled' && !isExpired ? null : isExpired ? null : (
              <>
                <button
                  onClick={() => setNegotiationModalState({ open: true, request })}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-amber-200"
                >
                  <FaClock size={10} />
                  {isAssignedInterviewer ? 'Suggest / Manage Time' : 'Choose Interview Time'}
                </button>
                {/* Reject button for interviewers */}
                {isAssignedInterviewer && request.status !== 'rejected' && request.status !== 'completed' && request.status !== 'cancelled' && (
                  <button
                    onClick={() => handleRejectInterview(request._id)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-red-200"
                  >
                    <FaTimes size={10} />
                    Reject
                  </button>
                )}
              </>
            )}
            {request.status === 'scheduled' && !isExpired && (
              <>
                <button
                  onClick={() => handleJoinInterview(request)}
                  disabled={!canJoinInterview}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaVideo size={10} />
                  {canJoinInterview ? 'Join Interview' : 'Join available 15 min before'}
                </button>
                {/* Postpone button for interviewers only */}
                {isAssignedInterviewer && (
                  <button
                    onClick={() => setPostponeModalState({ open: true, request })}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border border-blue-200"
                  >
                    <FaClock size={10} />
                    Postpone
                  </button>
                )}
              </>
            )}
            {isExpired && (
              <div className="text-xs text-slate-500 italic">
                Interview expired 12 hours after scheduled time
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const InterviewTimeNegotiationModal = () => {
    const { open, request } = negotiationModalState;
    const [role, setRole] = useState('');
    const [interviewerSlots, setInterviewerSlots] = useState([]);
    const [alternateSlots, setAlternateSlots] = useState([]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
      if (!open || !request || !user) return;
      const isInterviewer = request.assignedInterviewer && (String(request.assignedInterviewer._id || request.assignedInterviewer) === String(user._id));
      setRole(isInterviewer ? 'interviewer' : 'requester');
      setInterviewerSlots(request.interviewerSuggestedSlots || []);
      setAlternateSlots(request.requesterAlternateSlots || []);
      setReason(request.requesterAlternateReason || '');
      setErrorMsg('');
    }, [open, request, user]);

    if (!open || !request) return null;

    const close = () => {
      setNegotiationModalState({ open: false, request: null });
    };

    const addSlot = (target, setter) => {
      setter((prev) => {
        if (prev.length >= 2) return prev;
        return [...prev, { start: '', end: '' }];
      });
    };

    const updateSlot = (setter, index, field, value) => {
      setter((prev) =>
        prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
      );
    };

    const submitInterviewerSlots = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const payloadSlots = interviewerSlots
          .filter((s) => s.start)
          .slice(0, 2)
          .map((s) => ({ start: s.start, end: s.end || s.start }));
        if (payloadSlots.length === 0) {
          setErrorMsg('Add at least one time slot');
          setLoading(false);
          return;
        }
        const res = await fetch(`${BACKEND_URL}/api/interview/suggest-slots`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request._id, slots: payloadSlots }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to suggest slots');
        close();
        fetchInterviewRequests();
        notifyRequestCountUpdate();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to suggest slots');
      } finally {
        setLoading(false);
      }
    };

    const requesterAcceptSlot = async (slotIndex) => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`${BACKEND_URL}/api/interview/requester/accept-slot`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request._id, slotIndex }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to accept slot');
        close();
        fetchInterviewRequests();
        fetchSessionRequests();
        notifyRequestCountUpdate();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to accept slot');
      } finally {
        setLoading(false);
      }
    };

    const requesterSubmitAlternates = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const payloadSlots = alternateSlots
          .filter((s) => s.start)
          .slice(0, 2)
          .map((s) => ({ start: s.start, end: s.end || s.start }));
        if (payloadSlots.length === 0) {
          setErrorMsg('Add at least one alternate slot');
          setLoading(false);
          return;
        }
        if (!reason.trim()) {
          setErrorMsg('Please provide a reason for unavailability');
          setLoading(false);
          return;
        }
        const res = await fetch(`${BACKEND_URL}/api/interview/requester/alternate-slots`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request._id, slots: payloadSlots, reason }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to submit alternate slots');
        close();
        fetchInterviewRequests();
        notifyRequestCountUpdate();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to submit alternate slots');
      } finally {
        setLoading(false);
      }
    };

    const interviewerAcceptAlternate = async (slotIndex) => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`${BACKEND_URL}/api/interview/interviewer/accept-alternate`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request._id, slotIndex }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to accept alternate slot');
        close();
        fetchInterviewRequests();
        fetchSessionRequests();
        notifyRequestCountUpdate();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to accept alternate slot');
      } finally {
        setLoading(false);
      }
    };

    const interviewerRejectAlternate = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`${BACKEND_URL}/api/interview/interviewer/reject-alternate`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: request._id }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Failed to reject alternate slots');
        close();
        fetchInterviewRequests();
        notifyRequestCountUpdate();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to reject alternate slots');
      } finally {
        setLoading(false);
      }
    };

    const formatSlot = (slot) => {
      try {
        const start = slot.start ? new Date(slot.start) : null;
        const end = slot.end ? new Date(slot.end) : null;
        if (!start) return '';
        if (!end || end.getTime() === start.getTime()) {
          return start.toLocaleString();
        }
        return `${start.toLocaleString()} - ${end.toLocaleTimeString()}`;
      } catch {
        return '';
      }
    };

    const canSuggestAlternates =
      role === 'requester' &&
      request.negotiationStatus === 'awaiting_requester' &&
      (!request.requesterAlternateSlots || request.requesterAlternateSlots.length === 0);

    const canAcceptFromOriginal =
      role === 'requester' &&
      request.negotiationStatus === 'awaiting_requester' &&
      request.interviewerSuggestedSlots &&
      request.interviewerSuggestedSlots.length > 0;

    const canInterviewerAcceptAlternates =
      role === 'interviewer' &&
      request.negotiationStatus === 'awaiting_interviewer' &&
      request.requesterAlternateSlots &&
      request.requesterAlternateSlots.length > 0;

    const canInterviewerSuggest =
      role === 'interviewer' &&
      (!request.interviewerSuggestedSlots || request.interviewerSuggestedSlots.length === 0) &&
      (request.status === 'pending' || request.status === 'assigned');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-5 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">
                  {role === 'interviewer' ? 'Manage Interview Time' : 'Choose Interview Time'}
                </h3>
                <p className="text-sm text-blue-100 mt-1.5 flex items-center gap-2">
                  <FaClock className="text-blue-200" />
                  Negotiation is one-time only. You can suggest up to 2 time slots.
                </p>
              </div>
              <button 
                onClick={close} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg px-4 py-3 flex items-start gap-3">
                <FaTimes className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

          {/* Interviewer view: suggest or respond to alternates */}
          {role === 'interviewer' && (
            <div className="space-y-5">
              {request.interviewerSuggestedSlots && request.interviewerSuggestedSlots.length > 0 && !canInterviewerSuggest && (
                <div className="border-2 border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                      <FaClock className="text-white text-sm" />
                    </div>
                    <p className="font-bold text-slate-900">Your Suggested Slots</p>
                  </div>
                  <div className="space-y-2.5">
                    {request.interviewerSuggestedSlots.map((slot, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 font-medium flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-blue-900 rounded-full"></div>
                        {formatSlot(slot)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canInterviewerSuggest && (
                <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                      <FaClock className="text-white text-sm" />
                    </div>
                    <p className="font-bold text-slate-900">Suggest up to 2 Time Slots</p>
                  </div>
                  {interviewerSlots.map((slot, idx) => (
                    <div key={idx} className="mb-3">
                      <DateTimePicker
                        date={slot.start ? slot.start.split('T')[0] : ''}
                        time={slot.start ? slot.start.split('T')[1]?.slice(0,5) : ''}
                        onChange={(d, t) =>
                          updateSlot(setInterviewerSlots, idx, 'start', d && t ? `${d}T${t}` : '')
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                  {interviewerSlots.length < 2 && (
                    <button
                      type="button"
                      onClick={() => addSlot('interviewer', setInterviewerSlots)}
                      className="text-blue-900 hover:text-blue-800 text-sm font-semibold flex items-center gap-2 mt-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <span className="text-lg">+</span>
                      Add Slot
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={submitInterviewerSlots}
                    disabled={loading}
                    className="mt-4 w-full bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white px-5 py-3 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        Send to Candidate
                      </>
                    )}
                  </button>
                </div>
              )}


              {request.requesterAlternateSlots && request.requesterAlternateSlots.length > 0 && (
                <div className="border-2 border-amber-100 rounded-xl p-5 bg-gradient-to-br from-amber-50 to-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                      <FaClock className="text-white text-sm" />
                    </div>
                    <p className="font-bold text-slate-900">Candidate's Alternate Slots</p>
                  </div>
                  {request.requesterAlternateReason && (
                    <div className="mb-3 bg-white border-l-4 border-amber-500 rounded-r-lg px-4 py-3">
                      <p className="text-xs text-slate-500 mb-1 font-semibold">Reason for unavailability:</p>
                      <p className="text-sm text-slate-700">{request.requesterAlternateReason}</p>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {request.requesterAlternateSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                          <span className="text-sm text-slate-700 font-medium">{formatSlot(slot)}</span>
                        </div>
                        {canInterviewerAcceptAlternates && (
                          <button
                            type="button"
                            onClick={() => interviewerAcceptAlternate(idx)}
                            className="ml-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                          >
                            <FaCheck className="text-xs" />
                            Accept
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {canInterviewerAcceptAlternates && (
                    <button
                      type="button"
                      onClick={interviewerRejectAlternate}
                      className="mt-4 w-full bg-white hover:bg-rose-50 border-2 border-rose-200 text-rose-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <FaTimes />
                      Reject Both Alternate Slots
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Requester view */}
          {role === 'requester' && (
            <div className="space-y-5">
              {(!request.interviewerSuggestedSlots || request.interviewerSuggestedSlots.length === 0) && (
                <div className="border-2 border-blue-100 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-white text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <FaClock className="text-blue-900 text-3xl" />
                  </div>
                  <p className="text-lg text-slate-800 font-bold mb-2">Waiting for Interview Times</p>
                  <p className="text-sm text-slate-600">The interviewer will suggest time slots soon.</p>
                  <p className="text-xs text-slate-500 mt-2">You'll be notified when slots are available.</p>
                </div>
              )}

              {request.interviewerSuggestedSlots && request.interviewerSuggestedSlots.length > 0 && (
                <div className="border-2 border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                      <FaClock className="text-white text-sm" />
                    </div>
                    <p className="font-bold text-slate-900">Interviewer's Suggested Slots</p>
                  </div>
                  <div className="space-y-2.5">
                    {request.interviewerSuggestedSlots.map((slot, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-blue-900 rounded-full"></div>
                          <span className="text-sm text-slate-700 font-medium">{formatSlot(slot)}</span>
                        </div>
                        {canAcceptFromOriginal && (
                          <button
                            type="button"
                            onClick={() => requesterAcceptSlot(idx)}
                            className="ml-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                          >
                            <FaCheck className="text-xs" />
                            Accept
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {request.alternateSlotsRejected && (
                    <div className="mt-3 bg-rose-50 border-l-4 border-rose-500 rounded-r-lg px-4 py-3">
                      <p className="text-xs text-rose-700 font-semibold">
                        ?? Your alternate slots were rejected. Please select from the available options above.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {canSuggestAlternates && (
                <div className="border-2 border-blue-100 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center shadow-md">
                      <FaClock className="text-white text-lg" />
                    </div>
                    <p className="font-bold text-lg text-slate-900">Suggest up to 2 Alternate Slots</p>
                  </div>
                  {alternateSlots.map((slot, idx) => (
                    <div key={idx} className="mb-3">
                      <DateTimePicker
                        date={slot.start ? slot.start.split('T')[0] : ''}
                        time={slot.start ? slot.start.split('T')[1]?.slice(0,5) : ''}
                        onChange={(d, t) =>
                          updateSlot(setAlternateSlots, idx, 'start', d && t ? `${d}T${t}` : '')
                        }
                        className="w-full"
                      />
                    </div>
                  ))}
                  {alternateSlots.length < 2 && (
                    <button
                      type="button"
                      onClick={() => addSlot('alternate', setAlternateSlots)}
                      className="text-blue-700 hover:text-blue-800 text-sm font-semibold flex items-center gap-2 mt-2 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                    >
                      <span className="text-lg">+</span>
                      Add Alternate Slot
                    </button>
                  )}
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please explain why you're not available for the suggested times..."
                    className="mt-4 w-full border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 text-sm resize-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={requesterSubmitAlternates}
                    disabled={loading}
                    className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-3 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        Send Alternates to Interviewer
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 bg-blue-50 border-l-4 border-blue-900 rounded-r-lg p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                {role === 'interviewer'
                  ? 'If the requester does not select any slot within 12 hours of your suggestion, the first suggested slot will be auto-scheduled.'
                  : 'If you do not select any slot within 12 hours of the interviewer\'s suggestion, the first suggested slot will be auto-scheduled.'}
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    );
  };

  const PostponeInterviewModal = () => {
    const { open, request } = postponeModalState;
    const [newScheduledAt, setNewScheduledAt] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
      if (!open || !request) return;
      setNewScheduledAt('');
      setReason('');
      setErrorMsg('');
    }, [open, request]);

    if (!open || !request) return null;

    const close = () => {
      setPostponeModalState({ open: false, request: null });
    };

    const handleSubmit = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        if (!newScheduledAt) {
          setErrorMsg('Please select a new date and time');
          setLoading(false);
          return;
        }

        if (!reason.trim()) {
          setErrorMsg('Please provide a reason for postponing');
          setLoading(false);
          return;
        }

        // Convert to full ISO datetime string with seconds
        const fullDatetime = newScheduledAt.includes(':') && newScheduledAt.split(':').length === 2
          ? `${newScheduledAt}:00`
          : newScheduledAt;

        console.log('[Postpone] Sending request:', {
          requestId: request._id,
          newScheduledAt: fullDatetime,
          reason: reason.trim()
        });

        const res = await fetch(`${BACKEND_URL}/api/interview/postpone`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestId: request._id,
            newScheduledAt: fullDatetime,
            reason: reason.trim(),
          }),
        });

        const data = await res.json().catch(() => ({}));
        console.log('[Postpone] Response:', { ok: res.ok, status: res.status, data });
        if (!res.ok) throw new Error(data.message || 'Failed to postpone interview');

        addToast('Interview postponed successfully', 'success');
        close();
        fetchInterviewRequests();
        notifyRequestCountUpdate();
      } catch (err) {
        setErrorMsg(err.message || 'Failed to postpone interview');
        addToast(err.message || 'Failed to postpone interview', 'error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-5 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Postpone Interview</h3>
                <p className="text-sm text-blue-100 mt-1.5 flex items-center gap-2">
                  <FaClock className="text-blue-200" />
                  Reschedule this interview to a new time
                </p>
              </div>
              <button 
                onClick={close} 
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {errorMsg && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border-l-4 border-red-500 rounded-lg px-4 py-3 flex items-start gap-3">
                <FaTimes className="text-red-500 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Current scheduled time */}
            {request.scheduledAt && (
              <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500 font-semibold mb-1">Current Scheduled Time:</p>
                <p className="text-sm text-slate-800 font-bold">
                  {new Date(request.scheduledAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* New date time picker */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                New Date & Time <span className="text-red-500">*</span>
              </label>
              <DateTimePicker
                date={newScheduledAt ? newScheduledAt.split('T')[0] : ''}
                time={newScheduledAt ? newScheduledAt.split('T')[1]?.slice(0,5) : ''}
                onChange={(d, t) => {
                  if (d && t) {
                    setNewScheduledAt(`${d}T${t}`);
                  } else {
                    setNewScheduledAt('');
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Reason textarea */}
            <div className="mb-5">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Reason for Postponing <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please explain why you need to reschedule this interview..."
                className="w-full border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg px-4 py-3 text-sm resize-none transition-colors"
              />
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 text-white px-5 py-3 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Postponing...
                </>
              ) : (
                <>
                  <FaCheck />
                  Confirm Postpone
                </>
              )}
            </button>

            <div className="mt-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  The candidate will be notified via email, in-app notification, and toaster about the new interview time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const username = user ? user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center pt-16 md:pt-[72px] xl:pt-20">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-teal-600 mx-auto shadow-sm"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FaUserFriends className="text-teal-600 text-xl animate-pulse" />
            </div>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800">Loading Requests</h3>
          <p className="text-slate-500 mt-1 text-sm">Please wait while we fetch your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 pt-16 md:pt-[72px] xl:pt-20">
      <div className="flex relative bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 min-h-screen">
        {/* Sidebar - Sticky positioning (scrolls up when footer appears) */}
        <div
          className="w-60 bg-white text-slate-800 transition-all duration-300 sticky top-20 self-start z-40 overflow-hidden shadow-sm border-r border-slate-200 hidden md:block"
          style={{ 
            height: 'calc(100vh - 80px)',
            maxHeight: 'calc(100vh - 80px)'
          }}
        >
          {/* Sidebar Header - Fixed */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <h2 className="text-base font-semibold text-slate-700">
              Requests Hub
            </h2>
          </div>

          {/* Navigation Buttons - Fixed (No Scroll) */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setRequestType('session');
                setActiveTab('received');
                navigate('/session-requests?tab=session&view=received', { replace: true });
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                requestType === 'session'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <FaVideo className="text-xs" />
              <span className="font-medium">Session Requests</span>
              {([...requests.received, ...requests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {[...requests.received, ...requests.sent].filter((req) => req.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRequestType('expert');
                setActiveTab('received');
                navigate('/session-requests?tab=expert&view=received', { replace: true });
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                requestType === 'expert'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <FaUserFriends className="text-xs" />
              <span className="font-medium">Expert Session Requests</span>
              {([...expertSessionRequests.received, ...expertSessionRequests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {[...expertSessionRequests.received, ...expertSessionRequests.sent].filter((req) => req.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRequestType('skillmate');
                setActiveTab('received');
                navigate('/session-requests?tab=skillmate&view=received', { replace: true });
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                requestType === 'skillmate'
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <FaHandshake className="text-xs" />
              <span className="font-medium">SkillMate Requests</span>
              {([...skillMateRequests.received, ...skillMateRequests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {[...skillMateRequests.received, ...skillMateRequests.sent].filter((req) => req.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRequestType('campus');
                setActiveTab('received');
                navigate('/session-requests?tab=campus&view=received', { replace: true });
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                requestType === 'campus'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <FaUser className="text-xs" />
              <span className="font-medium">Campus Requests</span>
              {([...campusRequests.received, ...campusRequests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {[...campusRequests.received, ...campusRequests.sent].filter((req) => req.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setRequestType('interview');
                setActiveTab('received');
                navigate('/session-requests?tab=interview&view=received', { replace: true });
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm ${
                requestType === 'interview'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <FaUser className="text-xs" />
              <span className="font-medium">Interview Requests</span>
              {([...(interviewRequests?.received || []), ...(interviewRequests?.sent || [])].filter((req) => {
                const status = (req.status || '').toLowerCase();
                return status === 'pending' || status === 'scheduled';
              })).length > 0 && (
                <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                  {[...(interviewRequests?.received || []), ...(interviewRequests?.sent || [])].filter((req) => {
                    const status = (req.status || '').toLowerCase();
                    return status === 'pending' || status === 'scheduled';
                  }).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Sidebar - Fixed overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-transparent md:hidden z-30"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <div
              className="fixed left-0 top-20 bottom-0 w-60 bg-white text-slate-800 z-40 shadow-lg border-r border-slate-200 md:hidden overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-slate-100 bg-white">
                <h2 className="text-base font-semibold flex items-center gap-2 text-slate-700">
                  <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                    <FaHome className="text-teal-600 text-sm" />
                  </div>
                  <span>Requests Hub</span>
                </h2>
              </div>

              {/* Navigation Buttons */}
              <nav className="p-3 space-y-1">
                <button
                  onClick={() => {
                    setRequestType('session');
                    setActiveTab('received');
                    navigate('/session-requests?tab=session&view=received', { replace: true });
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                    requestType === 'session'
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaVideo className={`text-xs ${requestType === 'session' ? 'text-teal-600' : 'text-slate-500'}`} />
                  <span className="font-medium">Session Requests</span>
                  {([...requests.received, ...requests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                    <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                      {[...requests.received, ...requests.sent].filter((req) => req.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setRequestType('expert');
                    setActiveTab('received');
                    navigate('/session-requests?tab=expert&view=received', { replace: true });
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                    requestType === 'expert'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaUserFriends className={`text-xs ${requestType === 'expert' ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span className="font-medium">Expert Session Requests</span>
                  {([...expertSessionRequests.received, ...expertSessionRequests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                    <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                      {[...expertSessionRequests.received, ...expertSessionRequests.sent].filter((req) => req.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setRequestType('skillmate');
                    setActiveTab('received');
                    navigate('/session-requests?tab=skillmate&view=received', { replace: true });
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                    requestType === 'skillmate'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaHandshake className={`text-xs ${requestType === 'skillmate' ? 'text-purple-600' : 'text-slate-500'}`} />
                  <span className="font-medium">SkillMate Requests</span>
                  {([...skillMateRequests.received, ...skillMateRequests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                    <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                      {[...skillMateRequests.received, ...skillMateRequests.sent].filter((req) => req.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setRequestType('campus');
                    setActiveTab('received');
                    navigate('/session-requests?tab=campus&view=received', { replace: true });
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                    requestType === 'campus'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaUser className={`text-xs ${requestType === 'campus' ? 'text-blue-600' : 'text-slate-500'}`} />
                  <span className="font-medium">Campus Requests</span>
                  {([...campusRequests.received, ...campusRequests.sent].filter((req) => req.status === 'pending').length) > 0 && (
                    <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                      {[...campusRequests.received, ...campusRequests.sent].filter((req) => req.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setRequestType('interview');
                    setActiveTab('received');
                    navigate('/session-requests?tab=interview&view=received', { replace: true });
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                    requestType === 'interview'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <FaUser className={`text-xs ${requestType === 'interview' ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span className="font-medium">Interview Requests</span>
                  {([...(interviewRequests?.received || []), ...(interviewRequests?.sent || [])].filter((req) => {
                    const status = (req.status || '').toLowerCase();
                    return status === 'pending' || status === 'scheduled';
                  })).length > 0 && (
                    <span className="ml-auto bg-rose-500 rounded-full h-5 w-5 flex items-center justify-center text-xs font-semibold text-white">
                      {[...(interviewRequests?.received || []), ...(interviewRequests?.sent || [])].filter((req) => {
                        const status = (req.status || '').toLowerCase();
                        return status === 'pending' || status === 'scheduled';
                      }).length}
                    </span>
                  )}
                </button>
              </nav>
            </div>
          </>
        )}

        {/* Main Content - Scrollable */}
        <div className="flex-1 transition-all duration-300 min-h-screen">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 pb-16">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden mb-3 sm:mb-4 p-2 sm:p-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 transition-all text-xs sm:text-sm shadow-md"
          >
            <FaBars size={14} />
            <span className="font-medium">Menu</span>
          </button>

          {/* Page Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 mb-1">
              Manage Your Requests
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              View and manage all your session, skill mate, and interview requests
            </p>
          </div>          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <FaTimes className="text-rose-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Session Ready Banner */}
          {readyToStartSession && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <FaCheck className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">Session Approved!</p>
                  <p className="text-emerald-600 text-xs mt-0.5">Your session is ready to start.</p>
                </div>
              </div>
              <button
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all text-sm"
                onClick={handleStartSession}
              >
                <FaPlay size={12} /> Start Session
              </button>
            </div>
          )}

          {/* Cancelled Message */}
          {cancelledMessage && (
            <div className="mb-4 bg-rose-50 border border-rose-200 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
              <FaTimes className="text-rose-500" />
              <span className="text-rose-700 font-medium">{cancelledMessage}</span>
            </div>
          )}

          {/* Interview Banner */}
          {interviewBanner && (
            <div className="mb-4 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
                  <FaVideo className="text-white" />
                </div>
                <span className="text-amber-800 font-medium text-sm">{interviewBanner.message}</span>
              </div>
              <button
                className="bg-white hover:bg-slate-50 text-amber-700 px-4 py-2 rounded-lg font-medium border border-amber-300 transition-all text-sm"
                onClick={() => setInterviewBanner(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Active Session Banner */}
          {activeSession && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <FaVideo className="text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse border-2 border-white"></div>
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 text-sm">Your session is live!</p>
                  <p className="text-emerald-600 text-xs mt-0.5">Join the video call to start your session</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 text-sm"
                  onClick={() => navigate(`/join-session/${activeSession.sessionId}`)}
                >
                  <FaVideo size={12} /> Join Session
                </button>
                {activeSession.role === 'student' && (
                  <button
                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
                    onClick={handleCancelSession}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mandatory Rating Modal for completed sessions (student only) */}
          <SessionRatingModal
            open={showRatingModal}
            onSubmit={submitSessionRating}
            sessionType={ratingContext?.sessionType || 'Session'}
            expertName={ratingContext?.expertName || ''}
          />

          {/* Tabs */}
          <div className="mb-4 sm:mb-6">
              <div className="inline-flex gap-1 bg-slate-100 p-0.5 sm:p-1 rounded-lg w-full sm:w-auto">
                <button
                  onClick={() => {
                    setActiveTab('received');
                    navigate(`/session-requests?tab=${requestType}&view=received`, { replace: true });
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 font-medium transition-all rounded-lg text-xs sm:text-sm ${
                    activeTab === 'received'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span>Received</span>
                    <span className="px-1 sm:px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-slate-200 text-slate-600">
                      {requestType === 'session'
                        ? requests.received.length
                        : requestType === 'expert'
                          ? expertSessionRequests.received.length
                        : requestType === 'skillmate'
                          ? skillMateRequests.received.length
                        : requestType === 'campus'
                          ? campusRequests.received.length
                          : (interviewRequests?.received || []).length}
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('sent');
                    navigate(`/session-requests?tab=${requestType}&view=sent`, { replace: true });
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 font-medium transition-all rounded-lg text-xs sm:text-sm ${
                    activeTab === 'sent'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span>Sent</span>
                    <span className="px-1 sm:px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-slate-200 text-slate-600">
                      {requestType === 'session'
                        ? requests.sent.length
                        : requestType === 'expert'
                          ? expertSessionRequests.sent.length
                        : requestType === 'skillmate'
                          ? skillMateRequests.sent.length
                        : requestType === 'campus'
                          ? campusRequests.sent.length
                          : (interviewRequests?.sent || []).length}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          

          <div className="space-y-3">
            {requestType === 'session' ? (
              activeTab === 'received' ? (
                requests.received.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaClock className="text-slate-400 text-xl" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">No Received Session Requests</h3>
                    <p className="text-slate-500 text-sm">You haven't received any session requests yet.</p>
                    <p className="text-slate-400 text-xs mt-1">New requests will appear here when they arrive</p>
                  </div>
                ) : (
                  requests.received.map((request) => (
                    <RequestCard key={request._id} request={request} isReceived={true} type="session" />
                  ))
                )
              ) : requests.sent.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaVideo className="text-teal-500 text-xl" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No Sent Session Requests</h3>
                  <p className="text-slate-500 text-sm">You haven't sent any session requests yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Start requesting sessions with tutors!</p>
                </div>
              ) : (
                requests.sent.map((request) => (
                  <RequestCard key={request._id} request={request} isReceived={false} type="session" />
                ))
              )
            ) : requestType === 'expert' ? (
              activeTab === 'received' ? (
                expertSessionRequests.received.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaUserFriends className="text-indigo-500 text-xl" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">No Received Expert Session Requests</h3>
                    <p className="text-slate-500 text-sm">You haven't received any expert session invitations yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Invitations will appear here</p>
                  </div>
                ) : (
                  expertSessionRequests.received.map((request) => (
                    <RequestCard key={request._id} request={request} isReceived={true} type="expert" />
                  ))
                )
              ) : expertSessionRequests.sent.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUserFriends className="text-indigo-500 text-xl" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No Sent Expert Session Requests</h3>
                  <p className="text-slate-500 text-sm">You haven't sent any expert session invitations yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Create an expert session to invite a SkillMate</p>
                </div>
              ) : (
                expertSessionRequests.sent.map((request) => (
                  <RequestCard key={request._id} request={request} isReceived={false} type="expert" />
                ))
              )
            ) : requestType === 'skillmate' ? (
              activeTab === 'received' ? (
                skillMateRequests.received.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaUserFriends className="text-purple-500 text-xl" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">No Received SkillMate Requests</h3>
                    <p className="text-slate-500 text-sm">You haven't received any SkillMate requests yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Connect with others to share skills</p>
                  </div>
                ) : (
                  skillMateRequests.received.map((request) => (
                    <RequestCard key={request._id} request={request} isReceived={true} type="skillmate" />
                  ))
                )
              ) : skillMateRequests.sent.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaHandshake className="text-purple-500 text-xl" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No Sent SkillMate Requests</h3>
                  <p className="text-slate-500 text-sm">You haven't sent any SkillMate requests yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Find SkillMates to connect with!</p>
                </div>
              ) : (
                skillMateRequests.sent.map((request) => (
                  <RequestCard key={request._id} request={request} isReceived={false} type="skillmate" />
                ))
              )
            ) : requestType === 'campus' ? (
              activeTab === 'received' ? (
                campusRequests.received.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaUser className="text-blue-500 text-xl" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">No Received Campus Requests</h3>
                    <p className="text-slate-500 text-sm">You haven't received any campus session requests yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Campus students requests will appear here</p>
                  </div>
                ) : (
                  campusRequests.received.map((request) => (
                    <RequestCard key={request._id} request={request} isReceived={true} type="campus" />
                  ))
                )
              ) : campusRequests.sent.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaVideo className="text-blue-500 text-xl" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">No Sent Campus Requests</h3>
                  <p className="text-slate-500 text-sm">You haven't sent any campus session requests yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Request sessions from your campus dashboard!</p>
                </div>
              ) : (
                campusRequests.sent.map((request) => (
                  <RequestCard key={request._id} request={request} isReceived={false} type="campus" />
                ))
              )
            ) : requestType === 'interview' ? (
              activeTab === 'received' ? (
                (interviewRequests?.received || []).filter(req => !shouldRemoveExpiredInterview(req)).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaUser className="text-amber-500 text-xl" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">No Received Interview Requests</h3>
                    <p className="text-slate-500 text-sm">You haven't received any interview requests yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Interview requests will appear here</p>
                  </div>
                ) : (
                  (interviewRequests?.received || []).filter(req => !shouldRemoveExpiredInterview(req)).map((request) => (
                    <InterviewRequestCard key={request._id} request={request} isReceived={true} />
                  ))
                )
              ) : (
                (interviewRequests?.sent || []).filter(req => !shouldRemoveExpiredInterview(req)).length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaVideo className="text-amber-500 text-xl" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-700 mb-1">No Sent Interview Requests</h3>
                    <p className="text-slate-500 text-sm">You haven't sent any interview requests yet.</p>
                    <p className="text-slate-400 text-xs mt-1">Request mock interviews to practice!</p>
                  </div>
                ) : (
                  (interviewRequests?.sent || []).filter(req => !shouldRemoveExpiredInterview(req)).map((request) => (
                    <InterviewRequestCard key={request._id} request={request} isReceived={false} />
                  ))
                )
              )
            ) : null}
          </div>
        </div>
      </div>
      <InterviewTimeNegotiationModal />
      <PostponeInterviewModal />
    </div>
    </div>
  );
};

export default SessionRequests;

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import ToastNotification from './ToastNotification';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config';

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  const { user } = useAuth();

  const addToast = useCallback((notification) => {
    console.log('🔔 Adding toast:', notification);
    setToasts((prev) => {
      // Check if toast with same requestId already exists
      if (notification.requestId && prev.some(t => t.requestId === notification.requestId)) {
        return prev;
      }
      return [...prev, { ...notification, id: Date.now() + Math.random() }];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const handleIgnoreRequest = useCallback(async (requestId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/reject/${requestId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Request rejected successfully');
        // Remove toast after successful rejection
        setToasts((prev) => prev.filter((toast) => toast.requestId !== requestId));
      } else {
        console.error('❌ Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      console.log('⚠️ No user, not setting up socket listeners');
      return;
    }

    console.log('🔌 Setting up socket listeners for user:', user._id);

    // Listen for session request received (TEACHER receives this)
    const handleSessionRequest = (data) => {
      console.log('🔔 Toast: Received session-requested notification', data);
      addToast({
        type: 'session-requested',
        requesterName: data.requesterName || data.requester?.firstName + ' ' + data.requester?.lastName,
        requestId: data.requestId || data.sessionRequest?._id,
        subject: data.subject,
        topic: data.topic,
        message: data.message,
      });
    };

    // Listen for session approved (STUDENT receives this)
    const handleSessionApproved = (data) => {
      console.log('✅ Toast: Received session-approved notification', data);
      addToast({
        type: 'session-approved',
        requesterName: data.teacherName || data.requesterName,
        sessionId: data.sessionId,
        requestId: data.requestId,
        message: data.message,
      });
    };

    // Listen for session rejected (STUDENT receives this)
    const handleSessionRejected = (data) => {
      console.log('❌ Toast: Received session-rejected notification', data);
      addToast({
        type: 'session-rejected',
        requesterName: data.teacherName || data.requesterName,
        requestId: data.requestId,
        message: data.message,
      });
    };

    // Listen for SkillMate request notifications
    const handleSkillMateRequest = (data) => {
      console.log('🤝 Toast: Received skillmate-requested notification', data);
      addToast({
        type: 'skillmate-requested',
        requesterName: data.requesterName || data.requester?.firstName + ' ' + data.requester?.lastName,
        requestId: data.requestId || data.skillMate?._id,
        message: data.message,
      });
    };

    // General notification handler
    const handleNotification = (notification) => {
      console.log('📬 Toast: Received general notification', notification);
      // Handle general notifications that should show as toasts
      if (['session-requested', 'session-approved', 'session-rejected', 'skillmate-requested'].includes(notification.type)) {
        addToast(notification);
      }
    };

    socket.on('session-request-received', handleSessionRequest);
    socket.on('session-request-approved', handleSessionApproved);
    socket.on('session-request-rejected', handleSessionRejected);
    socket.on('skillmate-request-received', handleSkillMateRequest);
    socket.on('notification', handleNotification);

    console.log('✅ Socket listeners registered');

    return () => {
      console.log('🔌 Cleaning up socket listeners');
      socket.off('session-request-received', handleSessionRequest);
      socket.off('session-request-approved', handleSessionApproved);
      socket.off('session-request-rejected', handleSessionRejected);
      socket.off('skillmate-request-received', handleSkillMateRequest);
      socket.off('notification', handleNotification);
    };
  }, [user, addToast]);

  if (!user) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] max-w-md w-full pointer-events-none">
      <div className="pointer-events-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastNotification
              key={toast.id}
              notification={toast}
              onClose={() => removeToast(toast.id)}
              onIgnore={handleIgnoreRequest}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ToastContainer;

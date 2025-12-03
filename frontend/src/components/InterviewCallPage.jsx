import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InterviewCall from './InterviewCall';
import { useAuth } from '../context/AuthContext.jsx';
import { BACKEND_URL } from '../config';

const InterviewCallPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [userRole, setUserRole] = useState('participant');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterviewDetails = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/interview/requests/${sessionId}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const interview = await res.json();
          // Determine if current user is interviewer or student
          const isInterviewer = String(interview.assignedInterviewer?._id || interview.assignedInterviewer) === String(user?._id);
          setUserRole(isInterviewer ? 'interviewer' : 'student');
        }
      } catch (error) {
        console.error('Failed to fetch interview details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId && user?._id) {
      fetchInterviewDetails();
    } else {
      setIsLoading(false);
    }
  }, [sessionId, user?._id]);

  const handleEnd = () => {
    navigate('/session-requests');
  };

  if (!sessionId) return <div>Invalid session</div>;
  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <InterviewCall 
      sessionId={sessionId} 
      userRole={userRole} 
      username={user?.username || user?.firstName || 'You'} 
      onEnd={handleEnd} 
    />
  );
};

export default InterviewCallPage;

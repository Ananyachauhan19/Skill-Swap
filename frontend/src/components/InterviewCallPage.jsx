import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InterviewCall from './InterviewCall';
import { useAuth } from '../context/AuthContext.jsx';

const InterviewCallPage = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth() || {};

  const handleEnd = () => {
    navigate('/session-requests');
  };

  if (!sessionId) return <div>Invalid session</div>;

  return (
    <InterviewCall sessionId={sessionId} userRole="participant" username={user?.username || user?.firstName || 'You'} onEnd={handleEnd} />
  );
};

export default InterviewCallPage;

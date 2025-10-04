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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-4">
        <InterviewCall sessionId={sessionId} userRole="participant" username={user?.username || user?.firstName || 'You'} onEnd={handleEnd} />
      </div>
    </div>
  );
};

export default InterviewCallPage;

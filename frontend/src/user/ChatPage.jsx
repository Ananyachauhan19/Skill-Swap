import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Chat from '../components/Chat';

const ChatPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const skillMateId = location.state?.skillMateId;

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  // If no skillMateId provided, redirect to home
  if (!skillMateId) {
    navigate('/home');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-8">
      <div className="max-w-4xl mx-auto px-4">
        <Chat skillMateId={skillMateId} onClose={handleClose} />
      </div>
    </div>
  );
};

export default ChatPage;

import React from 'react';
import { useNavigate } from 'react-router-dom';

// Buttons are stateless, just ensure responsive spacing
export const StartLiveStreamButton = ({ onClick }) => {
  return (
    <button
      className="px-6 py-3 bg-green-500 text-white rounded-full font-semibold text-lg shadow hover:bg-green-600 transition-all duration-200 mr-0 sm:mr-4 w-full sm:w-auto"
      onClick={onClick}
      type="button"
    >
      Start a Live Stream
    </button>
  );
};

export const UploadSessionButton = () => {
  const navigate = useNavigate();
  return (
    <button
      className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold text-lg shadow hover:bg-blue-600 transition-all duration-200 w-full sm:w-auto"
      onClick={() => navigate('/uploaded')}
      type="button"
    >
      Upload Your Session
    </button>
  );
};

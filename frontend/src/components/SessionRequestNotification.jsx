import React from 'react';
import { FaClock, FaTimes } from 'react-icons/fa';

const SessionRequestNotification = ({ sessionRequest, requester, onClose }) => {
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid date';
    }
  };

  const requesterName = `${requester?.firstName || 'Unknown'} ${requester?.lastName || ''}`.trim();
  const message = `${requesterName} sent a request to learn ${sessionRequest.topic || 'N/A'}`;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-md max-w-md w-full mx-auto backdrop-blur-sm bg-opacity-90 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <FaClock className="text-blue-500 text-sm" />
          <span className="text-xs text-gray-600 font-medium">
            {formatTime(sessionRequest.createdAt)}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors duration-200"
            aria-label="Close notification"
          >
            <FaTimes className="text-sm" />
          </button>
        )}
      </div>
      <div>
        <p className="text-sm text-gray-700">{message}</p>
        <p className="text-xs text-gray-500 mt-1">
          Check the request section to approve or reject.
        </p>
      </div>
    </div>
  );
};

export default SessionRequestNotification;
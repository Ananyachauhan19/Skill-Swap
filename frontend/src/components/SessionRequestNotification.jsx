import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';

const SessionRequestNotification = ({ sessionRequest, requester, onAccept, onReject, onClose }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
      // Navigate to create session page with request details
      navigate('/create-session', { 
        state: { 
          sessionRequest,
          mode: 'from-request'
        }
      });
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md max-w-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FaClock className="text-blue-500 text-lg" />
          <span className="text-sm text-gray-500">
            {formatTime(sessionRequest.createdAt)}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="text-sm" />
          </button>
        )}
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">
          New Session Request
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            <span className="font-medium">From:</span> {requester?.firstName} {requester?.lastName}
          </p>
          <p>
            <span className="font-medium">Subject:</span> {sessionRequest.subject}
          </p>
          <p>
            <span className="font-medium">Topic:</span> {sessionRequest.topic}
          </p>
          <p>
            <span className="font-medium">Subtopic:</span> {sessionRequest.subtopic}
          </p>
          {sessionRequest.message && (
            <p>
              <span className="font-medium">Message:</span> {sessionRequest.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-1 transition-colors"
        >
          <FaCheck className="text-xs" />
          <span>Accept</span>
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-1 transition-colors"
        >
          <FaTimes className="text-xs" />
          <span>Reject</span>
        </button>
      </div>

      {isProcessing && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Processing...
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionRequestNotification; 
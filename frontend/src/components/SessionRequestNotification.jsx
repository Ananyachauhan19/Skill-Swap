import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaClock } from 'react-icons/fa';

const SessionRequestNotification = ({ sessionRequest, requester, onAccept, onReject, onClose }) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onAccept();
      navigate('/create-session', { 
        state: { 
          sessionRequest,
          mode: 'from-request'
        }
      });
    } catch (error) {
      setError('Failed to accept session request. Please try again.');
      console.error('Accept session error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      await onReject();
    } catch (error) {
      setError('Failed to reject session request. Please try again.');
      console.error('Reject session error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xl max-w-md w-full mx-auto backdrop-blur-sm bg-opacity-90 transition-all duration-300 hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaClock className="text-blue-500 text-lg" />
          <span className="text-sm text-gray-600 font-medium">
            {formatTime(sessionRequest.createdAt)}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors duration-200"
            aria-label="Close notification"
          >
            <FaTimes className="text-base" />
          </button>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          New Session Request
        </h3>
        <div className="text-sm text-gray-700 space-y-3">
          <p className="flex flex-col">
            <span className="font-semibold text-gray-800">From:</span>
            <span>{requester?.firstName || 'Unknown'} {requester?.lastName || ''}</span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-800">Subject:</span>
            <span>{sessionRequest.subject || 'N/A'}</span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-800">Topic:</span>
            <span>{sessionRequest.topic || 'N/A'}</span>
          </p>
          <p className="flex flex-col">
            <span className="font-semibold text-gray-800">Subtopic:</span>
            <span>{sessionRequest.subtopic || 'N/A'}</span>
          </p>
          {sessionRequest.message && (
            <p className="flex flex-col">
              <span className="font-semibold text-gray-800">Message:</span>
              <span className="text-gray-600 italic">{sessionRequest.message}</span>
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-md">
          {error}
        </div>
      )}

      <div className="flex space-x-4">
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-400 text-white px-5 py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
          aria-label="Accept session request"
        >
          <FaCheck className="text-xs" />
          <span>Accept</span>
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white px-5 py-3 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg"
          aria-label="Reject session request"
        >
          <FaTimes className="text-xs" />
          <span>Reject</span>
        </button>
      </div>

      {isProcessing && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center text-sm text-gray-600 font-medium">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500 mr-2"></div>
            Processing...
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionRequestNotification;
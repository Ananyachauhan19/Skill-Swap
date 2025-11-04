import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaVideo, FaHandshake, FaUser, FaClock } from 'react-icons/fa';
import { motion as MotionDiv } from 'framer-motion';

const ToastNotification = ({ notification, onClose, onIgnore }) => {
  const navigate = useNavigate();

  // No auto-dismiss: toast remains until user acts

  const handleCheckDetails = () => {
    if (notification.type === 'session-requested') {
      navigate('/session-requests', { state: { requestType: 'session', activeTab: 'received' } });
    } else if (notification.type === 'session-approved') {
      navigate('/session-requests', { state: { requestType: 'session', activeTab: 'sent' } });
    } else if (notification.type === 'skillmate-requested') {
      navigate('/session-requests', { state: { requestType: 'skillmate', activeTab: 'received' } });
    }
    onClose();
  };

  const handleIgnore = async () => {
    if (notification.type === 'session-requested' && onIgnore) {
      await onIgnore(notification.requestId);
    }
    onClose();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'session-requested':
        return <FaVideo className="text-blue-500 text-2xl" />;
      case 'session-approved':
        return <FaCheck className="text-green-500 text-2xl" />;
      case 'session-rejected':
        return <FaTimes className="text-red-500 text-2xl" />;
      case 'skillmate-requested':
        return <FaHandshake className="text-purple-500 text-2xl" />;
      default:
        return <FaUser className="text-blue-500 text-2xl" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'session-requested':
        return 'from-blue-50 to-blue-100 border-blue-300';
      case 'session-approved':
        return 'from-green-50 to-green-100 border-green-300';
      case 'session-rejected':
        return 'from-red-50 to-red-100 border-red-300';
      case 'skillmate-requested':
        return 'from-purple-50 to-purple-100 border-purple-300';
      default:
        return 'from-gray-50 to-gray-100 border-gray-300';
    }
  };

  const formatMessage = () => {
    if (notification.type === 'session-requested') {
      return (
        <>
          <span className="font-bold text-blue-900">{notification.requesterName}</span>
          {' '}sent you a session request
          {notification.subject && (
            <>
              {' '}for <span className="font-semibold">{notification.subject}</span>
              {notification.topic && <span className="text-gray-600"> ({notification.topic})</span>}
            </>
          )}
        </>
      );
    } else if (notification.type === 'session-approved') {
      return (
        <>
          <span className="font-bold text-green-900">{notification.requesterName}</span>
          {' '}approved your session request!
        </>
      );
    } else if (notification.type === 'session-rejected') {
      return (
        <>
          <span className="font-bold text-red-900">{notification.requesterName}</span>
          {' '}denied your request. You can send again if needed.
        </>
      );
    } else if (notification.type === 'skillmate-requested') {
      return (
        <>
          <span className="font-bold text-purple-900">{notification.requesterName}</span>
          {' '}wants to connect with you as a SkillMate!
        </>
      );
    } else {
      return notification.message || 'New notification';
    }
  };

  return (
    <MotionDiv
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
      className={`bg-gradient-to-r ${getBackgroundColor()} border-2 rounded-2xl shadow-2xl p-4 mb-4 max-w-md w-full`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {notification.type === 'session-requested' && 'New Session Request'}
              {notification.type === 'session-approved' && 'Session Approved!'}
              {notification.type === 'session-rejected' && 'Session Rejected'}
              {notification.type === 'skillmate-requested' && 'New SkillMate Request'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0"
            >
              <FaTimes size={14} />
            </button>
          </div>

          <p className="text-sm text-gray-700 mb-3 line-clamp-2">
            {formatMessage()}
          </p>

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <FaClock size={10} />
            <span>Just now</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {notification.type === 'session-requested' && (
              <>
                <button
                  onClick={handleCheckDetails}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-1"
                >
                  <FaCheck size={12} />
                  Check Details
                </button>
                <button
                  onClick={handleIgnore}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-1"
                >
                  <FaTimes size={12} />
                  Ignore
                </button>
              </>
            )}

            {notification.type === 'session-approved' && (
              <button
                onClick={handleCheckDetails}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-1"
              >
                <FaVideo size={12} />
                Join Session
              </button>
            )}

            {(notification.type === 'skillmate-requested' || notification.type === 'session-rejected') && (
              <button
                onClick={handleCheckDetails}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all transform hover:scale-105 shadow-md"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </MotionDiv>
  );
};

export default ToastNotification;

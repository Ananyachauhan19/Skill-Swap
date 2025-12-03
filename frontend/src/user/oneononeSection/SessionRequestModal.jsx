import React, { useState } from 'react';

// Expect tutor and fromUser in props
const SessionRequestNotification = ({ tutor, fromUser, onAccept, onReject }) => {
  const [status, setStatus] = useState(null); 
  const [showCall, setShowCall] = useState(false);

  if (!tutor || !fromUser) return null;

  if (status === 'accepted') {
    return (
      <div className="flex flex-col gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-2">
        <div className="font-semibold text-green-900">Request Accepted</div>
        <div className="text-green-800 text-sm">
          You accepted the session request from <span className="font-semibold">{fromUser.name}</span>.
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          onClick={() => setShowCall(true)}
        >
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" /></svg>
          </span>
          Start Video Call
        </button>
        {showCall && (
          <div className="mt-2 p-3 bg-blue-100 rounded-lg text-blue-900 text-sm font-medium">(Demo) Video call would start here.</div>
        )}
      </div>
    );
  }
  if (status === 'declined') {
    return (
      <div className="flex flex-col gap-2 p-4 bg-red-50 border border-red-200 rounded-lg mb-2">
        <div className="font-semibold text-red-900">Request Declined</div>
        <div className="text-red-800 text-sm">
          You declined the session request from <span className="font-semibold">{fromUser.name}</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-2">
      <div className="font-semibold text-gray-900">Session Request</div>
      <div className="text-gray-700 text-sm">
        <span className="font-semibold">{fromUser.name}</span> has sent you a session request.
      </div>
      <div className="flex gap-2">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          onClick={() => { setStatus('accepted'); if (onAccept) onAccept(); }}
        >
          Accept
        </button>
        <button
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium transition-colors"
          onClick={() => { setStatus('declined'); if (onReject) onReject(); }}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default SessionRequestNotification;

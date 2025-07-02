import React, { useState } from 'react';

// Expect tutor and fromUser in props
const SessionRequestNotification = ({ tutor, fromUser, onAccept, onReject }) => {
  const [status, setStatus] = useState(null); 
  const [showCall, setShowCall] = useState(false);

  if (!tutor || !fromUser) return null;

  if (status === 'accepted') {
    return (
      <div className="flex flex-col gap-2 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow mb-2 animate-fadeIn">
        <div className="font-semibold text-green-900">Request Accepted</div>
        <div className="text-green-800 text-sm">
          You accepted the session request from <span className="font-semibold">{fromUser.name}</span>.
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-semibold mt-2"
          onClick={() => setShowCall(true)}
        >
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A2 2 0 0122 9.618v4.764a2 2 0 01-2.447 1.894L15 14M4 6v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" /></svg>
          </span>
          Start Video Call
        </button>
        {showCall && (
          <div className="mt-2 p-2 bg-blue-100 rounded text-blue-900 font-semibold">(Demo) Video call would start here.</div>
        )}
      </div>
    );
  }
  if (status === 'declined') {
    return (
      <div className="flex flex-col gap-2 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow mb-2 animate-fadeIn">
        <div className="font-semibold text-red-900">Request Declined</div>
        <div className="text-red-800 text-sm">
          You declined the session request from <span className="font-semibold">{fromUser.name}</span>.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow mb-2 animate-fadeIn">
      <div className="font-semibold text-green-900">Session Request</div>
      <div className="text-green-800 text-sm">
        <span className="font-semibold">{fromUser.name}</span> has sent you a session request.
      </div>
      <div className="flex gap-2 mt-2">
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm font-semibold"
          onClick={() => { setStatus('accepted'); if (onAccept) onAccept(); }}
        >
          Accept
        </button>
        <button
          className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400 text-sm font-semibold"
          onClick={() => { setStatus('declined'); if (onReject) onReject(); }}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default SessionRequestNotification;

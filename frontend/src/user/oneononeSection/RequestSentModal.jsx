import React from 'react';

const RequestSentNotification = ({ tutor, onCancel }) => {
  if (!tutor) return null;
  const handleCancel = () => {
    // Optionally: fire an event to remove this notification from Navbar
    if (typeof onCancel === 'function') {
      onCancel();
    }
    // Optionally: you can also dispatch a custom event here if needed
    // window.dispatchEvent(new CustomEvent('removeRequestSentNotification', { detail: { tutor } }));
  };
  return (
    <div className="flex flex-col gap-2 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-lg shadow mb-2 animate-fadeIn">
      <div className="font-semibold text-blue-900">Request Sent</div>
      <div className="text-blue-800 text-sm">
        Your session request has been sent to <span className="font-semibold">{tutor.name}</span>. Please wait for them to accept.
      </div>
      <div className="flex gap-2 mt-2">
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm font-semibold"
          onClick={handleCancel}
        >
          Cancel Request
        </button>
      </div>
    </div>
  );
};

export default RequestSentNotification;

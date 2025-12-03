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
    <div className="flex flex-col gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg mb-2">
      <div className="font-semibold text-gray-900">Request Sent</div>
      <div className="text-gray-700 text-sm">
        Your session request has been sent to <span className="font-semibold">{tutor.name}</span>. Please wait for them to accept.
      </div>
      <div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          onClick={handleCancel}
        >
          Cancel Request
        </button>
      </div>
    </div>
  );
};

export default RequestSentNotification;

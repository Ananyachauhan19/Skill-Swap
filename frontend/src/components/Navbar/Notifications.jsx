import React from "react";
import NotificationSection from "../NotificationSection";
import RequestSentNotification from "../../user/oneononeSection/RequestSentModal";
import SessionRequestNotification from "../SessionRequestNotification";
import SessionRequestModal from "../../user/oneononeSection/SessionRequestModal";
import { BACKEND_URL } from '../../config.js';

const Notifications = ({ notifications, setNotifications }) => (
  <NotificationSection
    notifications={notifications.map((n, idx) => {
      if (n.type === 'request') {
        return <RequestSentNotification key={idx} tutor={n.tutor} onCancel={n.onCancel} />;
      } else if (n.type === 'session-request') {
        return (
          <SessionRequestNotification
            key={idx}
            sessionRequest={n.sessionRequest}
            requester={n.requester}
            onAccept={n.onAccept}
            onReject={n.onReject}
            onClose={() => setNotifications((prev) => prev.filter((_, i) => i !== idx))}
          />
        );
      } else if (n.type === 'session-request-response') {
        return (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-md max-w-md">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${n.action === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-500">
                {new Date(n.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{n.message}</p>
            <button
              onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== idx))}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        );
      } else if (n.type === 'session-requested') {
        // Accept/Reject handlers
        const handleAccept = async () => {
          await fetch(`${BACKEND_URL}/api/sessions/approve/${n.session._id}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          setNotifications((prev) => prev.filter((_, i) => i !== idx));
        };
        const handleReject = async () => {
          await fetch(`${BACKEND_URL}/api/sessions/reject/${n.session._id}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          setNotifications((prev) => prev.filter((_, i) => i !== idx));
        };
        return (
          <SessionRequestModal
            key={idx}
            tutor={{ name: n.session.creator?.firstName + ' ' + n.session.creator?.lastName }}
            fromUser={{ name: n.session.requester?.name || n.session.requester?.firstName || 'User' }}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        );
      } else if (n.type === 'session') {
        return <SessionRequestModal key={idx} tutor={n.tutor} fromUser={n.fromUser} onAccept={n.onAccept} onReject={n.onReject} />;
      } else if (n.type === 'response') {
        return n.content;
      } else {
        return (
          <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 shadow-md max-w-md">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-500">
                {new Date(n.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{n.message}</p>
            <button
              onClick={() => setNotifications((prev) => prev.filter((_, i) => i !== idx))}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        );
      }
    })}
    onClear={() => setNotifications([])}
    onUpdate={setNotifications}
  />
);

export default Notifications;

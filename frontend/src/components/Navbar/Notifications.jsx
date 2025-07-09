import React from "react";
import NotificationSection from "../NotificationSection";
import RequestSentNotification from "../../user/oneononeSection/RequestSentModal";
import SessionRequestNotification from "../../user/oneononeSection/SessionRequestModal";

const Notifications = ({ notifications, setNotifications }) => (
  <NotificationSection
    notifications={notifications.map((n, idx) => {
      if (n.type === 'request') {
        return <RequestSentNotification key={idx} tutor={n.tutor} onCancel={n.onCancel} />;
      } else if (n.type === 'session-request') {
        // Accept/Reject handlers
        const handleAccept = async () => {
          await fetch(`http://localhost:5000/api/sessions/approve/${n.session._id}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          setNotifications((prev) => prev.filter((_, i) => i !== idx));
        };
        const handleReject = async () => {
          await fetch(`http://localhost:5000/api/sessions/reject/${n.session._id}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          setNotifications((prev) => prev.filter((_, i) => i !== idx));
        };
        return (
          <SessionRequestNotification
            key={idx}
            tutor={{ name: n.session.creator?.firstName + ' ' + n.session.creator?.lastName }}
            fromUser={{ name: n.session.requester?.name || n.session.requester?.firstName || 'User' }}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        );
      } else if (n.type === 'session') {
        return <SessionRequestNotification key={idx} tutor={n.tutor} fromUser={n.fromUser} onAccept={n.onAccept} onReject={n.onReject} />;
      } else if (n.type === 'response') {
        return n.content;
      } else {
        return n.message;
      }
    })}
    onClear={() => setNotifications([])}
    onUpdate={setNotifications}
  />
);

export default Notifications;

import React from "react";
import NotificationSection from "../NotificationSection";
import RequestSentNotification from "../../user/oneononeSection/RequestSentModal";
import SessionRequestNotification from "../../user/oneononeSection/SessionRequestModal";

const Notifications = ({ notifications, setNotifications }) => (
  <NotificationSection
    notifications={notifications.map((n, idx) =>
      n.type === 'request' ? (
        <RequestSentNotification key={idx} tutor={n.tutor} onCancel={n.onCancel} />
      ) : n.type === 'session' ? (
        <SessionRequestNotification
          key={idx}
          tutor={n.tutor}
          fromUser={n.fromUser}
          onAccept={n.onAccept}
          onReject={n.onReject}
        />
      ) : n.type === 'response' ? (
        n.content
      ) : (
        n.message
      )
    )}
    onClear={() => setNotifications([])}
    onUpdate={setNotifications}
  />
);

export default Notifications;

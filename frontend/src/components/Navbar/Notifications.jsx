import React from "react";
import NotificationSection from "../NotificationSection";
import Cookies from 'js-cookie';

const Notifications = ({ notifications, setNotifications }) => {
  // Get current user ID from cookies
  const userCookie = Cookies.get('user');
  const user = userCookie ? JSON.parse(userCookie) : null;
  const userId = user?._id;

  return (
    <NotificationSection userId={userId} />
  );
};

export default Notifications;

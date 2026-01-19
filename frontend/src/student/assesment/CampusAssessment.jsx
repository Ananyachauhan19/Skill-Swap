import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import { BACKEND_URL } from '../../config.js';
import socket from '../../socket.js';
import { useModal } from '../../context/ModalContext.jsx';

import CampusDashboardNavbar from '../CampusDashboardNavbar.jsx';
import AssessmentSection from './AssessmentSection.jsx';

const CampusAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openLogin } = useModal();

  const [activeTab, setActiveTab] = useState('assessment');

  const [isLoggedIn] = useState(!!Cookies.get('user'));
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bronzeCoins, setBronzeCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [campusRequestCount, setCampusRequestCount] = useState(0);
  const coinsRef = useRef(null);

  const isActive = (tab) => activeTab === tab;

  const fetchCoins = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/coins`, {
        credentials: 'include',
      });
      if (response.ok) {
        const payload = await response.json();
        setBronzeCoins(payload.bronze || 0);
        setSilverCoins(payload.silver || 0);
      }
    } catch {
      // ignore
    }
  };

  const fetchCampusRequestCount = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/session-requests/campus`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const received = Array.isArray(data.received) ? data.received : [];
        const sent = Array.isArray(data.sent) ? data.sent : [];
        const all = [...received, ...sent];
        
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const campusPending = all.filter((r) => {
          const status = (r.status || '').toLowerCase();
          if (status !== 'pending') return false;
          const createdAt = new Date(r.createdAt || r.requestedAt);
          return !createdAt || isNaN(createdAt.getTime()) || createdAt >= twoDaysAgo;
        }).length;
        
        setCampusRequestCount(campusPending);
      }
    } catch (error) {
      console.error('Failed to fetch campus request count:', error);
    }
  };

  const handleLoginClick = () => {
    openLogin();
    setTimeout(() => {
      window.dispatchEvent(new Event('authChanged'));
    }, 100);
  };

  useEffect(() => {
    const campusValidated = localStorage.getItem('campusValidated');
    if (!campusValidated) {
      navigate('/campus-dashboard/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch {
        localStorage.removeItem('notifications');
      }
    }

    const userCookie = Cookies.get('user');
    const userData = userCookie ? JSON.parse(userCookie) : null;
    if (userData && userData._id) {
      socket.emit('register', userData._id);
      fetchCoins();
      fetchCampusRequestCount();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Listen for campus request count updates
  useEffect(() => {
    const handleRequestCountChanged = (event) => {
      if (event.detail && typeof event.detail.campus === 'number') {
        setCampusRequestCount(event.detail.campus);
      }
    };

    const handleSocketCountUpdate = (data) => {
      if (data && data.counts && typeof data.counts.campus === 'number') {
        setCampusRequestCount(data.counts.campus);
      }
    };

    const handleSessionRequestEvent = () => {
      fetchCampusRequestCount();
    };

    window.addEventListener('requestCountChanged', handleRequestCountChanged);
    socket.on('request-count-update', handleSocketCountUpdate);
    socket.on('session-request-received', handleSessionRequestEvent);
    socket.on('session-request-updated', handleSessionRequestEvent);

    return () => {
      window.removeEventListener('requestCountChanged', handleRequestCountChanged);
      socket.off('request-count-update', handleSocketCountUpdate);
      socket.off('session-request-received', handleSessionRequestEvent);
      socket.off('session-request-updated', handleSessionRequestEvent);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showCoinsDropdown) return;
    const handleClickOutside = (event) => {
      if (coinsRef.current && !coinsRef.current.contains(event.target)) {
        setShowCoinsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCoinsDropdown]);

  return (
    <>
      <CampusDashboardNavbar
        navigate={navigate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isActive={isActive}
        isLoggedIn={isLoggedIn}
        handleLoginClick={handleLoginClick}
        bronzeCoins={bronzeCoins}
        silverCoins={silverCoins}
        showCoinsDropdown={showCoinsDropdown}
        setShowCoinsDropdown={setShowCoinsDropdown}
        fetchCoins={fetchCoins}
        coinsRef={coinsRef}
        notifications={notifications}
        setNotifications={setNotifications}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        campusRequestCount={campusRequestCount}
      />

      <AssessmentSection />
    </>
  );
};

export default CampusAssessment;

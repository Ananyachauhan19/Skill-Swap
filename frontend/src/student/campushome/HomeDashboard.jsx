import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../../config.js';
import HeroDashboard from './HeroDashboard.jsx';
import SkillThought from './CampusThought.jsx';
import ActivityDashboard from './ActivityDashboard.jsx';
import FeatureDashboard from './FeatureDashboard.jsx';
import CampusLeaderboard from './CampusLeaderboard.jsx';
import CampusDashboardNavbar from '../CampusDashboardNavbar.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import socket from '../../socket.js';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openLogin } = useModal();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');

  const [isLoggedIn] = useState(!!Cookies.get('user'));
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bronzeCoins, setBronzeCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [campusRequestCount, setCampusRequestCount] = useState(0);
  const coinsRef = useRef(null);

  const view = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('view') || 'home';
  }, [location.search]);

  const isActive = (tab) => activeTab === tab;

  // Sync activeTab with current route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/campus/one-on-one')) {
      setActiveTab('oneonone');
    } else if (path.includes('/campus/assessment')) {
      setActiveTab('assessment');
    } else if (path.includes('/campus/reports')) {
      setActiveTab('reports');
    } else if (path.includes('/session-requests')) {
      setActiveTab('requests');
    } else if (path === '/campus-dashboard') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

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
        
        // Filter for last 2 days and pending status
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

    // Listen for session request events to refresh count
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

  useEffect(() => {
    const campusValidated = localStorage.getItem('campusValidated');
    if (!campusValidated) {
      navigate('/campus-dashboard/login', { replace: true });
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${BACKEND_URL}/api/campus-ambassador/student-home`, {
          credentials: 'include',
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.message || `Failed to load dashboard (${res.status})`);
        }

        const payload = await res.json();
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-b from-blue-50/20 via-white to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Loading campus home…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-gradient-to-b from-blue-50/20 via-white to-white flex items-center justify-center px-4">
        <div className="max-w-xl w-full bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Unable to load Campus Home</p>
          <p className="text-xs text-gray-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hero = data?.hero || {};
  const activity = data?.activity || {};
  const thoughts = data?.thoughts || {};

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

      <div className="bg-gradient-to-b from-blue-50/20 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[76px] sm:pt-[88px] pb-14">
          <div className="flex flex-col gap-16 sm:gap-20 lg:gap-24">
            <div className="py-1 sm:py-2">
              <HeroDashboard hero={hero} />
            </div>

            <div className="py-1 sm:py-2">
              <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 sm:px-6 lg:px-8">
                <SkillThought thoughts={Array.isArray(thoughts.items) ? thoughts.items : []} />
              </div>
            </div>

            <div className="py-1 sm:py-2">
              <ActivityDashboard activity={activity} />
            </div>

            <div className="py-1 sm:py-2">
              <CampusLeaderboard />
            </div>

            <div className="py-1 sm:py-2">
              <FeatureDashboard activeView={view} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomeDashboard;

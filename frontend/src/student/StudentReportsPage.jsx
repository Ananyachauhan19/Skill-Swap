import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import CampusDashboardNavbar from './CampusDashboardNavbar';
import StudentReportsTab from './StudentReportsTab';
import { BACKEND_URL } from '../config';

const StudentReportsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('reports');
  const [isLoggedIn] = useState(!!Cookies.get('user'));
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [bronzeCoins, setBronzeCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [campusRequestCount, setCampusRequestCount] = useState(0);
  
  const coinsRef = useRef(null);

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

  // Check for campus validation
  useEffect(() => {
    const campusValidated = localStorage.getItem('campusValidated');
    if (!campusValidated) {
      navigate('/campus-dashboard/login', { replace: true });
      return;
    }
    
    fetchCoins();
    fetchCampusRequestCount();
  }, [navigate]);

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
    } catch (error) {
      console.error('Failed to fetch coins:', error);
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
          const createdAt = new Date(r.createdAt);
          return status === 'pending' && createdAt >= twoDaysAgo;
        });
        setCampusRequestCount(campusPending.length);
      }
    } catch (error) {
      console.error('Failed to fetch campus request count:', error);
    }
  };

  // Close dropdown when clicking outside
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

  const isActive = (tab) => activeTab === tab;

  const handleLoginClick = () => {
    navigate('/campus-dashboard/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
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
      
      <main className="pt-[72px] sm:pt-[80px] px-4 py-6 max-w-7xl mx-auto">
        <StudentReportsTab />
      </main>
    </div>
  );
};

export default StudentReportsPage;

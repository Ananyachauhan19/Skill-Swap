import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { School, Users, BookOpen, Award, ArrowRight, Video } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import VideoCall from '../components/VideoCall';
import { BACKEND_URL } from '../config.js';
import socket from '../socket.js';
import CampusDashboardNavbar from './CampusDashboardNavbar';
import CampusLogin from './CampusLogin';

const StudentCampusDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openLogin } = useModal();
  const { user: authUser } = useAuth();

  const [step, setStep] = useState('input'); // 'input' | 'dashboard'
  const [instituteData, setInstituteData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Navbar states
  const [isLoggedIn] = useState(!!Cookies.get('user'));
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  
  const coinsRef = useRef(null);

  // Check if user already has institute data
  useEffect(() => {
    if (authUser?.instituteId && authUser?.studentId) {
      // User already has campus access
      setStep('dashboard');
    }
  }, [authUser]);

  const handleCampusLoginSuccess = (data) => {
    setInstituteData(data.institute);
    setStudentData(data.user);
    setStep('dashboard');
  };

  // Navbar helper functions
  const fetchCoins = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/coins`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setGoldenCoins(data.golden || 0);
        setSilverCoins(data.silver || 0);
      }
    } catch (error) {
      console.error('Failed to fetch coins:', error);
    }
  };



  const handleLoginClick = () => {
    openLogin();
    setTimeout(() => {
      window.dispatchEvent(new Event('authChanged'));
    }, 100);
  };

  const isActive = (tab) => activeTab === tab;

  // Load notifications and coins
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
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

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



  // Campus ID Input Screen
  if (step === 'input') {
    return <CampusLogin onSuccess={handleCampusLoginSuccess} />;
  }

  // Campus Dashboard Screen
  return (
    <>
      <CampusDashboardNavbar
        navigate={navigate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isActive={isActive}
        isLoggedIn={isLoggedIn}
        handleLoginClick={handleLoginClick}
        goldenCoins={goldenCoins}
        silverCoins={silverCoins}
        showCoinsDropdown={showCoinsDropdown}
        setShowCoinsDropdown={setShowCoinsDropdown}
        fetchCoins={fetchCoins}
        coinsRef={coinsRef}
        notifications={notifications}
        setNotifications={setNotifications}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {activeVideoCall && (
        <VideoCall
          sessionId={activeVideoCall}
          onEndCall={() => {
            setActiveVideoCall(null);
          }}
          userRole="Participant"
        />
      )}

      {/* College Image Banner */}
      <div className="pt-[64px] sm:pt-[72px]">
        <div 
          className="w-full h-64 bg-cover bg-center relative"
          style={{
            backgroundImage: instituteData?.campusBackgroundImage 
              ? `url(${instituteData.campusBackgroundImage})` 
              : 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-end">
            <div className="max-w-7xl mx-auto w-full px-6 pb-6">
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                {instituteData?.instituteName}
              </h2>
              <p className="text-white text-lg mt-2 drop-shadow-md">
                Welcome, {studentData?.firstName} {studentData?.lastName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8 bg-gray-50 min-h-screen">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Dashboard</h3>
            <p className="text-gray-600">Campus dashboard content will appear here.</p>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              <button
                onClick={() => navigate('/campus/one-on-one')}
                className="bg-white p-6 rounded-xl border border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Campus One-on-One</p>
                    <p className="text-sm text-gray-600">Find campus tutors</p>
                  </div>
                </div>
              </button>

              <button className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Campus Students</p>
                    <p className="text-sm text-gray-600">View all students</p>
                  </div>
                </div>
              </button>

              <button className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Campus Rewards</p>
                    <p className="text-sm text-gray-600">View rewards</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'oneonone' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">One on One Sessions</h3>
            <p className="text-gray-600">One-on-one session features will appear here.</p>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Assessment</h3>
            <p className="text-gray-600">Assessment and testing features will appear here.</p>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800">Requests</h3>
            <p className="text-gray-600">Session requests and pending actions will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentCampusDashboard;

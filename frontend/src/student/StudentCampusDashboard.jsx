import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Video, TrendingUp, BarChart3, Users, Award, BookOpen, Calendar, Star } from 'lucide-react';
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

  const [instituteData, setInstituteData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Navbar states
  const [isLoggedIn] = useState(!!Cookies.get('user'));
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  
  const coinsRef = useRef(null);

  // Check for stored campus validation
  useEffect(() => {
    const campusValidated = localStorage.getItem('campusValidated');
    if (!campusValidated) {
      // Redirect to login if not validated
      navigate('/campus-dashboard/login', { replace: true });
      return;
    }

    // Fetch institute data if validated
    const fetchInstituteData = async () => {
      if (authUser?.instituteId) {
        try {
          // Fetch institute data
          const response = await fetch(`${BACKEND_URL}/api/campus-ambassador/my-institute`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setInstituteData(data.institute);
          } else {
            console.error('Failed to fetch institute data:', response.status);
          }

          // Fetch dashboard stats
          const statsResponse = await fetch(`${BACKEND_URL}/api/campus-ambassador/dashboard-stats`, {
            credentials: 'include',
          });
          if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            setDashboardStats(statsData);
          } else {
            console.error('Failed to fetch dashboard stats:', statsResponse.status);
          }
        } catch (error) {
          console.error('Failed to fetch data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    if (authUser?.instituteId && authUser?.studentId) {
      if (authUser?.firstName) {
        setUserName(`${authUser.firstName}${authUser.lastName ? ' ' + authUser.lastName : ''}`);
      }
      fetchInstituteData();
    } else {
      setLoading(false);
    }
  }, [authUser, navigate]);

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

  // Show loading state while fetching
  if (loading && !instituteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campus dashboard...</p>
        </div>
      </div>
    );
  }

  // Get university image dynamically from Cloudinary - using object-position for better framing
  const universityImage = instituteData?.campusBackgroundImage || 
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=80';

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

      {/* Hero Section with University Image - Optimized */}
      <div className="pt-[64px] sm:pt-[72px]">
        <div className="relative w-full h-[200px] sm:h-[220px] md:h-[240px] overflow-hidden">
          {/* Background Image with proper positioning */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${universityImage})`,
              backgroundPosition: 'center 20%', // Start from top 20% of image
              backgroundSize: 'cover',
            }}
          >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>
          </div>
          
          {/* Welcome Text */}
          <div className="relative h-full flex items-end px-4 sm:px-6 md:px-8 pb-4 sm:pb-5">
            <div className="max-w-7xl mx-auto w-full">
              <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg mb-1">
                Welcome, <span className="text-blue-300">{userName || 'Student'}</span>
              </h1>
              <p className="text-white/90 text-base sm:text-lg font-medium drop-shadow-md">
                {instituteData?.instituteName || 'Your Campus Hub'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Quick Stats Cards */}
          {dashboardStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {/* Total Sessions */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">My Sessions</p>
                    <p className="text-xl font-bold text-gray-900">{dashboardStats.studentStats.totalSessions}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Completed Sessions */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Completed</p>
                    <p className="text-xl font-bold text-gray-900">{dashboardStats.studentStats.completedSessions}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Pending Requests */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Pending</p>
                    <p className="text-xl font-bold text-gray-900">{dashboardStats.studentStats.pendingRequests}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Total Students */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Campus Students</p>
                    <p className="text-xl font-bold text-gray-900">{dashboardStats.institute.totalStudents}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Action Cards - Reduced Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            
            {/* Campus 1-on-1 Sessions */}
            <button
              onClick={() => navigate('/campus/one-on-one')}
              className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-300 text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Video className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Campus 1-on-1</h3>
              <p className="text-sm text-gray-500">Find campus tutors</p>
            </button>

            {/* Weekly Assessments */}
            <button
              className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-300 text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Assessments</h3>
              <p className="text-sm text-gray-500">Track performance</p>
            </button>

            {/* My Progress */}
            <button
              className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-300 text-left"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">My Progress</h3>
              <p className="text-sm text-gray-500">View your journey</p>
            </button>
          </div>

          {/* Dynamic Content Sections */}
          {dashboardStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Top Campus Tutors */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-base font-semibold text-gray-900">Top Campus Tutors</h3>
                </div>
                <div className="space-y-2">
                  {dashboardStats.topTutors && dashboardStats.topTutors.length > 0 ? (
                    dashboardStats.topTutors.map((tutor, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {tutor.name?.charAt(0) || 'T'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{tutor.name}</p>
                            <p className="text-xs text-gray-500">{tutor.sessionCount} sessions</p>
                          </div>
                        </div>
                        {tutor.ratingAverage > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium text-gray-700">{tutor.ratingAverage.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No tutors available yet</p>
                  )}
                </div>
              </div>

              {/* Recent Campus Activity */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="space-y-2">
                  {dashboardStats.recentActivity && dashboardStats.recentActivity.length > 0 ? (
                    dashboardStats.recentActivity.map((activity, idx) => (
                      <div key={idx} className="p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                            <p className="text-xs text-gray-500">{activity.topic}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            activity.status === 'completed' ? 'bg-green-50 text-green-700' :
                            activity.status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-gray-50 text-gray-700'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{new Date(activity.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default StudentCampusDashboard;

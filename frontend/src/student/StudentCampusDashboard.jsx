import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { School, Users, BookOpen, Award, ArrowRight } from 'lucide-react';
import Cookies from 'js-cookie';
import { useCampusAmbassador } from '../context/CampusAmbassadorContext';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import MobileMenu from '../components/MobileMenu';
import ProfileDropdown from '../components/ProfileDropdown';
import Notifications from '../components/Navbar/Notifications';
import VideoCall from '../components/VideoCall';
import { BACKEND_URL } from '../config.js';
import socket from '../socket.js';

const StudentCampusDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openLogin } = useModal();
  const { user: authUser, updateUser } = useAuth();
  const { validateCampusId, getInstituteStudents } = useCampusAmbassador();

  const [step, setStep] = useState('input'); // 'input' | 'dashboard'
  const [campusId, setCampusId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [instituteData, setInstituteData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Navbar states
  const [isLoggedIn, setIsLoggedIn] = useState(!!Cookies.get('user'));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCoinsDropdown, setShowCoinsDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [goldenCoins, setGoldenCoins] = useState(0);
  const [silverCoins, setSilverCoins] = useState(0);
  const [user, setUser] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const menuRef = useRef(null);
  const coinsRef = useRef(null);
  const searchRef = useRef(null);

  // Check if user already has institute data
  useEffect(() => {
    if (authUser?.instituteId && authUser?.studentId) {
      loadInstituteDashboard(authUser.studentId);
    }
    
    // Initialize user from cookie
    const userCookie = Cookies.get('user');
    if (userCookie) {
      const userData = JSON.parse(userCookie);
      setUser(userData);
      setIsAvailable(userData.isAvailableForSessions !== false);
    }
  }, [authUser]);

  const loadInstituteDashboard = async (studentId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await validateCampusId(studentId);
      setInstituteData(data.institute);
      setStudentData(data.user);
      
      // Load institute students for filtering
      const studentsData = await getInstituteStudents(data.institute.instituteId);
      setStudents(studentsData.students);
      
      setStep('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateCampusId = async (e) => {
    e.preventDefault();
    if (!campusId.trim()) {
      setError('Please enter your Campus ID');
      return;
    }

    await loadInstituteDashboard(campusId.trim());
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

  const handleToggleAvailability = async () => {
    if (isToggling) return;
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);
    setIsToggling(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/toggle-availability`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setIsAvailable(data.isAvailableForSessions);
        const updatedUser = { ...user, isAvailableForSessions: data.isAvailableForSessions };
        setUser(updatedUser);
        Cookies.set('user', JSON.stringify(updatedUser));
        if (authUser && updateUser) {
          updateUser(updatedUser);
        }
      } else {
        setIsAvailable(!newAvailability);
      }
    } catch (error) {
      setIsAvailable(!newAvailability);
      console.error('Error toggling availability:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const username = searchQuery.trim();
      navigate(`/profile/${username}`);
      setSearchQuery('');
      setShowSuggestions(false);
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
    if (!showProfileMenu && !showCoinsDropdown) return;
    const handleClickOutside = (event) => {
      if (
        (menuRef.current && !menuRef.current.contains(event.target)) &&
        (coinsRef.current && !coinsRef.current.contains(event.target))
      ) {
        setShowProfileMenu(false);
        setShowCoinsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu, showCoinsDropdown]);

  // Search suggestions
  useEffect(() => {
    let timeout;
    let abortController;
    const run = async () => {
      const q = searchQuery.trim();
      if (q.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setSearchLoading(true);
      abortController = new AbortController();
      const url = `${BACKEND_URL}/api/auth/search/users?q=${encodeURIComponent(q)}&limit=8`;
      
      try {
        const response = await fetch(url, { 
          signal: abortController.signal,
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const results = Array.isArray(data.results) ? data.results : [];
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        setSearchLoading(false);
      }
    };

    timeout = setTimeout(run, 300);
    return () => {
      clearTimeout(timeout);
      if (abortController) abortController.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Campus ID Input Screen
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
          <div className="text-center mb-6">
            <School size={64} className="mx-auto text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Campus Dashboard</h1>
            <p className="text-gray-600">Enter your Campus ID to access your institute dashboard</p>
          </div>

          <form onSubmit={handleValidateCampusId} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campus ID
              </label>
              <input
                type="text"
                value={campusId}
                onChange={(e) => {
                  setCampusId(e.target.value);
                  setError(null);
                }}
                placeholder="SSH-XXX-12345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <span>Access Dashboard</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Campus Dashboard Screen
  return (
    <>
      {/* Custom Navbar - Same style as main website */}
      <nav className="fixed top-0 left-0 w-full h-[64px] sm:h-[72px] bg-[#F5F9FF] text-blue-900 px-3 sm:px-4 shadow-md border-b border-gray-200/50 z-50 backdrop-blur-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-full">
          {/* Logo */}
          <div
            className="flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-transform duration-300 hover:scale-105 flex-shrink-0"
            onClick={() => navigate('/')}
          >
            <img
              src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
              alt="SkillSwapHub Logo"
              className="h-9 w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 object-contain rounded-full shadow-md border-2 border-blue-900"
            />
            <span className="text-sm md:text-base lg:text-lg font-extrabold text-blue-900 font-lora tracking-wide drop-shadow-md">
              SkillSwapHub
            </span>
          </div>

          {/* Desktop/Tablet Navigation - Different tabs */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-3 xl:gap-4">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'oneonone', label: 'One on One' },
              { id: 'assessment', label: 'Assessment' },
              { id: 'requests', label: 'Requests' },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`text-[11px] lg:text-xs xl:text-sm font-bold px-2 md:px-2.5 lg:px-3 py-1.5 rounded-full text-blue-900 bg-blue-100/50 shadow-sm transition-all duration-300 whitespace-nowrap ${
                  isActive(id)
                    ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-md'
                    : 'hover:bg-gradient-to-r hover:from-blue-900 hover:to-blue-800 hover:text-white hover:shadow-md hover:scale-105'
                } touch-manipulation`}
                onClick={() => setActiveTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right Side: Icons and Search */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 overflow-visible">
            {/* Search - only show when logged in and on large screens */}
            {isLoggedIn && <form onSubmit={handleSearch} className="hidden lg:flex items-center" ref={searchRef}>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Skillmate..."
                  className="w-44 xl:w-56 2xl:w-64 pl-8 pr-3 py-1.5 text-xs rounded-full bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-900 placeholder-blue-400 font-nunito shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-blue-900"
                  aria-label="Search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                {(showSuggestions || searchLoading) && (
                  <div className="absolute top-full mt-2 left-0 w-80 bg-white border-2 border-blue-300 rounded-xl shadow-2xl overflow-hidden z-[9999]">
                    <div className="max-h-96 overflow-y-auto">
                      {searchLoading && (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          Searching...
                        </div>
                      )}
                      {!searchLoading && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          No users found
                        </div>
                      )}
                      {!searchLoading && suggestions.length > 0 && (
                        <>
                          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                            <p className="text-xs font-semibold text-blue-900">
                              Found {suggestions.length} user{suggestions.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          {suggestions.map((u) => (
                            <button
                              key={u._id}
                              type="button"
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 text-left transition-colors border-b border-gray-100 last:border-0"
                              onClick={() => {
                                setShowSuggestions(false);
                                setSearchQuery('');
                                navigate(`/profile/${encodeURIComponent(u.username)}`);
                              }}
                            >
                              {u.profilePic ? (
                                <img src={u.profilePic} alt={u.username} className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 shadow-sm flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center text-base font-bold shadow-sm flex-shrink-0">
                                  {(u.firstName?.[0] || u.username?.[0] || 'U').toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username}
                                </div>
                                <div className="text-xs text-gray-500 truncate">@{u.username}</div>
                                {u.role && (
                                  <div className="text-xs text-blue-600 mt-0.5">{u.role}</div>
                                )}
                              </div>
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>}

            {isLoggedIn ? (
              <>
                {/* SkillCoin - Hidden on mobile */}
                <div className="hidden md:flex relative flex-shrink-0">
                  <button
                    className="w-9 h-9 min-w-[36px] min-h-[36px] lg:w-10 lg:h-10 rounded-full bg-blue-800 text-white flex items-center justify-center shadow-md border border-blue-700 hover:scale-105 transition duration-300 touch-manipulation"
                    onClick={() => setShowCoinsDropdown((prev) => !prev)}
                    title="SkillCoin"
                    ref={coinsRef}
                    aria-label="View SkillCoin balance"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none">
                      <defs>
                        <radialGradient id="3d-coin-gold" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fff9c4" />
                          <stop offset="30%" stopColor="#fdd835" />
                          <stop offset="60%" stopColor="#fbc02d" />
                          <stop offset="100%" stopColor="#f57f17" />
                        </radialGradient>
                        <linearGradient id="coin-edge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffecb3" />
                          <stop offset="100%" stopColor="#ffa000" />
                        </linearGradient>
                      </defs>
                      <circle cx="12" cy="12" r="10" fill="url(#3d-coin-gold)" stroke="url(#coin-edge)" strokeWidth="2" />
                      <circle cx="12" cy="12" r="8" stroke="#fff8dc" strokeWidth="1" opacity="0.7" />
                      <text
                        x="12"
                        y="14"
                        fontSize="10"
                        fill="#1e3a8a"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        S
                      </text>
                    </svg>
                  </button>
                  {showCoinsDropdown && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50">
                      <div className="p-3 space-y-2 text-xs font-medium text-gray-700">
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-900">G</span>
                          </div>
                          <span className="text-gray-800">Golden: {goldenCoins}</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 transition">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-inner flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-900">S</span>
                          </div>
                          <span className="text-gray-800">Silver: {silverCoins}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchCoins();
                          }}
                          className="w-full mt-1 p-2 text-xs text-blue-600 hover:bg-blue-50 rounded-md transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="flex flex-shrink-0">
                  <Notifications
                    notifications={notifications}
                    setNotifications={setNotifications}
                    iconSize="w-5 h-5"
                    className="relative flex items-center justify-center"
                    dropdownClassName="absolute right-0 mt-2 w-64 bg-white border border-blue-200 rounded-lg shadow-xl animate-fade-in-down backdrop-blur-sm z-50"
                  />
                </div>

                {/* Profile */}
                <div className="flex relative flex-shrink-0">
                  <button
                    className="w-9 h-9 min-w-[36px] min-h-[36px] lg:w-10 lg:h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-300 shadow-md hover:bg-blue-200 hover:scale-105 transition-all duration-300 touch-manipulation"
                    onClick={() => setShowProfileMenu((v) => !v)}
                    title="Profile"
                    ref={menuRef}
                    aria-label="Open profile menu"
                  >
                    <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                    </svg>
                  </button>
                  {showProfileMenu && (
                    <ProfileDropdown
                      show={showProfileMenu}
                      onClose={() => setShowProfileMenu(false)}
                      navigate={navigate}
                      menuRef={menuRef}
                    />
                  )}
                </div>

                {/* Availability Toggle */}
                {user && (user.role === 'teacher' || user.role === 'both') && (
                  <div className="hidden md:flex relative flex-shrink-0 ml-3">
                    <button
                      onClick={handleToggleAvailability}
                      disabled={isToggling}
                      title={isAvailable ? 'Available for Sessions (Click to turn off)' : 'Unavailable (Click to turn on)'}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isAvailable ? 'bg-blue-600' : 'bg-gray-300'
                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
                    >
                      <span className="sr-only">Toggle availability</span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                          isAvailable ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium whitespace-nowrap ${
                      isAvailable ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-blue-800 rounded-full shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300 font-nunito touch-manipulation"
                onClick={handleLoginClick}
                aria-label="Login to SkillSwapHub"
              >
                Login
              </button>
            )}

            {/* Hamburger (only visible on mobile) */}
            <button
              className="md:hidden w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-blue-100 text-blue-900 flex items-center justify-center border border-blue-300 shadow-md hover:bg-blue-200 hover:scale-105 transition-all duration-300 touch-manipulation flex-shrink-0 ml-2"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle mobile menu"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && window.innerWidth < 768 && (
        <MobileMenu
          isOpen={menuOpen}
          isLoggedIn={isLoggedIn}
          navigate={navigate}
          setShowProfileMenu={setShowProfileMenu}
          showProfileMenu={showProfileMenu}
          menuRef={menuRef}
          setMenuOpen={setMenuOpen}
          ProfileDropdown={ProfileDropdown}
          goldenCoins={goldenCoins}
          silverCoins={silverCoins}
          notifications={notifications}
          setNotifications={setNotifications}
          handleLoginClick={handleLoginClick}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          isActive={isActive}
          user={user}
          isAvailable={isAvailable}
          handleToggleAvailability={handleToggleAvailability}
          isToggling={isToggling}
          searchRef={searchRef}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          searchLoading={searchLoading}
        />
      )}

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

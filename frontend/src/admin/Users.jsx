import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import socket from '../socket';
import { 
  FiSearch, 
  FiFilter, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiX,
  FiCalendar,
  FiClock,
  FiStar,
  FiUsers,
  FiActivity,
  FiInfo,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';
import TutorFeedbackModal from '../components/TutorFeedbackModal.jsx';
import FeedbackModal from '../user/interviewSection/FeedbackModal.jsx';

const ROLE_LABELS = {
  'learner': 'Learner',
  'teacher': 'Teacher',
  'both': 'Both',
  'expert': 'Interview Expert'
};

const ROLE_COLORS = {
  'learner': 'bg-blue-100 text-blue-800 border-blue-300',
  'teacher': 'bg-purple-100 text-purple-800 border-purple-300',
  'both': 'bg-green-100 text-green-800 border-green-300',
  'expert': 'bg-orange-100 text-orange-800 border-orange-300'
};

const Users = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const roleFilter = queryParams.get('role');

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTutorFeedbackModal, setShowTutorFeedbackModal] = useState(false);
  const [showInterviewerFeedbackModal, setShowInterviewerFeedbackModal] = useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilterState, setRoleFilterState] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // Listen for real-time online status changes
  useEffect(() => {
    const handleOnlineStatusChange = (data) => {
      const { userId, isOnline, lastLogin } = data;
      
      // Update user in the list
      setAllUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, isOnline, lastLogin: lastLogin || user.lastLogin }
            : user
        )
      );
      
      // Update selected user if it's the one that changed
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(prev => ({ ...prev, isOnline, lastLogin: lastLogin || prev.lastLogin }));
      }
      
      // Update user details if loaded
      if (userDetails && userDetails.user && userDetails.user._id === userId) {
        setUserDetails(prev => ({
          ...prev,
          user: { ...prev.user, isOnline, lastLogin: lastLogin || prev.user.lastLogin }
        }));
      }
    };

    socket.on('user-online-status-changed', handleOnlineStatusChange);

    return () => {
      socket.off('user-online-status-changed', handleOnlineStatusChange);
    };
  }, [selectedUser, userDetails]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let url = `${BACKEND_URL}/api/admin/users`;
      
      const params = new URLSearchParams();
      if (roleFilter && roleFilter !== 'all') {
        params.append('role', roleFilter);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly, not { users: [...] }
        const users = Array.isArray(data) ? data : (data.users || []);
        setAllUsers(users);
      } else {
        const errorText = await response.text();
        console.error('Admin users API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Error loading user details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
    setActiveTab('overview');
    loadUserDetails(user._id);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
      setUserDetails(null);
    }, 300);
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...allUsers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user) => {
        const usernameMatch = user.username && user.username.toLowerCase().includes(query);
        const emailMatch = user.email && user.email.toLowerCase().includes(query);
        const firstNameMatch = user.firstName && user.firstName.toLowerCase().includes(query);
        const lastNameMatch = user.lastName && user.lastName.toLowerCase().includes(query);
        return usernameMatch || emailMatch || firstNameMatch || lastNameMatch;
      });
    }

    // Role filter
    if (roleFilterState && roleFilterState !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilterState);
    }

    // Status filter (assuming lastLogin field exists)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'online') {
          return user.isOnline === true;
        } else if (statusFilter === 'offline') {
          return user.isOnline === false || user.isOnline === undefined;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'coins':
          const coinsA = (a.goldCoins || 0) * 10 + (a.silverCoins || 0);
          const coinsB = (b.goldCoins || 0) * 10 + (b.silverCoins || 0);
          return coinsB - coinsA;
        case 'lastLogin':
          const dateA = a.lastLogin ? new Date(a.lastLogin) : new Date(a.createdAt);
          const dateB = b.lastLogin ? new Date(b.lastLogin) : new Date(b.createdAt);
          return dateB - dateA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allUsers, searchQuery, roleFilterState, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedUsers, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilterState, statusFilter, sortBy]);

  // Utility functions
  const getInitials = (user) => {
    const first = user.firstName && user.firstName[0] ? user.firstName[0] : '';
    const last = user.lastName && user.lastName[0] ? user.lastName[0] : '';
    if (first || last) {
      return (first + last).toUpperCase();
    }
    if (user.username && user.username[0]) {
      return user.username[0].toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const isUserActive = (user) => {
    if (!user.lastLogin) return false;
    const now = new Date();
    const lastLogin = new Date(user.lastLogin);
    const diffDays = Math.floor((now - lastLogin) / 86400000);
    return diffDays <= 30;
  };

  if (loading) {
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading users...</p>
      </div>
    </div>);
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-sm text-gray-600 mt-1">View and manage all registered users</p>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{filteredAndSortedUsers.length}</span> of <span className="font-semibold text-gray-900">{allUsers.length}</span> users
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilterState}
            onChange={(e) => setRoleFilterState(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
          >
            <option value="all">All Roles</option>
            <option value="learner">Learner</option>
            <option value="teacher">Teacher</option>
            <option value="both">Both</option>
            <option value="expert">Interview Expert</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="email">Sort by Email</option>
            <option value="coins">Sort by Coins</option>
            <option value="lastLogin">Sort by Last Login</option>
          </select>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* User Cards */}
        <div
          className={`flex-shrink-0 transition-all duration-300 overflow-y-auto px-6 py-5 ${
            drawerOpen ? 'w-[calc(100%-400px)]' : 'w-full'
          }`}
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
            {paginatedUsers.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500">
                  {searchQuery || roleFilterState !== 'all' || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No users available'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    className={`bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 ${
                      selectedUser && selectedUser._id === user._id
                        ? 'ring-2 ring-blue-500 border-blue-200'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {user.profilePic ? (
                        <img
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200"
                          src={user.profilePic}
                          alt={user.username}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-gray-200 text-lg">
                          {getInitials(user)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          className="text-sm font-semibold text-gray-900 text-left block"
                        >
                          {user.firstName || user.lastName
                            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                            : user.username}
                        </a>
                        {user.username && (
                          <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                        )}
                        <div className="text-xs text-gray-500 truncate">{user.email || 'N/A'}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-2">
                        {/* Status */}
                        {user.isOnline ? (
                          <span className="px-2 py-0.5 inline-flex items-center gap-1 text-[11px] font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                            <FiCheckCircle className="w-3 h-3" />
                            Online
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 inline-flex items-center gap-1 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                            <FiXCircle className="w-3 h-3" />
                            Offline
                          </span>
                        )}
                        {/* Role */}
                        <span className={`mt-1 px-2 py-0.5 inline-flex text-[11px] leading-5 font-semibold rounded-full border ${
                          ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                        >
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500 text-base">🪙</span>
                          <span className="font-medium text-gray-900">{user.goldCoins || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-base">⚪</span>
                          <span>{user.silverCoins || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <FiClock className="w-3 h-3" />
                        <span>{getRelativeTime(user.lastLogin || user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedUsers.length)} of {filteredAndSortedUsers.length} users
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <FiChevronLeft className="w-4 h-4 inline mr-1" />
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                    <FiChevronRight className="w-4 h-4 inline ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sliding Drawer */}
        <div 
          className={`fixed right-0 top-0 h-full w-[400px] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 overflow-hidden flex flex-col ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedUser && (
            <>
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {selectedUser.profilePic ? (
                      <img
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                        src={selectedUser.profilePic}
                        alt={selectedUser.username}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-gray-200">
                        {getInitials(selectedUser)}
                      </div>
                    )}
                    <div>
                      <a
                        href={`/profile/${selectedUser.username}`}
                        onClick={(e) => {
                          // Don't prevent default, let the anchor work naturally
                        }}
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        {selectedUser.firstName} {selectedUser.lastName}
                      </a>
                      <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={closeDrawer}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[selectedUser.role] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                  {ROLE_LABELS[selectedUser.role] || selectedUser.role}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === 'overview'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiInfo className="w-4 h-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === 'sessions'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiUsers className="w-4 h-4 inline mr-2" />
                  One-on-One
                </button>
                <button
                  onClick={() => setActiveTab('interview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === 'interview'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiStar className="w-4 h-4 inline mr-2" />
                  Interview
                </button>
                {userDetails && userDetails.employee && (
                  <button
                    onClick={() => setActiveTab('employee')}
                    className={`flex-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all ${
                      activeTab === 'employee'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <FiUser className="w-4 h-4 inline mr-2" />
                    Employee
                  </button>
                )}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingDetails ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading details...</p>
                    </div>
                  </div>
                ) : userDetails ? (
                  <>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Contact Info */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Contact Information
                          </h4>
                          <div className="space-y-2">
                            {userDetails.user.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <FiMail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{userDetails.user.email}</span>
                              </div>
                            )}
                            {userDetails.user.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <FiPhone className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{userDetails.user.phone}</span>
                              </div>
                            )}
                            {userDetails.user.country && (
                              <div className="flex items-center gap-2 text-sm">
                                <FiMapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{userDetails.user.country}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Education */}
                        {userDetails.user.education && userDetails.user.education.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Educational Details
                            </h4>
                            <div className="space-y-2">
                              {userDetails.user.education.map((edu, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-700"
                                >
                                  <div className="font-semibold text-gray-900 text-sm mb-1">
                                    {edu.course || 'Course not specified'}
                                  </div>
                                  {(edu.college || edu.city) && (
                                    <div className="mb-0.5">
                                      {edu.college}
                                      {edu.city ? ` • ${edu.city}` : ''}
                                    </div>
                                  )}
                                  {edu.passingYear && (
                                    <div className="text-gray-500">Batch of {edu.passingYear}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* SkillCoins */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            SkillCoins
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1">Gold</div>
                              <div className="text-2xl font-bold text-yellow-700">{userDetails.user.goldCoins || 0}</div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1">Silver</div>
                              <div className="text-2xl font-bold text-gray-700">{userDetails.user.silverCoins || 0}</div>
                            </div>
                          </div>
                        </div>

                        {/* Account Info */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Account Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Joined:</span>
                              <span className="font-medium text-gray-900">{formatDate(userDetails.user.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Current Status & Activity */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Current Status
                          </h4>
                          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2">
                              {userDetails.user.isOnline ? (
                                <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                                  <FiCheckCircle className="w-3 h-3" />
                                  Online
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                                  <FiXCircle className="w-3 h-3" />
                                  Offline
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <FiClock className="w-3 h-3 text-gray-400" />
                              <span>
                                Last seen: {formatDateTime(userDetails.user.lastLogin || userDetails.user.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Reports */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Reports Against User
                          </h4>
                          {userDetails.reports && userDetails.reports.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                              {userDetails.reports.map((report) => (
                                <div
                                  key={report._id}
                                  className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold">{report.type === 'account' ? 'Account' : 'Video'} report</span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        report.resolved
                                          ? 'bg-green-100 text-green-800 border border-green-200'
                                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                      }`}
                                    >
                                      {report.resolved ? 'Resolved' : 'Pending'}
                                    </span>
                                  </div>
                                  {report.issues && report.issues.length > 0 && (
                                    <div className="mb-1">
                                      <span className="font-semibold">Issues: </span>
                                      <span>{report.issues.join(', ')}</span>
                                    </div>
                                  )}
                                  {report.otherDetails && (
                                    <div className="mb-1">
                                      <span className="font-semibold">Details: </span>
                                      <span>{report.otherDetails}</span>
                                    </div>
                                  )}
                                  <div className="text-[11px] text-red-700 mt-1">
                                    Reported at: {formatDateTime(report.createdAt)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No reports against this user</p>
                          )}
                        </div>

                        
                        {/* Bio */}
                        {userDetails.user.bio && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Bio
                            </h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                              {userDetails.user.bio}
                            </p>
                          </div>
                        )}
                        
                      </div>

                      
                    )}

                    {/* One-on-One Sessions Tab */}
                    {activeTab === 'sessions' && (
                      <div className="space-y-6">
                        {/* Summary */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            One-on-One Sessions Summary
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                              <div className="text-[11px] text-gray-600 mb-1">Total Sessions</div>
                              <div className="text-xl font-bold text-blue-700">
                                {userDetails.sessionStats && userDetails.sessionStats.totalSessions != null
                                  ? userDetails.sessionStats.totalSessions
                                  : 0}
                              </div>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                              <div className="text-[11px] text-gray-600 mb-1">As Student</div>
                              <div className="text-xl font-bold text-green-700">
                                {userDetails.sessionStats && userDetails.sessionStats.sessionsAsStudent != null
                                  ? userDetails.sessionStats.sessionsAsStudent
                                  : 0}
                              </div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                              <div className="text-[11px] text-gray-600 mb-1">As Tutor</div>
                              <div className="text-xl font-bold text-purple-700">
                                {userDetails.sessionStats && userDetails.sessionStats.sessionsAsTutor != null
                                  ? userDetails.sessionStats.sessionsAsTutor
                                  : 0}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tutor Info (only if approved tutor) */}
                        {userDetails.user.isTutor && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Tutor Summary
                              </h4>
                              <button
                                type="button"
                                onClick={() => setShowTutorFeedbackModal(true)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                View Tutor Feedback
                              </button>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Average Rating</span>
                                {userDetails.user.ratingCount > 0 ? (
                                  <span className="flex items-center gap-1 text-gray-900 font-semibold">
                                    <FiStar className="w-4 h-4 text-yellow-500" />
                                    {userDetails.user.ratingAverage.toFixed(1)} / 5
                                    <span className="text-xs text-gray-500">
                                      ({userDetails.user.ratingCount} ratings)
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-500">No ratings yet</span>
                                )}
                              </div>
                              {userDetails.user.skillsToTeach && userDetails.user.skillsToTeach.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-600 mb-1">Skills</div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {userDetails.user.skillsToTeach.map((skill, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[11px] rounded-full border border-indigo-200"
                                      >
                                        {skill.class ? `${skill.class} • ` : ''}
                                        {skill.subject} - {skill.topic === 'ALL' ? 'ALL Topics' : skill.topic}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interview Tab */}
                    {activeTab === 'interview' && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Completed Interviews Summary
                          </h4>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                              <div className="text-[11px] text-gray-600 mb-1">Total Completed</div>
                              <div className="text-xl font-bold text-blue-700">
                                {userDetails.interviewStats && userDetails.interviewStats.totalCompletedInterviews != null
                                  ? userDetails.interviewStats.totalCompletedInterviews
                                  : 0}
                              </div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                              <div className="text-[11px] text-gray-600 mb-1">As Requester</div>
                              <div className="text-xl font-bold text-emerald-700">
                                {userDetails.interviewStats && userDetails.interviewStats.completedAsRequester != null
                                  ? userDetails.interviewStats.completedAsRequester
                                  : 0}
                              </div>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                              <div className="text-[11px] text-gray-600 mb-1">As Interviewer</div>
                              <div className="text-xl font-bold text-purple-700">
                                {userDetails.interviewStats && userDetails.interviewStats.completedAsInterviewer != null
                                  ? userDetails.interviewStats.completedAsInterviewer
                                  : 0}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expired Interviews */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Expired Interviews
                          </h4>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                            <div className="text-[11px] text-gray-600 mb-1">Total Expired</div>
                            <div className="text-xl font-bold text-gray-700">
                              {userDetails.interviewStats && userDetails.interviewStats.scheduledInterviews ? (() => {
                                const expiredCount = userDetails.interviewStats.scheduledInterviews.filter(interview => {
                                  if (!interview.scheduledAt) return false;
                                  try {
                                    const scheduledTime = new Date(interview.scheduledAt).getTime();
                                    const expiryTime = scheduledTime + 12 * 60 * 60 * 1000;
                                    return Date.now() >= expiryTime;
                                  } catch {
                                    return false;
                                  }
                                }).length;
                                return expiredCount;
                              })() : 0}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              Interviews expired 12 hours after scheduled time
                            </div>
                          </div>
                        </div>

                        {/* Scheduled Interviews */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Scheduled Interviews
                            {userDetails.interviewStats && userDetails.interviewStats.scheduledInterviews && (() => {
                              // Filter out expired interviews (12+ hours past scheduled time)
                              const nonExpiredInterviews = userDetails.interviewStats.scheduledInterviews.filter(interview => {
                                if (!interview.scheduledAt) return true;
                                try {
                                  const scheduledTime = new Date(interview.scheduledAt).getTime();
                                  const expiryTime = scheduledTime + 12 * 60 * 60 * 1000;
                                  return Date.now() < expiryTime;
                                } catch {
                                  return true;
                                }
                              });
                              return nonExpiredInterviews.length > 0 && (
                                <span className="ml-2 text-blue-600">({nonExpiredInterviews.length})</span>
                              );
                            })()}
                          </h4>
                          {userDetails.interviewStats && userDetails.interviewStats.scheduledInterviews && (() => {
                            // Filter out expired interviews
                            const nonExpiredInterviews = userDetails.interviewStats.scheduledInterviews.filter(interview => {
                              if (!interview.scheduledAt) return true;
                              try {
                                const scheduledTime = new Date(interview.scheduledAt).getTime();
                                const expiryTime = scheduledTime + 12 * 60 * 60 * 1000;
                                return Date.now() < expiryTime;
                              } catch {
                                return true;
                              }
                            });
                            return nonExpiredInterviews.length;
                          })() > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {userDetails.interviewStats.scheduledInterviews.filter(interview => {
                                // Filter out expired interviews
                                if (!interview.scheduledAt) return true;
                                try {
                                  const scheduledTime = new Date(interview.scheduledAt).getTime();
                                  const expiryTime = scheduledTime + 12 * 60 * 60 * 1000;
                                  return Date.now() < expiryTime;
                                } catch {
                                  return true;
                                }
                              }).map((interview, idx) => {
                                const isRequester = String(interview.requester._id || interview.requester) === String(selectedUser._id);
                                const otherUser = isRequester ? interview.assignedInterviewer : interview.requester;
                                return (
                                  <div
                                    key={idx}
                                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {otherUser?.profilePic ? (
                                          <img
                                            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-300"
                                            src={otherUser.profilePic}
                                            alt={otherUser.username}
                                          />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-blue-300">
                                            {otherUser?.username?.[0]?.toUpperCase() || 'U'}
                                          </div>
                                        )}
                                        <div>
                                          <div className="font-semibold text-gray-900">
                                            {otherUser?.firstName || otherUser?.lastName
                                              ? `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim()
                                              : otherUser?.username || 'Unknown'}
                                          </div>
                                          <div className="text-[10px] text-gray-500">
                                            {isRequester ? 'Interviewer' : 'Requester'}
                                          </div>
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                        interview.status === 'scheduled' 
                                          ? 'bg-green-100 text-green-800 border border-green-200'
                                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                                      }`}>
                                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                                      </span>
                                    </div>
                                    {interview.company && interview.position && (
                                      <div className="mb-2 text-gray-700">
                                        <span className="font-semibold">{interview.position}</span>
                                        <span className="text-gray-500"> at </span>
                                        <span className="font-semibold">{interview.company}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1 text-gray-600">
                                      <FiClock className="w-3 h-3" />
                                      <span>{formatDateTime(interview.scheduledAt)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                              <p className="text-sm text-gray-500 italic">No scheduled interviews</p>
                            </div>
                          )}
                        </div>

                        {/* Interviewer Application Info */}
                        {userDetails.interviewStats && userDetails.interviewStats.interviewerApp && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Interviewer Profile
                              </h4>
                              <button
                                type="button"
                                onClick={() => setShowInterviewerFeedbackModal(true)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                View Interview Feedback
                              </button>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Company</span>
                                <span className="font-medium text-gray-900">
                                  {userDetails.interviewStats.interviewerApp.company || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Position</span>
                                <span className="font-medium text-gray-900">
                                  {userDetails.interviewStats.interviewerApp.position || 'N/A'}
                                </span>
                              </div>
                              {userDetails.interviewStats.interviewerApp.qualification && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Qualification</span>
                                  <span className="font-medium text-gray-900">
                                    {userDetails.interviewStats.interviewerApp.qualification}
                                  </span>
                                </div>
                              )}
                              {userDetails.interviewStats.interviewerApp.experience && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Experience</span>
                                  <span className="font-medium text-gray-900">
                                    {userDetails.interviewStats.interviewerApp.experience}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Total Past Interviews</span>
                                <span className="font-medium text-gray-900">
                                  {userDetails.interviewStats.interviewerApp.totalPastInterviews != null
                                    ? userDetails.interviewStats.interviewerApp.totalPastInterviews
                                    : 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Conducted as Expert</span>
                                <span className="font-medium text-gray-900">
                                  {userDetails.interviewStats.interviewerApp.conductedInterviews != null
                                    ? userDetails.interviewStats.interviewerApp.conductedInterviews
                                    : 0}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interviewer Rating Summary */}
                        {userDetails.interviewStats && userDetails.interviewStats.ratingsCountAsInterviewer > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Interviewer Rating
                            </h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <FiStar
                                      key={i}
                                      className={`w-5 h-5 ${
                                        i < Math.round(userDetails.interviewStats.averageRatingAsInterviewer || 0)
                                          ? 'text-yellow-500 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {userDetails.interviewStats.averageRatingAsInterviewer.toFixed(1)}/5
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                Based on {userDetails.interviewStats.ratingsCountAsInterviewer} rating
                                {userDetails.interviewStats.ratingsCountAsInterviewer !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Employee Tab */}
                    {activeTab === 'employee' && userDetails.employee && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Employee Status
                          </h4>
                          <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Employee ID</span>
                              <span className="font-semibold text-gray-900">
                                {userDetails.employee.employeeId}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Access</span>
                              <span className="font-semibold text-gray-900 capitalize">
                                {userDetails.employee.accessPermissions}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Hired</span>
                              <span className="font-semibold text-gray-900">
                                {formatDate(userDetails.employee.createdAt)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Active</span>
                              {userDetails.employee.isDisabled ? (
                                <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-300">
                                  <FiXCircle className="w-3 h-3" />
                                  Inactive
                                </span>
                              ) : (
                                <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                                  <FiCheckCircle className="w-3 h-3" />
                                  Active
                                </span>
                              )}
                            </div>
                            {userDetails.employee.lastLoginAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Last Login</span>
                                <span className="font-semibold text-gray-900">
                                  {formatDateTime(userDetails.employee.lastLoginAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>

      {showTutorFeedbackModal && selectedUser && (
        <TutorFeedbackModal
          isOpen={showTutorFeedbackModal}
          onClose={() => setShowTutorFeedbackModal(false)}
          tutorId={selectedUser._id}
          tutorName={
            selectedUser.firstName || selectedUser.lastName
              ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()
              : selectedUser.username
          }
        />
      )}

      {showInterviewerFeedbackModal && selectedUser && (
        <FeedbackModal
          isOpen={showInterviewerFeedbackModal}
          onClose={() => setShowInterviewerFeedbackModal(false)}
          interviewer={{
            user: selectedUser,
            application:
              userDetails && userDetails.interviewStats
                ? userDetails.interviewStats.interviewerApp || null
                : null,
          }}
        />
      )}
    </>
  );
};

export default Users;

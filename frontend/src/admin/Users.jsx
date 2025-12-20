import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config';
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
  const queryParams = new URLSearchParams(location.search);
  const roleFilter = queryParams.get('role');

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilterState && roleFilterState !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilterState);
    }

    // Status filter (assuming lastLogin field exists)
    if (statusFilter !== 'all') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
      
      filtered = filtered.filter(user => {
        const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(user.createdAt);
        if (statusFilter === 'active') {
          return lastLogin >= thirtyDaysAgo;
        } else if (statusFilter === 'inactive') {
          return lastLogin < thirtyDaysAgo;
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
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || 'U';
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
        {/* User Table */}
        <div className={`flex-1 overflow-y-auto transition-all duration-300 ${drawerOpen ? 'mr-[400px]' : ''}`}>
          <div className="px-6 py-5">
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Coins
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Login
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className={`cursor-pointer transition-all ${
                          selectedUser?._id === user._id
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* User */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {user.profilePic ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200"
                                src={user.profilePic}
                                alt={user.username}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ring-2 ring-gray-200">
                                {getInitials(user)}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{user.email || 'N/A'}</div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>

                        {/* Coins */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500 text-base">🪙</span>
                              <span className="text-sm font-medium text-gray-900">{user.goldCoins || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-gray-400 text-base">⚪</span>
                              <span className="text-sm text-gray-600">{user.silverCoins || 0}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isUserActive(user) ? (
                            <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                              <FiCheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                              <FiXCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            {getRelativeTime(user.lastLogin || user.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedUser.firstName} {selectedUser.lastName}
                      </h3>
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
              <div className="flex border-b border-gray-200 bg-white">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'overview'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiInfo className="w-4 h-4 inline mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'activity'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiActivity className="w-4 h-4 inline mr-2" />
                  Activity
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
                    activeTab === 'details'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FiUser className="w-4 h-4 inline mr-2" />
                  Details
                </button>
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

                        {/* Coins */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Coins & Credits
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1">Gold Coins</div>
                              <div className="text-2xl font-bold text-yellow-700">{userDetails.user.goldCoins || 0}</div>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1">Silver Coins</div>
                              <div className="text-2xl font-bold text-gray-700">{userDetails.user.silverCoins || 0}</div>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 col-span-2">
                              <div className="text-xs text-gray-600 mb-1">Credits</div>
                              <div className="text-2xl font-bold text-blue-700">{userDetails.user.credits || 0}</div>
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
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Rank:</span>
                              <span className="font-medium text-gray-900">{userDetails.user.rank || 'Bronze'}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-100">
                              <span className="text-gray-600">Badges:</span>
                              <span className="font-medium text-gray-900">{userDetails.user.badges?.length || 0}</span>
                            </div>
                          </div>
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

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                      <div className="space-y-6">
                        {/* Last Login */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Last Activity
                          </h4>
                          <div className="flex items-center gap-2 text-sm p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700">
                              {formatDateTime(userDetails.user.lastLogin || userDetails.user.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Sessions */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Sessions ({userDetails.sessions?.length || 0})
                          </h4>
                          {userDetails.sessions && userDetails.sessions.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No sessions yet</p>
                          ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {userDetails.sessions?.map((session) => (
                                <div key={session._id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900">{session.subject}</div>
                                      <div className="text-xs text-gray-600">{session.topic}</div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      session.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {session.status}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {session.date} at {session.time}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* SkillMates */}
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            SkillMates ({userDetails.user.skillMates?.length || 0})
                          </h4>
                          {(!userDetails.user.skillMates || userDetails.user.skillMates.length === 0) ? (
                            <p className="text-sm text-gray-500 italic">No SkillMates yet</p>
                          ) : (
                            <div className="space-y-2">
                              {userDetails.user.skillMates.map((mate) => (
                                <div key={mate._id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  {mate.profilePic ? (
                                    <img className="w-10 h-10 rounded-full object-cover" src={mate.profilePic} alt={mate.username} />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold">
                                      {getInitials(mate)}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {mate.firstName} {mate.lastName}
                                    </div>
                                    <div className="text-xs text-gray-600">@{mate.username}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Rating */}
                        {userDetails.user.ratingCount > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Rating
                            </h4>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <FiStar
                                      key={i}
                                      className={`w-5 h-5 ${i < Math.round(userDetails.user.ratingAverage) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                                    />
                                  ))}
                                </div>
                                <span className="font-semibold text-gray-900">
                                  {userDetails.user.ratingAverage.toFixed(1)}/5
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                Based on {userDetails.user.ratingCount} rating{userDetails.user.ratingCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Details Tab */}
                    {activeTab === 'details' && (
                      <div className="space-y-6">
                        {/* Skills */}
                        {(userDetails.user.skillsToTeach?.length > 0 || userDetails.user.skillsToLearn?.length > 0) && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              Skills
                            </h4>
                            {userDetails.user.skillsToTeach?.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs text-gray-600 mb-2">To Teach</div>
                                <div className="flex flex-wrap gap-2">
                                  {userDetails.user.skillsToTeach.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full border border-purple-300">
                                      {skill.class ? `${skill.class} • ` : ''}{skill.subject} - {skill.topic === 'ALL' ? 'ALL Topics' : skill.topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {userDetails.user.skillsToLearn?.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-600 mb-2">To Learn</div>
                                <div className="flex flex-wrap gap-2">
                                  {userDetails.user.skillsToLearn.map((skill, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-300">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SkillMate Requests */}
                        {userDetails.skillMateRequests && userDetails.skillMateRequests.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              SkillMate Requests ({userDetails.skillMateRequests.length})
                            </h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {userDetails.skillMateRequests.map((request) => (
                                <div key={request._id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-gray-700">
                                      {request.requester._id === userDetails.user._id ? 'Sent to' : 'Received from'}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {request.status}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-900">
                                    @{request.requester._id === userDetails.user._id 
                                      ? request.recipient.username 
                                      : request.requester.username}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {formatDateTime(request.createdAt)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;

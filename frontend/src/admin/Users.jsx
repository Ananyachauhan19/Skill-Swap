import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';

const ROLE_LABELS = {
  teacher: 'Tutor',
  learner: 'Learner',
  both: 'Both',
  expert: 'Expert',
};

const ROLE_COLORS = {
  teacher: 'bg-purple-100 text-purple-800 border-purple-300',
  learner: 'bg-blue-100 text-blue-800 border-blue-300',
  both: 'bg-green-100 text-green-800 border-green-300',
};

const Users = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const location = useLocation();

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams(location.search);
      const role = params.get('role') || 'all';
      
      let queryParams = new URLSearchParams();
      if (role !== 'all') queryParams.append('role', role);
      if (searchQuery) queryParams.append('search', searchQuery);
      
      // Apply date filters
      if (dateFilter !== 'all' && dateFilter !== 'custom') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        queryParams.append('startDate', startDate.toISOString());
        queryParams.append('endDate', now.toISOString());
      } else if (dateFilter === 'custom' && customStartDate) {
        queryParams.append('startDate', new Date(customStartDate).toISOString());
        if (customEndDate) {
          queryParams.append('endDate', new Date(customEndDate).toISOString());
        }
      }
      
      const res = await fetch(`${BACKEND_URL}/api/admin/users?${queryParams}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setAllUsers(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading users:', err);
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        credentials: 'include',
      });
      
      if (!res.ok) throw new Error('Failed to fetch user details');
      const data = await res.json();
      setUserDetails(data);
      setLoadingDetails(false);
    } catch (err) {
      console.error('Error loading user details:', err);
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadUsers();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    loadUserDetails(user._id);
  };

  const getInitials = (user) => {
    if (!user) return '?';
    const first = user.firstName || user.username || '?';
    const last = user.lastName || '';
    return (first[0] + (last[0] || '')).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                View and manage all registered users
              </p>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{allUsers.length}</span> users found
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, username, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Date Filter */}
            <div className="flex gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === 'custom' && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Center - Users Table */}
        <div className="flex-1 h-full overflow-y-auto bg-gray-50 px-6 py-5">
          {allUsers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search criteria' : 'No users available'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SkillMates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => (
                    <tr
                      key={user._id}
                      onClick={() => handleUserSelect(user)}
                      className={`cursor-pointer transition-colors ${
                        selectedUser?._id === user._id
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {user.profilePic ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={user.profilePic}
                                alt={user.username}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {getInitials(user)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-600">🪙</span>
                            <span>{user.goldCoins || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <span>⚪</span>
                            <span>{user.silverCoins || 0}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.skillMates?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Panel - User Details */}
        <div className="w-96 bg-white border-l border-gray-200 h-full overflow-y-auto shadow-lg">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">
                  Select a user to view details
                </p>
              </div>
            </div>
          ) : loadingDetails ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading details...</p>
              </div>
            </div>
          ) : userDetails ? (
            <div className="p-6">
              {/* User Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {userDetails.user.profilePic ? (
                    <img
                      className="w-16 h-16 rounded-full object-cover shadow-lg"
                      src={userDetails.user.profilePic}
                      alt={userDetails.user.username}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                      {getInitials(userDetails.user)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {userDetails.user.firstName} {userDetails.user.lastName}
                    </h2>
                    <p className="text-sm text-gray-600">@{userDetails.user.username}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${ROLE_COLORS[userDetails.user.role] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                      {ROLE_LABELS[userDetails.user.role] || userDetails.user.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Sections */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    {userDetails.user.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-gray-700">{userDetails.user.email}</span>
                      </div>
                    )}
                    {userDetails.user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-gray-700">{userDetails.user.phone}</span>
                      </div>
                    )}
                    {userDetails.user.country && (
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-gray-700">{userDetails.user.country}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coins */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Coins & Credits
                  </h3>
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

                {/* Bio */}
                {userDetails.user.bio && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Bio
                    </h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {userDetails.user.bio}
                    </p>
                  </div>
                )}

                {/* Skills */}
                {(userDetails.user.skillsToTeach?.length > 0 || userDetails.user.skillsToLearn?.length > 0) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Skills
                    </h3>
                    {userDetails.user.skillsToTeach?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-2">To Teach</div>
                        <div className="flex flex-wrap gap-2">
                          {userDetails.user.skillsToTeach.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {skill.subject} - {skill.topic}
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
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sessions */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Sessions ({userDetails.sessions.length})
                  </h3>
                  {userDetails.sessions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No sessions yet</p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userDetails.sessions.map((session) => (
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
                          <div className="text-xs text-gray-500 mt-1">
                            With: {session.creator?._id === userDetails.user._id 
                              ? session.requester?.username 
                              : session.creator?.username}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SkillMates */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    SkillMates ({userDetails.user.skillMates?.length || 0})
                  </h3>
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
                          <span className={`px-2 py-1 text-xs rounded-full border ${ROLE_COLORS[mate.role] || 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                            {ROLE_LABELS[mate.role] || mate.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SkillMate Requests */}
                {userDetails.skillMateRequests && userDetails.skillMateRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      SkillMate Requests ({userDetails.skillMateRequests.length})
                    </h3>
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

                {/* Rating */}
                {userDetails.user.ratingCount > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Rating
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${i < Math.round(userDetails.user.ratingAverage) ? 'text-yellow-500' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
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

                {/* Account Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Account Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rank:</span>
                      <span className="font-medium text-gray-900">{userDetails.user.rank || 'Bronze'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Badges:</span>
                      <span className="font-medium text-gray-900">{userDetails.user.badges?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-medium text-gray-900">{formatDate(userDetails.user.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Users;

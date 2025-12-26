import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config";
import socket from "../socket";
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
  FiXCircle,
  FiMaximize2,
  FiColumns,
} from "react-icons/fi";
import TutorFeedbackModal from "../components/TutorFeedbackModal.jsx";
import FeedbackModal from "../user/interviewSection/FeedbackModal.jsx";
import UserDetailTabContent from "./UserDetailTabContent.jsx";

const ROLE_LABELS = {
  learner: "Learner",
  teacher: "Teacher",
  both: "Both",
  expert: "Interview Expert",
};

const ROLE_COLORS = {
  learner: "bg-blue-100 text-blue-800 border-blue-300",
  teacher: "bg-purple-100 text-purple-800 border-purple-300",
  both: "bg-green-100 text-green-800 border-green-300",
  expert: "bg-orange-100 text-orange-800 border-orange-300",
};

const Users = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const roleFilter = queryParams.get("role");

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tab Management
  const [openTabs, setOpenTabs] = useState([{ id: 'users-list', type: 'list', title: 'Users' }]);
  const [activeTabId, setActiveTabId] = useState('users-list');
  const [viewMode, setViewMode] = useState('full'); // 'full' or 'half'
  
  // User Details Cache
  const [userDetailsCache, setUserDetailsCache] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});
  const [userTabStates, setUserTabStates] = useState({}); // Store active section per user
  
  // Modals
  const [showTutorFeedbackModal, setShowTutorFeedbackModal] = useState(false);
  const [showInterviewerFeedbackModal, setShowInterviewerFeedbackModal] = useState(false);
  const [modalUserId, setModalUserId] = useState(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilterState, setRoleFilterState] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
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
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId
            ? { ...user, isOnline, lastLogin: lastLogin || user.lastLogin }
            : user
        )
      );

      // Update in cached user details
      setUserDetailsCache(prev => {
        if (prev[userId]) {
          return {
            ...prev,
            [userId]: {
              ...prev[userId],
              user: { 
                ...prev[userId].user, 
                isOnline,
                lastLogin: lastLogin || prev[userId].user.lastLogin
              }
            }
          };
        }
        return prev;
      });
    };

    socket.on("user-online-status-changed", handleOnlineStatusChange);

    return () => {
      socket.off("user-online-status-changed", handleOnlineStatusChange);
    };
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      let url = `${BACKEND_URL}/api/admin/users`;

      const params = new URLSearchParams();
      if (roleFilter && roleFilter !== "all") {
        params.append("role", roleFilter);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns array directly, not { users: [...] }
        const users = Array.isArray(data) ? data : data.users || [];
        setAllUsers(users);
      } else {
        const errorText = await response.text();
        console.error("Admin users API error:", response.status, errorText);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId) => {
    // Check cache first
    if (userDetailsCache[userId]) {
      return userDetailsCache[userId];
    }
    
    setLoadingDetails(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUserDetailsCache(prev => ({ ...prev, [userId]: data }));
        return data;
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      return null;
    } finally {
      setLoadingDetails(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleUserSelect = (user) => {
    const tabId = `user-${user._id}`;
    
    // Check if tab already exists
    const existingTab = openTabs.find(tab => tab.id === tabId);
    
    if (existingTab) {
      // Just switch to existing tab
      setActiveTabId(tabId);
    } else {
      // Create new tab
      const newTab = {
        id: tabId,
        type: 'user',
        title: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username,
        userId: user._id,
        user: user
      };
      
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(tabId);
      
      // Initialize tab state
      if (!userTabStates[user._id]) {
        setUserTabStates(prev => ({
          ...prev,
          [user._id]: { activeSection: 'overview' }
        }));
      }
      
      // Load user details
      loadUserDetails(user._id);
    }
  };

  const closeTab = (tabId, e) => {
    if (e) e.stopPropagation();
    
    // Don't allow closing the main Users tab
    if (tabId === 'users-list') return;
    
    const tabIndex = openTabs.findIndex(tab => tab.id === tabId);
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    
    setOpenTabs(newTabs);
    
    // If closing active tab, switch to adjacent tab
    if (activeTabId === tabId) {
      if (newTabs.length > 0) {
        const newActiveIndex = tabIndex > 0 ? tabIndex - 1 : 0;
        setActiveTabId(newTabs[newActiveIndex].id);
      }
    }
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'full' ? 'half' : 'full');
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...allUsers];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user) => {
        const usernameMatch =
          user.username && user.username.toLowerCase().includes(query);
        const emailMatch =
          user.email && user.email.toLowerCase().includes(query);
        const firstNameMatch =
          user.firstName && user.firstName.toLowerCase().includes(query);
        const lastNameMatch =
          user.lastName && user.lastName.toLowerCase().includes(query);
        return usernameMatch || emailMatch || firstNameMatch || lastNameMatch;
      });
    }

    // Role filter
    if (roleFilterState && roleFilterState !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilterState);
    }

    // Status filter (assuming lastLogin field exists)
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => {
        if (statusFilter === "online") {
          return user.isOnline === true;
        } else if (statusFilter === "offline") {
          return user.isOnline === false || user.isOnline === undefined;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        case "email":
          return (a.email || "").localeCompare(b.email || "");
        case "coins":
          const coinsA = (a.goldCoins || 0) * 10 + (a.silverCoins || 0);
          const coinsB = (b.goldCoins || 0) * 10 + (b.silverCoins || 0);
          return coinsB - coinsA;
        case "lastLogin":
          const dateA = a.lastLogin
            ? new Date(a.lastLogin)
            : new Date(a.createdAt);
          const dateB = b.lastLogin
            ? new Date(b.lastLogin)
            : new Date(b.createdAt);
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
    const first = user.firstName && user.firstName[0] ? user.firstName[0] : "";
    const last = user.lastName && user.lastName[0] ? user.lastName[0] : "";
    if (first || last) {
      return (first + last).toUpperCase();
    }
    if (user.username && user.username[0]) {
      return user.username[0].toUpperCase();
    }
    return "U";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Never";
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
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Professional Tab Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center overflow-x-auto scrollbar-hide">
            {openTabs.map((tab) => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group relative flex items-center gap-2 px-4 py-2.5 border-r border-gray-200 cursor-pointer transition-all min-w-[160px] max-w-[200px] ${
                  activeTabId === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="truncate flex-1 text-sm font-medium">{tab.title}</span>
                
                <div className="flex items-center gap-1">
                  {/* View Toggle - Only for user tabs and when active */}
                  {tab.type === 'user' && activeTabId === tab.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleViewMode();
                      }}
                      className="p-1 rounded hover:bg-blue-200 transition-colors"
                      title={viewMode === 'full' ? 'Split view' : 'Full view'}
                    >
                      {viewMode === 'full' ? (
                        <FiColumns className="w-3.5 h-3.5" />
                      ) : (
                        <FiMaximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  
                  {/* Close Button - Not for main Users tab */}
                  {tab.id !== 'users-list' && (
                    <button
                      onClick={(e) => closeTab(tab.id, e)}
                      className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Close tab"
                    >
                      <FiX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                
                {/* Active Tab Indicator */}
                {activeTabId === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTabId === 'users-list' ? (
            // Main Users List View
            <div className="h-full flex flex-col">
              {/* Header with Filters */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
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
                  <div className="flex-1 min-w-[300px]">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search by name, username, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <select value={roleFilterState} onChange={(e) => setRoleFilterState(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="all">All Roles</option>
                    <option value="learner">Learner</option>
                    <option value="teacher">Teacher</option>
                    <option value="both">Both</option>
                    <option value="expert">Interview Expert</option>
                  </select>

                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="all">All Status</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>

                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="name">Sort by Name</option>
                    <option value="email">Sort by Email</option>
                    <option value="coins">Sort by Coins</option>
                    <option value="lastLogin">Sort by Last Login</option>
                  </select>
                </div>
              </div>

              {/* User Cards */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {paginatedUsers.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">
                      {searchQuery || roleFilterState !== "all" || statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No users available"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedUsers.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleUserSelect(user)}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative flex-shrink-0">
                            {user.profilePic ? (
                              <img src={user.profilePic} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                {getInitials(user)}
                              </div>
                            )}
                            {user.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="text-base font-semibold text-gray-900 truncate">
                                {user.firstName || user.lastName
                                  ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                  : user.username}
                              </h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${ROLE_COLORS[user.role] || "bg-gray-100 text-gray-800 border-gray-300"}`}>
                                {ROLE_LABELS[user.role] || user.role}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">@{user.username} • {user.email}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="text-yellow-500">🪙</span> {user.goldCoins || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="text-gray-400">⚪</span> {user.silverCoins || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {user.isOnline ? (
                                  <span className="text-green-600 font-medium">Online</span>
                                ) : (
                                  getRelativeTime(user.lastLogin || user.createdAt)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FiChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        Next <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // User Detail View
            (() => {
              const activeTab = openTabs.find(tab => tab.id === activeTabId);
              const userId = activeTab?.userId;
              const userDetails = userDetailsCache[userId];
              const isLoadingDetails = loadingDetails[userId];

              if (viewMode === 'half') {
                // Half Screen Mode
                return (
                  <div className="flex h-full">
                    <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
                      <div className="bg-white px-4 py-3 border-b border-gray-200">
                        <div className="relative">
                          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-2">
                          {paginatedUsers.map((user) => (
                            <div
                              key={user._id}
                              onClick={() => handleUserSelect(user)}
                              className={`p-3 rounded-lg cursor-pointer transition-all ${
                                activeTab?.userId === user._id
                                  ? 'bg-blue-50 border-2 border-blue-500'
                                  : 'bg-white border border-gray-200 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="relative flex-shrink-0">
                                  {user.profilePic ? (
                                    <img src={user.profilePic} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                      {getInitials(user)}
                                    </div>
                                  )}
                                  {user.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.firstName || user.lastName
                                      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                      : user.username}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                      <UserDetailTabContent
                        userId={userId}
                        userDetails={userDetails}
                        isLoadingDetails={isLoadingDetails}
                        userTabStates={userTabStates}
                        setUserTabStates={setUserTabStates}
                        formatDate={formatDate}
                        formatDateTime={formatDateTime}
                        setShowTutorFeedbackModal={setShowTutorFeedbackModal}
                        setShowInterviewerFeedbackModal={setShowInterviewerFeedbackModal}
                        setModalUserId={setModalUserId}
                        getInitials={getInitials}
                      />
                    </div>
                  </div>
                );
              } else {
                // Full Screen Mode
                return (
                  <div className="h-full flex flex-col overflow-hidden">
                    <UserDetailTabContent
                      userId={userId}
                      userDetails={userDetails}
                      isLoadingDetails={isLoadingDetails}
                      userTabStates={userTabStates}
                      setUserTabStates={setUserTabStates}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
                      setShowTutorFeedbackModal={setShowTutorFeedbackModal}
                      setShowInterviewerFeedbackModal={setShowInterviewerFeedbackModal}
                      setModalUserId={setModalUserId}
                      getInitials={getInitials}
                    />
                  </div>
                );
              }
            })()
          )}
        </div>
      </div>

      {/* Modals */}
      {showTutorFeedbackModal && modalUserId && (
        <TutorFeedbackModal
          isOpen={showTutorFeedbackModal}
          onClose={() => {
            setShowTutorFeedbackModal(false);
            setModalUserId(null);
          }}
          tutorId={modalUserId}
          tutorName={
            (() => {
              const user = userDetailsCache[modalUserId]?.user || allUsers.find(u => u._id === modalUserId);
              if (!user) return 'User';
              return user.firstName || user.lastName
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                : user.username;
            })()
          }
        />
      )}

      {showInterviewerFeedbackModal && modalUserId && (
        <FeedbackModal
          isOpen={showInterviewerFeedbackModal}
          onClose={() => {
            setShowInterviewerFeedbackModal(false);
            setModalUserId(null);
          }}
          interviewer={{
            user: userDetailsCache[modalUserId]?.user || allUsers.find(u => u._id === modalUserId),
            application: userDetailsCache[modalUserId]?.interviewStats?.interviewerApp || null,
          }}
        />
      )}
    </>
  );
};

export default Users;

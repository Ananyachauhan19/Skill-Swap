import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiUsers,
  FiUser,
  FiExternalLink,
  FiDollarSign,
  FiTrendingUp,
  FiCalendar,
  FiActivity,
  FiVideo,
  FiMessageSquare,
} from "react-icons/fi";
import { BACKEND_URL } from "../config";

// Contribution Calendar Component
const ContributionCalendar = ({ contributions }) => {
  // Get last 12 months grouped by month
  const getMonthsData = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const shortMonthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      
      // Get all days in this month
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const days = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = date.toISOString().split('T')[0];
        days.push({ date: dateKey, displayDate: date });
      }
      
      months.push({
        name: monthName,
        shortName: shortMonthName,
        days: days
      });
    }
    
    return months;
  };

  const monthsData = getMonthsData();
  
  // Create a map of contributions by date
  const contributionMap = {};
  contributions.forEach(contrib => {
    contributionMap[contrib.dateKey] = contrib.count;
  });

  // Get contribution level for coloring (0-4)
  const getLevel = (count) => {
    if (!count) return 0;
    if (count < 3) return 1;
    if (count < 6) return 2;
    if (count < 10) return 3;
    return 4;
  };

  // Get color based on level
  const getColor = (level) => {
    const colors = {
      0: 'bg-gray-100',
      1: 'bg-green-200',
      2: 'bg-green-400',
      3: 'bg-green-600',
      4: 'bg-green-800'
    };
    return colors[level] || colors[0];
  };
  
  // Calculate stats
  const totalContributions = contributions.reduce((sum, c) => sum + c.count, 0);
  const currentStreak = calculateCurrentStreak(contributions);
  const longestStreak = calculateLongestStreak(contributions);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{totalContributions}</div>
          <div className="text-xs text-gray-600 mt-1">Total Contributions</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{currentStreak}</div>
          <div className="text-xs text-gray-600 mt-1">Current Streak (days)</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">{longestStreak}</div>
          <div className="text-xs text-gray-600 mt-1">Longest Streak (days)</div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month-wise Calendar Grid */}
          <div className="flex flex-wrap gap-6">
            {monthsData.map((month, monthIdx) => (
              <div key={monthIdx} className="flex flex-col">
                {/* Month label */}
                <div className="text-xs font-semibold text-gray-700 mb-2">
                  {month.shortName}
                </div>
                
                {/* Days grid for this month */}
                <div className="grid grid-cols-7 gap-1">
                  {month.days.map((day, dayIdx) => {
                    const count = contributionMap[day.date] || 0;
                    const level = getLevel(count);
                    return (
                      <div
                        key={dayIdx}
                        className={`w-4 h-4 rounded-sm ${getColor(level)} hover:ring-2 hover:ring-blue-400 cursor-pointer transition-all`}
                        title={`${day.date}: ${count} contributions`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-6 text-[10px] text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200"></div>
              <div className="w-3 h-3 rounded-sm bg-green-200 border border-gray-200"></div>
              <div className="w-3 h-3 rounded-sm bg-green-400 border border-gray-200"></div>
              <div className="w-3 h-3 rounded-sm bg-green-600 border border-gray-200"></div>
              <div className="w-3 h-3 rounded-sm bg-green-800 border border-gray-200"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions for streak calculation
const calculateCurrentStreak = (contributions) => {
  if (!contributions.length) return 0;
  
  const sortedContribs = [...contributions].sort((a, b) => 
    new Date(b.dateKey) - new Date(a.dateKey)
  );
  
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  let checkDate = new Date(today);
  
  for (let contrib of sortedContribs) {
    const contribDate = contrib.dateKey;
    const expectedDate = checkDate.toISOString().split('T')[0];
    
    if (contribDate === expectedDate && contrib.count > 0) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (new Date(contribDate) < checkDate) {
      break;
    }
  }
  
  return streak;
};

const calculateLongestStreak = (contributions) => {
  if (!contributions.length) return 0;
  
  const sortedContribs = [...contributions]
    .filter(c => c.count > 0)
    .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey));
  
  let maxStreak = 0;
  let currentStreak = 0;
  let lastDate = null;
  
  for (let contrib of sortedContribs) {
    const currentDate = new Date(contrib.dateKey);
    
    if (!lastDate) {
      currentStreak = 1;
    } else {
      const dayDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    lastDate = currentDate;
  }
  
  return Math.max(maxStreak, currentStreak);
};

const ROLE_COLORS = {
  learner: "bg-blue-100 text-blue-800 border-blue-300",
  teacher: "bg-purple-100 text-purple-800 border-purple-300",
  both: "bg-green-100 text-green-800 border-green-300",
  expert: "bg-orange-100 text-orange-800 border-orange-300",
};

const ROLE_LABELS = {
  learner: "Learner",
  teacher: "Teacher",
  both: "Both",
  expert: "Interview Expert",
};

const UserDetailTabContent = ({
  userId,
  userDetails,
  isLoadingDetails,
  userTabStates,
  setUserTabStates,
  formatDate,
  formatDateTime,
  getInitials,
  setShowTutorFeedbackModal,
  setShowInterviewerFeedbackModal,
  setModalUserId,
}) => {
  const navigate = useNavigate();
  const user = userDetails?.user;
  const activeSection = userTabStates[userId]?.activeSection || 'overview';
  
  // Additional data states
  const [skillMates, setSkillMates] = useState([]);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [coinHistory, setCoinHistory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [contributionData, setContributionData] = useState([]);
  const [loadingExtra, setLoadingExtra] = useState(false);
  
  const setActiveSection = (section) => {
    setUserTabStates(prev => ({
      ...prev,
      [userId]: { ...prev[userId], activeSection: section }
    }));
  };
  
  const onOpenTutorModal = () => {
    setModalUserId(userId);
    setShowTutorFeedbackModal(true);
  };
  
  const onOpenInterviewerModal = () => {
    setModalUserId(userId);
    setShowInterviewerFeedbackModal(true);
  };
  
  // Fetch additional data when section changes
  useEffect(() => {
    if (!userId || !userDetails) return;
    
    const fetchAdditionalData = async () => {
      setLoadingExtra(true);
      try {
        // Fetch based on active section to avoid loading everything at once
        if (activeSection === 'skillmates' && skillMates.length === 0) {
          const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/skillmates`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setSkillMates(data.skillmates || []);
          }
        } else if (activeSection === 'sessions' && sessionHistory.length === 0) {
          const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/session-history`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setSessionHistory(data.sessions || []);
          }
        } else if (activeSection === 'interview' && interviewHistory.length === 0) {
          const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/interview-history`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setInterviewHistory(data.interviews || []);
          }
        } else if (activeSection === 'wallet' && coinHistory.length === 0) {
          const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/coin-history`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setCoinHistory(data.transactions || []);
          }
        } else if (activeSection === 'activity' && activityLogs.length === 0) {
          const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/activity-logs`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setActivityLogs(data.activities || []);
          }
        } else if (activeSection === 'calendar' && contributionData.length === 0) {
          const response = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/contribution-calendar`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setContributionData(data.contributions || []);
          }
        }
      } catch (error) {
        console.error("Error fetching additional data:", error);
      } finally {
        setLoadingExtra(false);
      }
    };
    
    fetchAdditionalData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeSection]);
  
  if (isLoadingDetails) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!userDetails || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No details available</p>
      </div>
    );
  }

  return (
    <>
      {/* User Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-start gap-3">
          {user.profilePic ? (
            <img
              className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
              src={user.profilePic}
              alt={user.username}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ring-2 ring-gray-200">
              {getInitials(user)}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <button
                onClick={() => navigate(`/admin/users/profile/${user.username}`)}
                className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                title="View Full Profile"
              >
                <FiExternalLink className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600">@{user.username}</p>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                ROLE_COLORS[user.role] ||
                "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            >
              {ROLE_LABELS[user.role] || user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Section Tabs - Compact */}
      <div className="flex border-b border-gray-200 bg-white overflow-x-auto">
        <button
          onClick={() => setActiveSection("overview")}
          className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
            activeSection === "overview"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FiInfo className="w-3 h-3 inline mr-1" />
          Overview
        </button>
        <button
          onClick={() => setActiveSection("skillmates")}
          className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
            activeSection === "skillmates"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FiUsers className="w-3 h-3 inline mr-1" />
          SkillMates
        </button>
        <button
          onClick={() => setActiveSection("sessions")}
          className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
            activeSection === "sessions"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FiVideo className="w-3 h-3 inline mr-1" />
          One-on-One
        </button>
        <button
          onClick={() => setActiveSection("interview")}
          className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
            activeSection === "interview"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FiStar className="w-3 h-3 inline mr-1" />
          Interview
        </button>
        <button
          onClick={() => setActiveSection("wallet")}
          className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
            activeSection === "wallet"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FiDollarSign className="w-3 h-3 inline mr-1" />
          Wallet
        </button>
        <button
          onClick={() => setActiveSection("activity")}
          className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
            activeSection === "activity"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FiActivity className="w-3 h-3 inline mr-1" />
          Activity
        </button>
        <button
          onClick={() => setActiveSection("calendar")}
          className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
            activeSection === "calendar"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <FiCalendar className="w-3 h-3 inline mr-1" />
          Calendar
        </button>
        {userDetails.employee && (
          <button
            onClick={() => setActiveSection("employee")}
            className={`px-3 py-2 text-[11px] font-medium whitespace-nowrap transition-all ${
              activeSection === "employee"
                ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <FiUser className="w-3 h-3 inline mr-1" />
            Employee
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {/* Overview Tab */}
        {activeSection === "overview" && (
          <div className="space-y-5">
            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Contact Information
              </h4>
              <div className="space-y-2 bg-white p-4 rounded-lg border border-gray-200">
                {userDetails.user.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiMail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {userDetails.user.email}
                    </span>
                  </div>
                )}
                {userDetails.user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiPhone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {userDetails.user.phone}
                    </span>
                  </div>
                )}
                {userDetails.user.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <FiMapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">
                      {userDetails.user.country}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Education */}
            {userDetails.user.education &&
              userDetails.user.education.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Educational Details
                  </h4>
                  <div className="space-y-2">
                    {userDetails.user.education.map((edu, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-700"
                      >
                        <div className="font-semibold text-gray-900 text-sm mb-1">
                          {edu.course || "Course not specified"}
                        </div>
                        {(edu.college || edu.city) && (
                          <div className="mb-0.5">
                            {edu.college}
                            {edu.city ? ` • ${edu.city}` : ""}
                          </div>
                        )}
                        {edu.passingYear && (
                          <div className="text-gray-500">
                            Batch of {edu.passingYear}
                          </div>
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
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-xs text-gray-600 mb-1">Gold</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {userDetails.user.goldCoins || 0}
                  </div>
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                  <div className="text-xs text-gray-600 mb-1">Silver</div>
                  <div className="text-2xl font-bold text-gray-700">
                    {userDetails.user.silverCoins || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Account Information
              </h4>
              <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Joined:</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(userDetails.user.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Current Status
              </h4>
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4 text-sm">
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
                    Last seen:{" "}
                    {formatDateTime(
                      userDetails.user.lastLogin || userDetails.user.createdAt
                    )}
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
                        <span className="font-semibold">
                          {report.type === "account" ? "Account" : "Video"}{" "}
                          report
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            report.resolved
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          }`}
                        >
                          {report.resolved ? "Resolved" : "Pending"}
                        </span>
                      </div>
                      {report.issues && report.issues.length > 0 && (
                        <div className="mb-1">
                          <span className="font-semibold">Issues: </span>
                          <span>{report.issues.join(", ")}</span>
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
                <p className="text-sm text-gray-500 italic bg-white p-4 rounded-lg border border-gray-200">
                  No reports against this user
                </p>
              )}
            </div>

            {/* Bio */}
            {userDetails.user.bio && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Bio
                </h4>
                <p className="text-sm text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
                  {userDetails.user.bio}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeSection === "sessions" && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Session Statistics
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">
                    Total Sessions
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {userDetails.sessionStats?.totalSessions || 0}
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">
                    As Student
                  </div>
                  <div className="text-lg font-bold text-green-700">
                    {userDetails.sessionStats?.sessionsAsStudent || 0}
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">As Tutor</div>
                  <div className="text-lg font-bold text-purple-700">
                    {userDetails.sessionStats?.sessionsAsTutor || 0}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Session History
              </h4>
              {loadingExtra ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : sessionHistory.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-[10px]">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Role</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Partner</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Topic</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Duration</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Rating</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sessionHistory.map((session) => (
                          <tr key={session._id} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                              {formatDate(session.date || session.createdAt)}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  session.role === "tutor"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {session.role || "N/A"}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-gray-700 max-w-xs truncate">
                              {session.partner ? (
                                `${session.partner.firstName || session.partner.username} ${session.partner.lastName || ''}`
                              ) : "N/A"}
                            </td>
                            <td className="px-2 py-1.5 text-gray-900 max-w-xs truncate">
                              {session.topic || "N/A"}
                            </td>
                            <td className="px-2 py-1.5 text-gray-700">
                              {session.duration ? `${session.duration} min` : "N/A"}
                            </td>
                            <td className="px-2 py-1.5">
                              {session.rating ? (
                                <span className="flex items-center gap-0.5 text-yellow-600 font-semibold">
                                  <FiStar className="w-2.5 h-2.5" />
                                  {session.rating}
                                </span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  session.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : session.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {session.status || "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic bg-white p-4 rounded-lg border border-gray-200">
                  No session history available
                </p>
              )}
            </div>

            {/* Tutor Info */}
            {userDetails.user.isTutor && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tutor Summary
                  </h4>
                  <button
                    type="button"
                    onClick={onOpenTutorModal}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    View Tutor Feedback
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-2">
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
                      <span className="text-xs text-gray-500">
                        No ratings yet
                      </span>
                    )}
                  </div>
                  {userDetails.user.skillsToTeach &&
                    userDetails.user.skillsToTeach.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Skills</div>
                        <div className="flex flex-wrap gap-1.5">
                          {userDetails.user.skillsToTeach.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[11px] rounded-full border border-indigo-200"
                            >
                              {skill.class ? `${skill.class} • ` : ""}
                              {skill.subject} -{" "}
                              {skill.topic === "ALL" ? "ALL Topics" : skill.topic}
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
        {activeSection === "interview" && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Interview Statistics
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">
                    Total Completed
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {userDetails.interviewStats?.totalCompletedInterviews || 0}
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">
                    As Requester
                  </div>
                  <div className="text-lg font-bold text-emerald-700">
                    {userDetails.interviewStats?.completedAsRequester || 0}
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">
                    As Interviewer
                  </div>
                  <div className="text-lg font-bold text-purple-700">
                    {userDetails.interviewStats?.completedAsInterviewer || 0}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Interview History
              </h4>
              {loadingExtra ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : interviewHistory.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-[10px]">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Role</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Partner</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Company</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Position</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Duration</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {interviewHistory.map((interview) => (
                          <tr key={interview._id} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                              {formatDate(interview.date || interview.createdAt)}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  interview.role === "interviewer"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {interview.role || "N/A"}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-gray-700 max-w-xs truncate">
                              {interview.partner ? (
                                `${interview.partner.firstName || interview.partner.username} ${interview.partner.lastName || ''}`
                              ) : "N/A"}
                            </td>
                            <td className="px-2 py-1.5 text-gray-900 max-w-xs truncate">
                              {interview.company || "N/A"}
                            </td>
                            <td className="px-2 py-1.5 text-gray-900 max-w-xs truncate">
                              {interview.position || "N/A"}
                            </td>
                            <td className="px-2 py-1.5 text-gray-700">
                              {interview.duration ? `${interview.duration} min` : "N/A"}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  interview.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : interview.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : interview.status === "scheduled"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {interview.status || "N/A"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic bg-white p-4 rounded-lg border border-gray-200">
                  No interview history available
                </p>
              )}
            </div>

            {/* Interviewer Info */}
            {userDetails.interviewStats?.interviewerApp && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Interviewer Profile
                  </h4>
                  <button
                    type="button"
                    onClick={onOpenInterviewerModal}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    View Interview Feedback
                  </button>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Company</span>
                    <span className="font-medium text-gray-900">
                      {userDetails.interviewStats.interviewerApp.company ||
                        "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Position</span>
                    <span className="font-medium text-gray-900">
                      {userDetails.interviewStats.interviewerApp.position ||
                        "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SkillMates Tab */}
        {activeSection === "skillmates" && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SkillMates Connections
            </h4>
            {loadingExtra ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : skillMates.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {skillMates.map((mate) => (
                  <div
                    key={mate._id}
                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-2">
                      {mate.profilePic ? (
                        <img
                          src={mate.profilePic}
                          alt={mate.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                          {mate.firstName?.[0]}{mate.lastName?.[0]}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {mate.firstName} {mate.lastName}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          @{mate.username}
                        </p>
                      </div>
                    </div>
                    {mate.connectedAt && (
                      <p className="text-[9px] text-gray-400 mt-1">
                        Connected: {formatDate(mate.connectedAt)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic bg-white p-4 rounded-lg border border-gray-200">
                No SkillMates connections yet
              </p>
            )}
          </div>
        )}

        {/* Wallet Tab */}
        {activeSection === "wallet" && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Current Balance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">Gold Coins</div>
                  <div className="text-xl font-bold text-yellow-700">
                    {userDetails.user.goldCoins || 0}
                  </div>
                </div>
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-[10px] text-gray-600 mb-1">Silver Coins</div>
                  <div className="text-xl font-bold text-gray-700">
                    {userDetails.user.silverCoins || 0}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Transaction History
              </h4>
              {loadingExtra ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : coinHistory.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-[10px]">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Date</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Type</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Partner</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Subject</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Coin Type</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Amount</th>
                          <th className="px-2 py-1.5 text-left font-semibold text-gray-700">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {coinHistory.map((tx) => (
                          <tr key={tx._id} className="hover:bg-gray-50">
                            <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                              {formatDate(tx.date || tx.createdAt)}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  tx.type === "credit"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {tx.type === "credit" ? "Earned" : "Spent"}
                              </span>
                            </td>
                            <td className="px-2 py-1.5 text-gray-700 max-w-xs truncate">
                              {tx.partner || "N/A"}
                            </td>
                            <td className="px-2 py-1.5 text-gray-700 max-w-xs truncate">
                              {tx.subject || "N/A"}
                            </td>
                            <td className="px-2 py-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  tx.coinType === "gold"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {tx.coinType || "silver"}
                              </span>
                            </td>
                            <td className={`px-2 py-1.5 font-semibold ${
                              tx.type === "credit" ? "text-green-600" : "text-red-600"
                            }`}>
                              {tx.type === "credit" ? "+" : "-"}{tx.amount || 0}
                            </td>
                            <td className="px-2 py-1.5 text-gray-700">
                              {tx.duration ? `${tx.duration} min` : "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic bg-white p-4 rounded-lg border border-gray-200">
                  No transaction history
                </p>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeSection === "activity" && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Activity Timeline
            </h4>
            {loadingExtra ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : activityLogs.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-[500px] overflow-y-auto">
                <div className="space-y-2">
                  {activityLogs.map((log, idx) => (
                    <div
                      key={log._id || idx}
                      className="flex gap-2 pb-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {log.type === "session" && (
                          <FiVideo className="w-3 h-3 text-blue-600" />
                        )}
                        {log.type === "interview" && (
                          <FiStar className="w-3 h-3 text-purple-600" />
                        )}
                        {log.type === "wallet" && (
                          <FiDollarSign className="w-3 h-3 text-yellow-600" />
                        )}
                        {log.type === "login" && (
                          <FiActivity className="w-3 h-3 text-green-600" />
                        )}
                        {!["session", "interview", "wallet", "login"].includes(
                          log.type
                        ) && <FiActivity className="w-3 h-3 text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-900 font-medium">
                          {log.action}
                        </p>
                        {log.details && (
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            {log.details}
                          </p>
                        )}
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          <FiClock className="w-2.5 h-2.5 inline mr-0.5" />
                          {formatDateTime(log.timestamp || log.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic bg-white p-4 rounded-lg border border-gray-200">
                No activity records
              </p>
            )}
          </div>
        )}

        {/* Calendar Tab */}
        {activeSection === "calendar" && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Contribution Calendar
            </h4>
            {loadingExtra ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ContributionCalendar contributions={contributionData} />
            )}
          </div>
        )}

        {/* Employee Tab */}
        {activeSection === "employee" && userDetails.employee && (
          <div className="space-y-5">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserDetailTabContent;

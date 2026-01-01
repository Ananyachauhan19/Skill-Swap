import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Users, 
  Coins, 
  FileSpreadsheet, 
  Trash2,
  Edit3,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  TrendingUp,
  Award,
  School
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const AmbassadorActivityProfile = ({ ambassadorId, isAdminView = false, refreshTrigger = 0 }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedActivity, setExpandedActivity] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const ACTION_ICONS = {
    'Institute Added': <Building2 className="w-4 h-4 text-green-700" />,
    'Institute Edited': <Edit3 className="w-4 h-4 text-blue-700" />,
    'Institute Deleted': <Trash2 className="w-4 h-4 text-red-700" />,
    'Student Upload': <Users className="w-4 h-4 text-purple-700" />,
    'Coins Distributed': <Coins className="w-4 h-4 text-yellow-700" />,
    'Assessment Uploaded': <FileSpreadsheet className="w-4 h-4 text-indigo-700" />
  };

  const ACTION_ACCENTS = {
    'Institute Added': 'border-l-green-500',
    'Institute Edited': 'border-l-blue-500',
    'Institute Deleted': 'border-l-red-500',
    'Student Upload': 'border-l-purple-500',
    'Coins Distributed': 'border-l-yellow-500',
    'Assessment Uploaded': 'border-l-indigo-500'
  };

  useEffect(() => {
    console.log('[ActivityProfile] useEffect triggered - ambassadorId:', ambassadorId, 'page:', currentPage, 'filter:', selectedFilter, 'refreshTrigger:', refreshTrigger);
    
    // Add small delay when refreshTrigger changes to allow backend activity logging to complete
    if (refreshTrigger > 0) {
      const timer = setTimeout(() => {
        fetchActivities();
        fetchStats();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      fetchActivities();
      fetchStats();
    }
  }, [ambassadorId, currentPage, selectedFilter, refreshTrigger, dateFilter]);

  // Sidebar resize handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX - (sidebarRef.current?.getBoundingClientRect().left || 0);
      if (newWidth >= 200 && newWidth <= 400) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const endpoint = isAdminView
        ? `${BACKEND_URL}/api/admin/campus-ambassadors/${ambassadorId}/activity-logs`
        : `${BACKEND_URL}/api/campus-ambassador/activity-logs`;

      const params = {
        page: currentPage,
        limit: 20,
        actionType: selectedFilter,
        dateFilter: dateFilter,
        ...(dateFilter === 'custom' && customDateRange.start && customDateRange.end && {
          startDate: customDateRange.start,
          endDate: customDateRange.end
        })
      };

      const response = await axios.get(endpoint, {
        params,
        withCredentials: true
      });

      console.log('[ActivityProfile] Fetched activities:', response.data.activities);
      console.log('[ActivityProfile] Filter:', selectedFilter);
      console.log('[ActivityProfile] RefreshTrigger:', refreshTrigger);
      
      setActivities(response.data.activities);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load activity history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const endpoint = isAdminView
        ? `${BACKEND_URL}/api/admin/campus-ambassadors/${ambassadorId}/activity-stats`
        : `${BACKEND_URL}/api/campus-ambassador/activity-stats`;

      const response = await axios.get(endpoint, {
        withCredentials: true
      });

      console.log('[ActivityProfile] Stats:', response.data);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityDescription = (activity) => {
    const meta = activity.metadata || {};
    
    switch (activity.actionType) {
      case 'Institute Added':
        return `Created new institute: ${activity.instituteName}`;
      
      case 'Institute Edited':
        return `Updated institute details: ${activity.instituteName}`;
      
      case 'Institute Deleted':
        return `Removed institute: ${activity.instituteName}`;
      
      case 'Student Upload': {
        const studentCount = meta.totalStudents || 0;
        const coinsInfo = meta.coinsAssigned
          ? ` with ${meta.silverCoinsPerStudent || 0} silver & ${meta.goldenCoinsPerStudent || 0} golden coins each`
          : '';
        return `Uploaded ${studentCount} student${studentCount !== 1 ? 's' : ''} to ${activity.instituteName}${coinsInfo}`;
      }
      
      case 'Coins Distributed': {
        const affectedCount = meta.totalStudentsAffected || 0;
        return `Distributed ${meta.silverCoinsPerStudent || 0} silver & ${meta.goldenCoinsPerStudent || 0} golden coins to ${affectedCount} students in ${activity.instituteName}`;
      }
      
      case 'Assessment Uploaded': {
        const institutes = Array.isArray(activity.instituteName) ? activity.instituteName : [activity.instituteName];
        const instituteText = institutes.length > 1 
          ? `${institutes.length} institutes` 
          : institutes[0];
        return `Uploaded assessment "${meta.testName}" for ${instituteText}`;
      }
      
      default:
        return `Performed action: ${activity.actionType}`;
    }
  };

  const toggleActivityDetails = (activityId) => {
    setExpandedActivity(expandedActivity === activityId ? null : activityId);
  };

  const renderActivityDetails = (activity) => {
    if (expandedActivity !== activity._id) return null;

    const meta = activity.metadata || {};
    
    return (
      <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-2 border border-slate-200">
        {activity.actionType === 'Institute Added' && (
          <>
            <div><strong>Institute ID:</strong> {meta.instituteId}</div>
            <div><strong>Type:</strong> {meta.instituteType}</div>
            <div><strong>Courses:</strong> {meta.numberOfCourses}</div>
          </>
        )}
        
        {activity.actionType === 'Student Upload' && (
          <>
            <div><strong>Total Students:</strong> {meta.totalStudents}</div>
            {meta.coinsAssigned && (
              <>
                <div><strong>Silver Coins/Student:</strong> {meta.silverCoinsPerStudent}</div>
                <div><strong>Golden Coins/Student:</strong> {meta.goldenCoinsPerStudent}</div>
              </>
            )}
          </>
        )}

        {activity.actionType === 'Coins Distributed' && (
          <>
            <div><strong>Students Affected:</strong> {meta.totalStudentsAffected}</div>
            <div><strong>Silver Coins/Student:</strong> {meta.silverCoinsPerStudent}</div>
            <div><strong>Golden Coins/Student:</strong> {meta.goldenCoinsPerStudent}</div>
          </>
        )}

        {activity.actionType === 'Assessment Uploaded' && (
          <>
            <div><strong>Test Name:</strong> {meta.testName}</div>
            {meta.questionCount && <div><strong>Questions:</strong> {meta.questionCount}</div>}
            {meta.totalMarks && <div><strong>Total Marks:</strong> {meta.totalMarks}</div>}
            {meta.testStartTime && (
              <div><strong>Start:</strong> {new Date(meta.testStartTime).toLocaleString()}</div>
            )}
            {meta.testEndTime && (
              <div><strong>End:</strong> {new Date(meta.testEndTime).toLocaleString()}</div>
            )}
            {Array.isArray(activity.instituteName) && (
              <div>
                <strong>Institutes:</strong>
                <ul className="ml-4 mt-1">
                  {activity.instituteName.map((inst, idx) => (
                    <li key={idx} className="list-disc">{inst}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading && activities.length === 0 && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    );
  }

  const actionTypes = [
    { key: 'all', label: 'All Actions', icon: <Filter className="w-4 h-4" /> },
    { key: 'Institute Added', label: 'Institute Added', icon: <Building2 className="w-4 h-4" /> },
    { key: 'Institute Edited', label: 'Institute Edited', icon: <Edit3 className="w-4 h-4" /> },
    { key: 'Institute Deleted', label: 'Institute Deleted', icon: <Trash2 className="w-4 h-4" /> },
    { key: 'Student Upload', label: 'Student Upload', icon: <Users className="w-4 h-4" /> },
    { key: 'Coins Distributed', label: 'Coins Distributed', icon: <Coins className="w-4 h-4" /> },
    { key: 'Assessment Uploaded', label: 'Assessment Uploaded', icon: <FileSpreadsheet className="w-4 h-4" /> }
  ];

  const renderSummaryOverview = () => {
    if (!stats) return null;

    // Calculate summary totals
    const totalStudents = stats.studentUploadTotals?.totalStudentsUploaded || 0;
    const totalInstitutes = stats.stats.find(s => s.actionType === 'Institute Added')?.count || 0;
    const totalActivities = stats.totalActivities || 0;
    const totalGoldenCoins = stats.studentUploadTotals?.totalGoldenCoinsDistributed || 0;
    const totalSilverCoins = stats.studentUploadTotals?.totalSilverCoinsDistributed || 0;

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-700" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Students</p>
            </div>
            <p className="text-3xl font-bold text-purple-900 tabular-nums">{totalStudents.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-600">Total Uploaded</p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <School className="w-6 h-6 text-blue-700" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Institutes</p>
            </div>
            <p className="text-3xl font-bold text-blue-900 tabular-nums">{totalInstitutes}</p>
            <p className="mt-1 text-xs text-slate-600">Total Added</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-indigo-700" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Activities</p>
            </div>
            <p className="text-3xl font-bold text-indigo-900 tabular-nums">{totalActivities}</p>
            <p className="mt-1 text-xs text-slate-600">Total Actions</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-white border border-yellow-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-100 rounded-xl">
                <Award className="w-6 h-6 text-yellow-700" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Golden Coins</p>
            </div>
            <p className="text-3xl font-bold text-yellow-900 tabular-nums">{totalGoldenCoins.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-600">Total Distributed</p>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-slate-100 rounded-xl">
                <Coins className="w-6 h-6 text-slate-700" />
              </div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Silver Coins</p>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{totalSilverCoins.toLocaleString()}</p>
            <p className="mt-1 text-xs text-slate-600">Total Distributed</p>
          </div>
        </div>

        {/* Action Type Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Action Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {stats.stats.map((stat) => (
              <div key={stat.actionType} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  {ACTION_ICONS[stat.actionType]}
                </div>
                <div>
                  <p className="text-xs text-slate-600">{stat.actionType}</p>
                  <p className="text-xl font-bold text-slate-900 tabular-nums">{stat.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderActivitiesList = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (activities.length === 0) {
      return (
        <div className="text-center py-12 text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-semibold">No activities found</p>
          <p className="mt-1 text-xs text-slate-500">Try changing the filter or date range.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity._id}
            className={`bg-white border border-slate-200 rounded-xl p-4 transition-all border-l-4 hover:shadow-sm ${
              ACTION_ACCENTS[activity.actionType] || 'border-l-slate-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                {ACTION_ICONS[activity.actionType]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      {activity.actionType}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {getActivityDescription(activity)}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleActivityDetails(activity._id)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                    title="View details"
                  >
                    {expandedActivity === activity._id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(activity.performedAt)}</span>
                </div>
                {renderActivityDetails(activity)}
              </div>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="pt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={!pagination.hasMore}
              className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Left Sidebar - Resizable */}
      <div
        ref={sidebarRef}
        className="flex-shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
        style={{ width: `${sidebarWidth}px` }}
      >
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-sm font-semibold text-slate-900">Action Types</p>
          <p className="text-xs text-slate-600 mt-0.5">Filter by action</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {actionTypes.map((type) => (
            <button
              key={type.key}
              onClick={() => {
                setSelectedFilter(type.key);
                setCurrentPage(1);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                selectedFilter === type.key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span className={selectedFilter === type.key ? 'text-white' : 'text-slate-600'}>
                {type.icon}
              </span>
              <span className="flex-1 text-left truncate">{type.label}</span>
              {selectedFilter === type.key && type.key !== 'all' && stats && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                  {stats.stats.find(s => s.actionType === type.key)?.count || 0}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors"
          onMouseDown={() => setIsResizing(true)}
          style={{ right: 0 }}
        />
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Date Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-semibold text-slate-900">Date Filter</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'today', 'week', 'month'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setDateFilter(filter);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    dateFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'today' ? 'Today' : filter === 'week' ? '1 Week' : '1 Month'}
                </button>
              ))}
              
              <button
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === 'custom'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {/* Custom Date Range Inputs */}
          {dateFilter === 'custom' && (
            <div className="mt-3 flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-200">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    if (customDateRange.start && customDateRange.end) {
                      setCurrentPage(1);
                      fetchActivities();
                    }
                  }}
                  disabled={!customDateRange.start || !customDateRange.end}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* Total Count */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {selectedFilter === 'all' ? 'All Activities' : selectedFilter}
            </span>
            <span className="text-xs font-semibold text-slate-900">
              {pagination?.totalCount || 0} total
            </span>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-2xl p-5">
          {selectedFilter === 'all' ? renderSummaryOverview() : renderActivitiesList()}
        </div>
      </div>
    </div>
  );
};

export default AmbassadorActivityProfile;

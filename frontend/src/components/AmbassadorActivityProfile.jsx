import React, { useState, useEffect } from 'react';
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
  Filter
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

  const ACTION_ICONS = {
    'Institute Added': <Building2 className="w-5 h-5 text-green-600" />,
    'Institute Edited': <Edit3 className="w-5 h-5 text-blue-600" />,
    'Institute Deleted': <Trash2 className="w-5 h-5 text-red-600" />,
    'Student Upload': <Users className="w-5 h-5 text-purple-600" />,
    'Coins Distributed': <Coins className="w-5 h-5 text-yellow-600" />,
    'Assessment Uploaded': <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
  };

  const ACTION_COLORS = {
    'Institute Added': 'bg-green-50 border-green-200',
    'Institute Edited': 'bg-blue-50 border-blue-200',
    'Institute Deleted': 'bg-red-50 border-red-200',
    'Student Upload': 'bg-purple-50 border-purple-200',
    'Coins Distributed': 'bg-yellow-50 border-yellow-200',
    'Assessment Uploaded': 'bg-indigo-50 border-indigo-200'
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
  }, [ambassadorId, currentPage, selectedFilter, refreshTrigger]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const endpoint = isAdminView
        ? `${BACKEND_URL}/api/admin/campus-ambassadors/${ambassadorId}/activity-logs`
        : `${BACKEND_URL}/api/campus-ambassador/activity-logs`;

      const params = {
        page: currentPage,
        limit: 20,
        actionType: selectedFilter
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
      <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
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

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && stats.stats.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.stats.map((stat) => (
              <div key={stat.actionType} className="bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  {ACTION_ICONS[stat.actionType]}
                </div>
                <div className="text-2xl font-bold text-gray-800">{stat.count}</div>
                <div className="text-xs text-gray-600 truncate">{stat.actionType}</div>
              </div>
            ))}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl font-bold">{stats.totalActivities}</div>
              <div className="text-xs">Total Activities</div>
            </div>
          </div>

          {/* Student Upload Totals */}
          {stats.studentUploadTotals && (stats.studentUploadTotals.totalStudentsUploaded > 0 || stats.studentUploadTotals.totalSilverCoinsDistributed > 0 || stats.studentUploadTotals.totalGoldenCoinsDistributed > 0) && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                Student Upload Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-purple-100">
                  <div className="text-xs text-gray-600 mb-1">Total Students Uploaded</div>
                  <div className="text-2xl font-bold text-purple-700">
                    {stats.studentUploadTotals.totalStudentsUploaded}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <div className="text-xs text-gray-600 mb-1">Total Silver Coins</div>
                  <div className="text-2xl font-bold text-gray-700 flex items-center gap-1">
                    {stats.studentUploadTotals.totalSilverCoinsDistributed}
                    <Coins className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-yellow-200">
                  <div className="text-xs text-gray-600 mb-1">Total Golden Coins</div>
                  <div className="text-2xl font-bold text-yellow-600 flex items-center gap-1">
                    {stats.studentUploadTotals.totalGoldenCoinsDistributed}
                    <Coins className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-5 h-5 text-gray-600" />
        <select
          value={selectedFilter}
          onChange={(e) => {
            setSelectedFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Actions</option>
          <option value="Institute Added">Institute Added</option>
          <option value="Institute Edited">Institute Edited</option>
          <option value="Institute Deleted">Institute Deleted</option>
          <option value="Student Upload">Student Upload</option>
          <option value="Coins Distributed">Coins Distributed</option>
          <option value="Assessment Uploaded">Assessment Uploaded</option>
        </select>
        <span className="text-sm text-gray-600">
          {pagination?.totalCount || 0} total activities
        </span>
      </div>

      {/* Activity Timeline */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No activities found</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity._id}
              className={`border rounded-lg p-4 transition-all ${ACTION_COLORS[activity.actionType] || 'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {ACTION_ICONS[activity.actionType]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {activity.actionType}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {getActivityDescription(activity)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleActivityDetails(activity._id)}
                      className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                      title="View details"
                    >
                      {expandedActivity === activity._id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(activity.performedAt)}</span>
                  </div>
                  {renderActivityDetails(activity)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!pagination.hasMore}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AmbassadorActivityProfile;

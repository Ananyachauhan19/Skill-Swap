import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { FiClock, FiUserPlus, FiEdit3, FiTrash2, FiTrendingUp, FiAward, FiUsers, FiActivity } from 'react-icons/fi';

const InternCoordinatorActivityLog = () => {
  const [activities, setActivities] = useState([]);
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKEND_URL}/api/intern-coordinator/activity-logs`,
        { withCredentials: true }
      );
      setActivities(res.data.activities);
      setKpiData(res.data.kpi);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const iconMap = {
      intern_added: FiUserPlus,
      intern_edited: FiEdit3,
      intern_deleted: FiTrash2,
    };
    return iconMap[type] || FiClock;
  };

  const getActivityColor = (type) => {
    if (type.includes('added') || type.includes('created')) return 'text-green-600 bg-green-50';
    if (type.includes('edited')) return 'text-blue-600 bg-blue-50';
    if (type.includes('deleted')) return 'text-red-600 bg-red-50';
    return 'text-purple-600 bg-purple-50';
  };

  const getActivityLabel = (type) => {
    const labels = {
      intern_added: 'Intern Added',
      intern_edited: 'Intern Updated',
      intern_deleted: 'Intern Deleted',
    };
    return labels[type] || type;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiActivity size={28} />
            My Activity Log
          </h1>
          <p className="text-gray-600 mt-1">Track all your intern management activities</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* KPI Section */}
        {kpiData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Interns</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{kpiData.totalInterns}</p>
                </div>
                <FiUsers className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Active Interns</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{kpiData.activeInterns}</p>
                </div>
                <FiTrendingUp className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Completed Interns</p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">{kpiData.completedInterns}</p>
                </div>
                <FiAward className="text-purple-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiClock size={20} />
              Recent Activity
            </h2>
          </div>

          <div className="p-6">
            {activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.activityType);
                  const colorClass = getActivityColor(activity.activityType);
                  
                  return (
                    <div
                      key={activity._id || index}
                      className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {getActivityLabel(activity.activityType)}
                            </p>
                            {activity.internName && (
                              <p className="text-sm text-gray-700 mt-1">
                                {activity.internName} {activity.internEmployeeCode && `(${activity.internEmployeeCode})`}
                              </p>
                            )}
                            {activity.details && typeof activity.details === 'object' && (
                              <div className="text-xs text-gray-500 mt-2">
                                {activity.details.changes && Array.isArray(activity.details.changes) && activity.details.changes.length > 0 ? (
                                  <div className="space-y-1">
                                    {activity.details.changes.map((change, idx) => (
                                      <p key={idx} className="ml-2">
                                        • <span className="font-medium capitalize">{change.field.replace(/([A-Z])/g, ' $1').trim()}</span>: 
                                        <span className="line-through text-red-600 mx-1">{change.oldValue}</span>
                                        →
                                        <span className="text-green-600 mx-1 font-medium">{change.newValue}</span>
                                      </p>
                                    ))}
                                  </div>
                                ) : (
                                  Object.entries(activity.details)
                                    .filter(([k, v]) => v && k !== '_id' && k !== 'updated' && k !== 'changes' && k !== 'certificatesRegenerated')
                                    .map(([k, v]) => (
                                      <p key={k}>{k}: {typeof v === 'object' ? JSON.stringify(v) : v}</p>
                                    ))
                                )}
                                {activity.details.certificatesRegenerated && (
                                  <p className="text-blue-600 font-medium mt-1">
                                    ✓ Certificates regenerated
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap font-medium">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FiClock size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No activity recorded yet</p>
                <p className="text-sm mt-1">Start adding interns to see your activity here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternCoordinatorActivityLog;

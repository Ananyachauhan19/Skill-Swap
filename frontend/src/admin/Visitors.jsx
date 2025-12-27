import { useState, useEffect } from 'react';
import { FiUsers, FiMonitor, FiGlobe, FiCalendar, FiChevronLeft, FiChevronRight, FiFilter } from 'react-icons/fi';
import { BACKEND_URL } from '../config';

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);
  const [dateFilter, setDateFilter] = useState('overall');
  const [customDateRange, setCustomDateRange] = useState({ startDate: '', endDate: '' });
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  useEffect(() => {
    fetchVisitorStats();
    fetchVisitors();
  }, [page, dateFilter, customDateRange]);

  const buildQueryParams = () => {
    let queryParams = '';
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      queryParams = `?startDate=${today}&endDate=${today}`;
    } else if (dateFilter === 'weekly') {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      queryParams = `?startDate=${weekAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
    } else if (dateFilter === 'monthly') {
      const today = new Date();
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      queryParams = `?startDate=${monthAgo.toISOString().split('T')[0]}&endDate=${today.toISOString().split('T')[0]}`;
    } else if (dateFilter === 'custom' && customDateRange.startDate && customDateRange.endDate) {
      queryParams = `?startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
    }
    return queryParams;
  };

  const fetchVisitorStats = async () => {
    try {
      const queryParams = buildQueryParams();
      const url = `${BACKEND_URL}/api/visitors/stats${queryParams}`;
      console.log('[Visitors] Fetching stats with URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Visitors] Stats response:', data);
      setStats(data);
    } catch (error) {
      console.error('[Visitors] Failed to fetch visitor stats:', error);
    }
  };

  const fetchVisitors = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const separator = queryParams ? '&' : '?';
      const url = `${BACKEND_URL}/api/visitors/all${queryParams}${separator}page=${page}&limit=${limit}`;
      console.log('[Visitors] Fetching visitors with URL:', url);
      
      const response = await fetch(url, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[Visitors] Visitors response:', data);
      setVisitors(data.visitors || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('[Visitors] Failed to fetch visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filter) => {
    setDateFilter(filter);
    setPage(1); // Reset to first page
    if (filter === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  const handleCustomDateApply = () => {
    if (customDateRange.startDate && customDateRange.endDate) {
      setShowCustomDatePicker(false);
      setPage(1);
      setDateFilter('custom');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ icon: Icon, title, value, bgColor, iconColor }) => (
    <div className={`${bgColor} rounded-lg p-4 shadow-sm`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`${iconColor} bg-opacity-10 p-3 rounded-lg`}>
          <Icon className={`${iconColor.replace('bg-', 'text-')} w-6 h-6`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Visitor Analytics</h1>
        <p className="text-sm text-gray-600 mt-1">
          Track anonymous users who visit your website
        </p>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700">
            <FiFilter size={16} />
            <span className="text-xs font-semibold">Filter:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDateFilterChange('overall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === 'overall'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleDateFilterChange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === 'today'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDateFilterChange('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === 'weekly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleDateFilterChange('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleDateFilterChange('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Custom Date Picker */}
        {showCustomDatePicker && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleCustomDateApply}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={FiUsers}
            title="Total Visitors"
            value={stats.totalVisitors || 0}
            bgColor="bg-blue-50"
            iconColor="bg-blue-600"
          />
          <StatCard
            icon={FiUsers}
            title="Unique Visitors"
            value={stats.uniqueVisitors || 0}
            bgColor="bg-green-50"
            iconColor="bg-green-600"
          />
          <StatCard
            icon={FiCalendar}
            title="Today"
            value={stats.todayVisitors || 0}
            bgColor="bg-purple-50"
            iconColor="bg-purple-600"
          />
          <StatCard
            icon={FiCalendar}
            title="This Week"
            value={stats.weekVisitors || 0}
            bgColor="bg-orange-50"
            iconColor="bg-orange-600"
          />
        </div>
      )}

      {/* Device & Browser Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Device Stats */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <FiMonitor className="mr-2" />
              Device Distribution
            </h3>
            <div className="space-y-2">
              {stats.deviceStats && stats.deviceStats.length > 0 ? (
                stats.deviceStats.map((device) => (
                  <div key={device._id} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 capitalize">{device._id || 'Unknown'}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${stats.totalVisitors > 0 ? (device.count / stats.totalVisitors) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 w-8 text-right">
                        {device.count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No device data available</p>
              )}
            </div>
          </div>

          {/* Browser Stats */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <FiGlobe className="mr-2" />
              Browser Distribution
            </h3>
            <div className="space-y-2">
              {stats.browserStats && stats.browserStats.length > 0 ? (
                stats.browserStats.slice(0, 5).map((browser) => (
                  <div key={browser._id} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{browser._id || 'Unknown'}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${stats.totalVisitors > 0 ? (browser.count / stats.totalVisitors) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-900 w-8 text-right">
                        {browser.count}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No browser data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Visitors Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Recent Visitors</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      Visitor Identifier
                    </th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      Browser
                    </th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      OS
                    </th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      First Visit
                    </th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-4 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                      Visits
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitors.map((visitor) => (
                    <tr
                      key={visitor._id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-900">
                        {/* Never display raw IP. If enhanced consent is enabled
                           and an ipHash is available, show a masked prefix; 
                           otherwise just indicate the visitor is anonymous. */}
                        {visitor.consentEnhanced && visitor.ipHash
                          ? `hash:${String(visitor.ipHash).slice(0, 6)}…`
                          : 'Anonymous'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600 capitalize">
                        {visitor.device}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                        {visitor.browser}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                        {visitor.os}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                        {visitor.location?.country || 'Unknown'}
                        {visitor.location?.city && `, ${visitor.location.city}`}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                        {formatDate(visitor.createdAt)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600">
                        {formatDate(visitor.lastVisit)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                          {visitor.visitCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <FiChevronLeft className="mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <FiChevronRight className="ml-1" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Visitors;

import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';
import { FiMail, FiClock, FiCheckCircle, FiAlertCircle, FiSearch, FiSend, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import { FaReply, FaTimes } from 'react-icons/fa';

const AdminHelpSupport = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, replied: 0, resolved: 0 });
  const [showReplyModal, setShowReplyModal] = useState(false);
  
  // New state for date filtering
  const [timeFilter, setTimeFilter] = useState('overall'); // 'overall', 'daily', 'weekly', 'monthly'
  const [selectedDate, setSelectedDate] = useState('');
  const [dateStats, setDateStats] = useState(null);

  useEffect(() => {
    // Reset list paging when filters change
    setMessages([]);
    setPage(1);
  }, [filter, searchQuery, timeFilter, selectedDate]);

  useEffect(() => {
    fetchMessages(1, { append: false });
  }, [filter, searchQuery, timeFilter, selectedDate]);

  useEffect(() => {
    if (timeFilter === 'overall') {
      fetchStats();
    } else if (selectedDate) {
      fetchDateStats();
    } else {
      setDateStats(null);
    }
  }, [timeFilter, selectedDate]);

  const fetchMessages = async (pageToFetch = 1, { append } = { append: false }) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', String(pageToFetch));
      params.append('limit', '20');

      if (timeFilter !== 'overall' && selectedDate) {
        params.append('period', timeFilter);
        params.append('date', selectedDate);
      }
      
      const res = await fetch(`${BACKEND_URL}/api/support/messages?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await res.json();
      const nextMessages = data.messages || [];
      setTotalPages(Number(data.totalPages) || 1);
      setPage(Number(data.currentPage) || pageToFetch);
      setMessages((prev) => (append ? [...prev, ...nextMessages] : nextMessages));
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/statistics`, {
        credentials: 'include'
      });
      const data = await res.json();
      setStats(data);
      setDateStats(null); // Clear date stats when showing overall
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchDateStats = async () => {
    if (!selectedDate) return;
    
    try {
      const params = new URLSearchParams({
        period: timeFilter,
        date: selectedDate
      });
      
      const res = await fetch(`${BACKEND_URL}/api/support/date-statistics?${params}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setDateStats(data);
    } catch (error) {
      console.error('Error fetching date statistics:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;

    setReplyLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/messages/${selectedMessage._id}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText })
      });

      if (!res.ok) throw new Error('Failed to send reply');

      alert('Reply sent successfully!');
      setReplyText('');
      setShowReplyModal(false);
      setSelectedMessage(null);
      setMessages([]);
      setPage(1);
      fetchMessages(1, { append: false });
      if (timeFilter === 'overall') fetchStats();
      else if (selectedDate) fetchDateStats();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/support/messages/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setMessages([]);
      setPage(1);
      fetchMessages(1, { append: false });
      if (timeFilter === 'overall') fetchStats();
      else if (selectedDate) fetchDateStats();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleMessagesScroll = (e) => {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
    if (!nearBottom) return;
    if (loadingMore || loading) return;
    if (page >= totalPages) return;
    fetchMessages(page + 1, { append: true });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'replied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="text-yellow-600" />;
      case 'replied':
        return <FiMail className="text-blue-600" />;
      case 'resolved':
        return <FiCheckCircle className="text-green-600" />;
      default:
        return <FiAlertCircle className="text-gray-600" />;
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Help & Support</h1>
        <p className="text-sm text-gray-600">Manage and respond to user requests</p>
      </div>

      {/* Time Period Filter */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          </div>

          <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200 w-fit">
            <button
              onClick={() => {
                setTimeFilter('overall');
                setSelectedDate('');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeFilter === 'overall'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setTimeFilter('daily')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeFilter === 'daily'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeFilter('weekly')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeFilter === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeFilter('monthly')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                timeFilter === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
          </div>

          {timeFilter !== 'overall' && (
            <div className="flex items-center gap-2 lg:ml-auto">
              <span className="text-xs font-medium text-gray-600">Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 px-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
        </div>

        {timeFilter !== 'overall' && selectedDate && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
            <FiTrendingUp className="text-gray-500" />
            <span className="font-medium text-gray-800">Active:</span>
            <span>
              {timeFilter === 'daily' && new Date(selectedDate).toLocaleDateString()}
              {timeFilter === 'weekly' && `Week of ${new Date(selectedDate).toLocaleDateString()}`}
              {timeFilter === 'monthly' && new Date(selectedDate).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                {dateStats ? dateStats.total : stats.total}
              </p>
            </div>
            <FiMail className="text-xl text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-lg sm:text-xl font-bold text-yellow-600 leading-tight">
                {dateStats ? dateStats.pending : stats.pending}
              </p>
            </div>
            <FiClock className="text-xl text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Replied</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600 leading-tight">
                {dateStats ? dateStats.replied : stats.replied}
              </p>
            </div>
            <FaReply className="text-xl text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Resolved</p>
              <p className="text-lg sm:text-xl font-bold text-green-600 leading-tight">
                {dateStats ? dateStats.resolved : stats.resolved}
              </p>
            </div>
            <FiCheckCircle className="text-xl text-green-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('replied')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'replied'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Replied
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved
            </button>
          </div>

          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or message..."
              className="w-full h-9 pl-10 pr-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FiMail className="mx-auto text-5xl mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No messages found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div
            className="divide-y divide-gray-100 max-h-[62vh] overflow-y-auto"
            onScroll={handleMessagesScroll}
          >
            {messages.map((msg) => (
              <div
                key={msg._id}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedMessage(msg);
                  setShowReplyModal(true);
                  setReplyText('');
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{msg.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(msg.status)}`}>
                        {getStatusIcon(msg.status)}
                        {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{msg.email}</p>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{msg.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 {new Date(msg.createdAt).toLocaleString()}</span>
                      {msg.userId && (
                        <span>👤 User ID: {msg.userId._id || msg.userId}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2">
                    {msg.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMessage(msg);
                          setShowReplyModal(true);
                          setReplyText('');
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <FaReply /> Reply
                      </button>
                    )}
                    {msg.status === 'replied' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(msg._id, 'resolved');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <FiCheckCircle /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>

                {msg.adminReply && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm font-medium text-blue-900 mb-2">Admin Reply:</p>
                    <p className="text-sm text-blue-800">{msg.adminReply}</p>
                    {msg.repliedAt && (
                      <p className="text-xs text-blue-600 mt-2">
                        Replied on {new Date(msg.repliedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {loadingMore && (
              <div className="p-4 text-center text-xs text-gray-500">
                Loading more...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Reply to Help Request</h2>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setSelectedMessage(null);
                  setReplyText('');
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
                <p className="text-gray-700"><strong>Name:</strong> {selectedMessage.name}</p>
                <p className="text-gray-700"><strong>Email:</strong> {selectedMessage.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Submitted on {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Original Message */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">User Message:</h3>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {/* Previous Reply (if exists) */}
              {selectedMessage.adminReply && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Previous Reply:</h3>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.adminReply}</p>
                    {selectedMessage.repliedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Sent on {new Date(selectedMessage.repliedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Reply Input */}
              {selectedMessage.status !== 'resolved' && (
                <div>
                  <label className="block font-semibold text-gray-900 mb-2">
                    Your Reply:
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[150px]"
                    placeholder="Type your reply here..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={replyLoading}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This reply will be sent to {selectedMessage.email}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setSelectedMessage(null);
                    setReplyText('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  disabled={replyLoading}
                >
                  Cancel
                </button>
                {selectedMessage.status !== 'resolved' && (
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replyLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {replyLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend /> Send Reply
                      </>
                    )}
                  </button>
                )}
                {selectedMessage.status === 'replied' && (
                  <button
                    onClick={() => {
                      updateStatus(selectedMessage._id, 'resolved');
                      setShowReplyModal(false);
                      setSelectedMessage(null);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <FiCheckCircle /> Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHelpSupport;

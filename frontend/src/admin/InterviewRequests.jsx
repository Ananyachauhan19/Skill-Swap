import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  FiSearch, FiFilter, FiCalendar, FiUser, FiClock,
  FiCheck, FiX, FiUserCheck, FiStar, FiMessageSquare,
  FiBriefcase, FiMail, FiPhone, FiMapPin, FiChevronRight
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: FiClock, label: 'Pending' },
  assigned: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FiUser, label: 'Assigned' },
  scheduled: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: FiCalendar, label: 'Scheduled' },
  completed: { color: 'bg-green-50 text-green-700 border-green-200', icon: FiCheck, label: 'Completed' },
  rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: FiX, label: 'Rejected' },
  cancelled: { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: FiX, label: 'Cancelled' },
};

const statusOptions = [
  { id: 'all', label: 'All Status' },
  { id: 'pending', label: 'Pending' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'completed', label: 'Completed' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'cancelled', label: 'Cancelled' },
];

const dateRangeOptions = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'custom', label: 'Custom Range' },
];

export default function InterviewRequests() {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignInput, setAssignInput] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailTab, setDetailTab] = useState('overview');
  const itemsPerPage = 20;
  const { user, loading: authLoading } = useAuth();

  const location = useLocation();

  // sync active status with query param (?status=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('status');
    if (s) setActiveStatus(s);
    else setActiveStatus('all');
    setSelectedRequest(null);
    setDrawerOpen(false);
  }, [location.search]);

  const loadRequests = async () => {
    try {
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
      const isAdmin = user && user.email && adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase();
      const endpoint = isAdmin ? '/api/interview/all-requests' : '/api/interview/requests';
      
      const res = await fetch(`${BACKEND_URL}${endpoint}`, { credentials: 'include' });
      const data = await res.json();
      
      if (isAdmin) {
        setAllRequests(data || []);
      } else {
        const received = (data && data.received) || [];
        const sent = (data && data.sent) || [];
        const combined = [
          ...received.map((r) => ({ ...r, _role: 'received' })),
          ...sent.map((r) => ({ ...r, _role: 'sent' })),
        ];
        setAllRequests(combined);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading requests:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleAssign = async () => {
    if (!assignInput.trim()) {
      alert('Please enter an interviewer username');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: selectedRequest._id, 
          interviewerUsername: assignInput.trim() 
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Assignment failed');
      
      alert('Interviewer assigned successfully!');
      setAssignInput('');
      await loadRequests();
      const updated = allRequests.find(r => r._id === selectedRequest._id);
      if (updated) setSelectedRequest(updated);
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to assign interviewer');
    }
  };

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start = null, end = null;

    switch (dateFilter) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case 'custom':
        if (customStartDate) start = new Date(customStartDate);
        if (customEndDate) {
          end = new Date(customEndDate);
          end.setDate(end.getDate() + 1);
        }
        break;
      default:
        break;
    }
    return { start, end };
  };

  // Filter requests with date range
  const filteredRequests = allRequests.filter(req => {
    const matchesStatus = activeStatus === 'all' || req.status === activeStatus;
    const matchesSearch = !searchQuery || 
      req.requester?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.assignedInterviewer?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter
    const { start, end } = getDateRange();
    let matchesDate = true;
    if (start && end) {
      const reqDate = new Date(req.createdAt);
      matchesDate = reqDate >= start && reqDate < end;
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeStatus, searchQuery, dateFilter, customStartDate, customEndDate]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const renderRequestCard = (request) => {
    const isSelected = selectedRequest?._id === request._id;

    return (
      <div
        key={request._id}
        onClick={() => {
          setSelectedRequest(request);
          setDrawerOpen(true);
        }}
        className={`bg-white border rounded-lg transition-all cursor-pointer ${
          isSelected
            ? 'bg-blue-50 border-blue-300 shadow-sm'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        } p-3`}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 flex-shrink-0">
            {request.requester?.profilePic ? (
              <img
                src={request.requester.profilePic}
                alt={request.requester.username}
                className={`w-10 h-10 rounded-full object-cover border-2 ${
                  isSelected ? 'border-blue-300' : 'border-gray-100'
                }`}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {getInitials(request.requester?.username || request.requester?.firstName)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Name and Status */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {request.requester?.username || request.requester?.firstName || 'Unknown User'}
              </h3>
              {getStatusBadge(request.status)}
            </div>

            {/* Position & Company */}
            <div className="text-sm text-gray-600 mb-2">
              <span className="text-xs text-gray-500">Requested for: </span>
              <span className="inline-flex items-center gap-1.5">
                <FiBriefcase size={13} className="flex-shrink-0" />
                <span className="truncate">
                  {request.position} at {request.company}
                </span>
              </span>
            </div>

            {/* Metadata Row */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {/* Assigned Interviewer */}
              {request.assignedInterviewer && (
                <div className="flex items-center gap-1">
                  <FiUserCheck size={12} className="text-blue-600" />
                  <span className="truncate max-w-[120px]">
                    {request.assignedInterviewer.username}
                  </span>
                </div>
              )}

              {/* Scheduled Date */}
              {request.scheduledAt && (
                <div className="flex items-center gap-1">
                  <FiCalendar size={12} className="text-purple-600" />
                  <span>{formatDate(request.scheduledAt)}</span>
                </div>
              )}

              {/* Created Date if no other metadata */}
              {!request.assignedInterviewer && !request.scheduledAt && (
                <div className="flex items-center gap-1">
                  <FiClock size={12} />
                  <span>{formatDate(request.createdAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDrawerContent = () => {
    if (!selectedRequest) return null;

    const tabs = [
      { id: 'overview', label: 'Overview', icon: FiUser },
      { id: 'details', label: 'Details', icon: FiBriefcase },
      { id: 'history', label: 'History', icon: FiClock },
    ];

    return (
      <div className="flex flex-col h-full">
        {/* Drawer Header */}
        <div className="flex-shrink-0 border-b border-gray-200 p-4 bg-white">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                {selectedRequest.requester?.profilePic ? (
                  <img
                    src={selectedRequest.requester.profilePic}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {getInitials(selectedRequest.requester?.username || selectedRequest.requester?.firstName)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedRequest.requester?.username || 'Unknown User'}
                </h3>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    detailTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {detailTab === 'overview' && (
            <div className="space-y-4">
              {/* Position Details */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Position Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Company:</span>{' '}
                    <span className="text-gray-900 font-medium">{selectedRequest.company}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Position:</span>{' '}
                    <span className="text-gray-900 font-medium">{selectedRequest.position}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Requested:</span>{' '}
                    <span className="text-gray-900 font-medium">{formatDateTime(selectedRequest.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Interviewer */}
              {selectedRequest.assignedInterviewer && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Assigned Interviewer</h4>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold shadow">
                      {getInitials(selectedRequest.assignedInterviewer.username)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedRequest.assignedInterviewer.username}
                      </p>
                      <p className="text-xs text-gray-600">
                        {selectedRequest.assignedInterviewer.firstName} {selectedRequest.assignedInterviewer.lastName}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule */}
              {selectedRequest.scheduledAt && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Interview Schedule</h4>
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-purple-600" size={16} />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDateTime(selectedRequest.scheduledAt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Rating */}
              {selectedRequest.rating && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Interview Rating</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          size={18}
                          className={i < selectedRequest.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-900">{selectedRequest.rating}/5</span>
                  </div>
                  {selectedRequest.feedback && (
                    <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                      {selectedRequest.feedback}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {detailTab === 'details' && (
            <div className="space-y-4">
              {/* Requester Contact */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Requester Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FiUser size={14} className="text-gray-400" />
                    <span className="text-gray-700">
                      {selectedRequest.requester?.firstName} {selectedRequest.requester?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail size={14} className="text-gray-400" />
                    <span className="text-gray-700">{selectedRequest.requester?.email}</span>
                  </div>
                  {selectedRequest.requester?.country && (
                    <div className="flex items-center gap-2">
                      <FiMapPin size={14} className="text-gray-400" />
                      <span className="text-gray-700">{selectedRequest.requester.country}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {selectedRequest.message && (
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Request Message</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.message}</p>
                </div>
              )}
            </div>
          )}

          {detailTab === 'history' && (
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Timeline</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Request Created</p>
                      <p className="text-xs text-gray-500">{formatDateTime(selectedRequest.createdAt)}</p>
                    </div>
                  </div>
                  {selectedRequest.assignedInterviewer && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Interviewer Assigned</p>
                        <p className="text-xs text-gray-500">
                          {selectedRequest.assignedInterviewer.username}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.scheduledAt && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Interview Scheduled</p>
                        <p className="text-xs text-gray-500">{formatDateTime(selectedRequest.scheduledAt)}</p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.status === 'completed' && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Interview Completed</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="mt-3 text-sm text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Filter Bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Interview Requests</h1>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredRequests.length}</span> requests
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, company, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={activeStatus}
                onChange={(e) => setActiveStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                {statusOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <FiFilter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Date Range Filter */}
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                {dateRangeOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              <FiFilter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Request List */}
        <div
          className={`flex-shrink-0 bg-gray-50 overflow-y-auto transition-all duration-300 ${
            drawerOpen ? 'w-[calc(100%-400px)]' : 'w-full'
          }`}
        >
          <div className="p-6">
            {paginatedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FiCalendar className="text-gray-400" size={32} />
                </div>
                <div className="text-base font-medium text-gray-900">No requests found</div>
                <div className="text-sm text-gray-600 mt-1">
                  {searchQuery ? 'Try adjusting your filters' : 'No interview requests available'}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedRequests.map((request) => renderRequestCard(request))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Sliding Detail Drawer */}
        <div
          className={`flex-shrink-0 bg-white border-l border-gray-200 shadow-lg transition-all duration-300 overflow-hidden ${
            drawerOpen ? 'w-[400px]' : 'w-0'
          }`}
        >
          {drawerOpen && <div className="h-full w-[400px]">{renderDrawerContent()}</div>}
        </div>
      </div>
    </div>
  );
}

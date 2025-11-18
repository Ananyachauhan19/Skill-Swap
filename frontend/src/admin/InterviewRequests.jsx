import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  scheduled: 'bg-purple-100 text-purple-800 border-purple-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function InterviewRequests() {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assignInput, setAssignInput] = useState('');
  const { user, loading: authLoading } = useAuth();

  const location = useLocation();

  // sync active status with query param (?status=...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const s = params.get('status');
    if (s) setActiveStatus(s);
    else setActiveStatus('all');
    // deselect selected request when status changes
    setSelectedRequest(null);
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
      // Update selected request
      const updated = allRequests.find(r => r._id === selectedRequest._id);
      if (updated) setSelectedRequest({ ...updated, status: 'assigned' });
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to assign interviewer');
    }
  };

  // Filter requests
  const filteredRequests = allRequests.filter(req => {
    const matchesStatus = activeStatus === 'all' || req.status === activeStatus;
    const matchesSearch = !searchQuery || 
      req.requester?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.assignedInterviewer?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // status counts are rendered in the main AdminSidebar now

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Interview Requests</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and assign interview requests to approved interviewers
            </p>
          </div>
          
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by user, company, position..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 h-full overflow-hidden">
        {/* Center - Request List */}
        <div className="flex-1 h-full overflow-y-auto bg-gray-50 px-6 py-5">
          {filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search criteria' : 'No interview requests available'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(request => (
                <div
                  key={request._id}
                  onClick={() => setSelectedRequest(request)}
                  className={`bg-white rounded-lg border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
                    selectedRequest?._id === request._id
                      ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {getInitials(request.requester?.username || request.requester?.firstName)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {request.requester?.username || request.requester?.firstName || 'Unknown User'}
                          </h3>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {request.position} at {request.company}
                          </p>
                          <p className="text-xs text-gray-500">
                            Requested on {formatDate(request.createdAt)}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[request.status] || STATUS_COLORS.pending}`}>
                          {request.status}
                        </span>
                      </div>

                      {/* Assigned Interviewer */}
                      {request.assignedInterviewer && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-600">
                            Assigned to: <span className="font-medium text-gray-900">{request.assignedInterviewer.username}</span>
                          </span>
                        </div>
                      )}

                      {/* Scheduled Date */}
                      {request.scheduledAt && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">
                            Scheduled: <span className="font-medium text-gray-900">{formatDate(request.scheduledAt)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Request Details */}
        <div className="w-96 bg-white border-l border-gray-200 h-full overflow-y-auto shadow-lg">
          {!selectedRequest ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-sm text-gray-500">
                  Select a request to view details
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                    {getInitials(selectedRequest.requester?.username || selectedRequest.requester?.firstName)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedRequest.requester?.username || 'Unknown User'}
                    </h2>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[selectedRequest.status] || STATUS_COLORS.pending}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Sections */}
              <div className="space-y-6">
                {/* Position Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Position Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Company</label>
                      <p className="text-sm font-medium text-gray-900">{selectedRequest.company}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Position</label>
                      <p className="text-sm font-medium text-gray-900">{selectedRequest.position}</p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {selectedRequest.message && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Request Message
                    </h3>
                    <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      {selectedRequest.message}
                    </p>
                  </div>
                )}

                {/* Requester Info */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Requester Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-gray-600">
                        {selectedRequest.requester?.firstName} {selectedRequest.requester?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">
                        Created: {formatDate(selectedRequest.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Interviewer */}
                {selectedRequest.assignedInterviewer && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Assigned Interviewer
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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
                  </div>
                )}

                {/* Scheduled Date */}
                {selectedRequest.scheduledAt && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Interview Schedule
                    </h3>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium text-gray-900">
                          {formatDate(selectedRequest.scheduledAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rating & Feedback */}
                {selectedRequest.rating && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Interview Rating
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-5 h-5 ${i < selectedRequest.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {selectedRequest.rating}/5
                        </span>
                      </div>
                      {selectedRequest.feedback && (
                        <p className="text-sm text-gray-700 mt-2">
                          {selectedRequest.feedback}
                        </p>
                      )}
                      {selectedRequest.ratedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Rated on {formatDate(selectedRequest.ratedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Assign Interviewer (Admin Only, Pending Status) */}
                {user && user.email && import.meta.env.VITE_ADMIN_EMAIL && 
                 user.email.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL.toLowerCase() && 
                 selectedRequest.status === 'pending' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Assign Interviewer
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Enter interviewer username"
                        value={assignInput}
                        onChange={(e) => setAssignInput(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                      <button
                        onClick={handleAssign}
                        className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Assign Interviewer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

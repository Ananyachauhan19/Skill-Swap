import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';
import PageNotFound from '../components/PageNotFound';
import socket from '../socket.js';
import { useAuth } from '../context/AuthContext';

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [skillMateStatus, setSkillMateStatus] = useState({});
  const [requestLoading, setRequestLoading] = useState({});
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);

  // Set up socket listeners for SkillMate requests
  useEffect(() => {
    if (!user) return;
    
    // Listen for SkillMate request sent confirmation
    socket.on('skillmate-request-sent', (data) => {
      const recipientId = data.skillMate.recipient._id;
      setSkillMateStatus(prev => ({
        ...prev,
        [recipientId]: { status: 'pending', isRequester: true }
      }));
      setRequestLoading(prev => ({ ...prev, [recipientId]: false }));
    });
    
    // Listen for SkillMate request errors
    socket.on('skillmate-request-error', (data) => {
      alert(data.message || 'Failed to send SkillMate request');
      setRequestLoading({});
    });
    
    // Listen for SkillMate request approval
    socket.on('skillmate-request-approved', (data) => {
      const skillMateId = data.skillMate.requester._id === user._id 
        ? data.skillMate.recipient._id 
        : data.skillMate.requester._id;
      
      setSkillMateStatus(prev => ({
        ...prev,
        [skillMateId]: { status: 'approved' }
      }));
    });
    
    // Listen for SkillMate request rejection
    socket.on('skillmate-request-rejected', (data) => {
      const skillMateId = data.skillMate.requester._id === user._id 
        ? data.skillMate.recipient._id 
        : data.skillMate.requester._id;
      
      setSkillMateStatus(prev => ({
        ...prev,
        [skillMateId]: { status: 'rejected' }
      }));
    });
    
    return () => {
      socket.off('skillmate-request-sent');
      socket.off('skillmate-request-error');
      socket.off('skillmate-request-approved');
      socket.off('skillmate-request-rejected');
    };
  }, [user]);
  
  // Extract search query from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
      
      // If the query looks like a direct username search (no spaces, special chars)
      if (/^[a-zA-Z0-9_]+$/.test(query)) {
        checkUserExists(query);
      } else {
        performSearch(query);
      }
    }
  }, [location.search]);
  
  // Check if a user exists and redirect directly to their profile if they do
  const checkUserExists = async (username) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/user/public/${username}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        // User exists, redirect to their profile
        navigate(`/profile/${username}`);
        return;
      }
      
      // If user doesn't exist, perform a regular search
      performSearch(username);
    } catch (err) {
      console.error('Error checking user:', err);
      performSearch(username);
    }
  };

  // Check SkillMate status for each user in search results
  useEffect(() => {
    if (!user || searchResults.length === 0) return;
    
    const checkSkillMateStatuses = async () => {
      const statuses = {};
      
      for (const result of searchResults) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/skillmates/check/${result._id}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            statuses[result._id] = {
              status: data.isSkillMate ? 'approved' : 
                     (data.pendingRequest ? 'pending' : 'none'),
              isRequester: data.pendingRequest?.isRequester || false,
              requestId: data.pendingRequest?.id || null
            };
          }
        } catch (error) {
          console.error('Error checking SkillMate status:', error);
        }
      }
      
      setSkillMateStatus(statuses);
    };
    
    checkSkillMateStatuses();
  }, [searchResults, user]);
  
  // Function to search for users
  const performSearch = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setNoResults(false);
    
    try {
      // Search for users by username
      const response = await fetch(`${BACKEND_URL}/api/auth/search?username=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search for users');
      }

      const data = await response.json();
      
      if (data.users && data.users.length > 0) {
        setSearchResults(data.users);
        setNoResults(false);
      } else {
        setSearchResults([]);
        setNoResults(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Send a SkillMate request
  const handleSendSkillMateRequest = async (e, userId) => {
    e.stopPropagation(); // Prevent navigation to profile
    
    if (!user) {
      alert('Please log in to send SkillMate requests');
      return;
    }
    
    setRequestLoading(prev => ({ ...prev, [userId]: true }));
    
    // Emit socket event to send SkillMate request
    socket.emit('send-skillmate-request', { recipientId: userId });
  };
  
  // Get button text based on SkillMate status
  const getSkillMateButtonText = (userId) => {
    const status = skillMateStatus[userId];
    
    if (!status) return 'Add SkillMate';
    
    switch (status.status) {
      case 'approved':
        return 'SkillMate';
      case 'pending':
        return status.isRequester ? 'Request Sent' : 'Approve Request';
      case 'rejected':
        return 'Request Rejected';
      default:
        return 'Add SkillMate';
    }
  };
  
  // Get button class based on SkillMate status
  const getSkillMateButtonClass = (userId) => {
    const status = skillMateStatus[userId];
    
    if (!status) return 'bg-blue-600 hover:bg-blue-700';
    
    switch (status.status) {
      case 'approved':
        return 'bg-green-600 hover:bg-green-700';
      case 'pending':
        return status.isRequester ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700';
      case 'rejected':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };
  
  // Navigate to user's public profile
  const navigateToProfile = (username) => {
    if (username) {
      navigate(`/profile/${username}`);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      performSearch(searchQuery);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 pt-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Search Results</h1>
        
        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for users..."
              className="flex-grow px-4 py-2 rounded-l-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Search
            </button>
          </div>
        </form>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* No results */}
        {noResults && !loading && !error && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No users found</h2>
            <p className="text-gray-600">We couldn't find any users matching your search.</p>
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {searchResults.map((searchUser) => (
              <div 
                key={searchUser._id} 
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigateToProfile(searchUser.username)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {searchUser.profilePic ? (
                        <img 
                          src={searchUser.profilePic} 
                          alt={searchUser.username} 
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                          {searchUser.firstName ? searchUser.firstName[0].toUpperCase() : searchUser.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-blue-900">
                        {searchUser.firstName && searchUser.lastName 
                          ? `${searchUser.firstName} ${searchUser.lastName}` 
                          : searchUser.username}
                      </h3>
                      <p className="text-sm text-gray-600">@{searchUser.username}</p>
                    </div>
                  </div>
                  
                  {/* SkillMate button */}
                  {user && user._id !== searchUser._id && (
                    <button
                      onClick={(e) => handleSendSkillMateRequest(e, searchUser._id)}
                      disabled={requestLoading[searchUser._id] || 
                               (skillMateStatus[searchUser._id]?.status === 'approved') || 
                               (skillMateStatus[searchUser._id]?.status === 'pending' && skillMateStatus[searchUser._id]?.isRequester)}
                      className={`px-3 py-1.5 text-white text-sm rounded-md transition-colors ${getSkillMateButtonClass(searchUser._id)}`}
                    >
                      {requestLoading[searchUser._id] ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : getSkillMateButtonText(searchUser._id)}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
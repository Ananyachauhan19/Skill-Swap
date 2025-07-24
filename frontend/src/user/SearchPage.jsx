import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';
import PageNotFound from '../components/PageNotFound';

const SearchPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noResults, setNoResults] = useState(false);

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
            {searchResults.map((user) => (
              <div 
                key={user._id} 
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigateToProfile(user.username)}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {user.profilePic ? (
                      <img 
                        src={user.profilePic} 
                        alt={user.username} 
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                        {user.firstName ? user.firstName[0].toUpperCase() : user.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-blue-900">
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.username}
                    </h3>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                  </div>
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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../../config.js";

const SkillMate = () => {
  const [skillMates, setSkillMates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch skillmates from backend
  useEffect(() => {
    const fetchSkillMates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/skillmates/list`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch skillmates');
        }

        const data = await response.json();
        setSkillMates(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching skillmates:', err);
        setError('Failed to load skillmates. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSkillMates();
  }, []);

  // Handle removing a skillmate
  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this SkillMate?')) {
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/skillmates/remove/${id}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to remove skillmate');
      }

      // Update local state
      setSkillMates((prev) => prev.filter((mate) => mate._id !== id));
    } catch (err) {
      console.error('Error removing skillmate:', err);
      alert('Failed to remove skillmate. Please try again.');
    }
  };
  
  // Navigate to user profile
  const navigateToProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-2 sm:px-4 md:px-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Your SkillMates</h2>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillMates.map((mate) => (
            <div key={mate._id} className="flex flex-col bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-102">
              <div className="p-4 flex items-center gap-4">
                <img
                  src={mate.profilePic || '/assets/default-profile.png'}
                  alt={`${mate.firstName} ${mate.lastName}`}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 cursor-pointer"
                  onClick={() => navigateToProfile(mate.username)}
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigateToProfile(mate.username)}>
                  <div className="font-semibold text-lg text-blue-900 truncate">{`${mate.firstName} ${mate.lastName}`}</div>
                  <div className="text-sm text-gray-600 truncate">@{mate.username}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 border-t border-gray-100 flex justify-between items-center">
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => navigateToProfile(mate.username)}
                >
                  View Profile
                </button>
                <button
                  className="bg-red-100 text-red-600 px-3 py-1 rounded-md hover:bg-red-200 text-sm font-medium transition-colors"
                  onClick={() => handleRemove(mate._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {skillMates.length === 0 && (
            <div className="col-span-full text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
              <div className="text-5xl mb-4">👥</div>
              <p className="text-lg font-medium">No SkillMates found</p>
              <p className="text-sm mt-2">Connect with other users by sending SkillMate requests from their profiles.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillMate;

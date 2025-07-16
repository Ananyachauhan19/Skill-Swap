import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from './oneononeSection/serachBar';
import TutorCard from './oneononeSection/TutorCard';
import socket from '../socket';
import { STATIC_COURSES, STATIC_UNITS, STATIC_TOPICS } from '../constants/teachingData';
import { BACKEND_URL } from '../config.js';

const StartSkillSwap = () => {
  const navigate = useNavigate();
  const [courseValue, setCourseValue] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [topicValue, setTopicValue] = useState("");
  const [tutors, setTutors] = useState([]);
  const [searched, setSearched] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [hasOnlineUsers, setHasOnlineUsers] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    socket.on('online-users', (users) => {
      setOnlineUserIds(users);
      setHasOnlineUsers(users.length > 0);
    });
    return () => socket.off('online-users');
  }, []);

  const handleFindTutor = async () => {
    setSearched(true);
    setIsSearching(true);
    
    // Check if there are any online users first
    if (!hasOnlineUsers) {
      setTutors([]);
      setIsSearching(false);
      return;
    }
    
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/online-tutors/search`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: courseValue, topic: unitValue, subtopic: topicValue }),
      });
      const tutors = await res.json();
      setTutors(tutors);
    } catch (error) {
      console.error('Search error:', error);
      setTutors([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = (tutor) => {
    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit('send-session-request', {
      toUserId: tutor._id,
      fromUser: { _id: user._id, username: user.username, fullName: user.fullName }
    });
    alert('Request sent!');
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-8 text-center animate-fadeIn">
          Find Tutors for Your Doubts
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-10 text-center animate-fadeIn">
          Search for expert tutors by entering a topic/tutor related to your doubts. Connect with the perfect mentor to guide your learning journey.
        </p>
        <SearchBar
          courseValue={courseValue}
          setCourseValue={setCourseValue}
          unitValue={unitValue}
          setUnitValue={setUnitValue}
          topicValue={topicValue}
          setTopicValue={setTopicValue}
          onFindTutor={handleFindTutor}
          hasOnlineUsers={hasOnlineUsers}
          onlineUserCount={onlineUserIds.length}
          isSearching={isSearching}
        />
        
        {/* Show message if no users are online */}
        {!hasOnlineUsers && (
          <div className="mt-8 text-center py-6 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-yellow-800 text-lg font-semibold mb-2">
              No tutors are currently online
            </div>
            <div className="text-yellow-700 text-sm">
              Check back later when more tutors are available for sessions.
            </div>
          </div>
        )}
        
        {searched && (
          <div className="mt-10 max-w-3xl mx-auto w-full flex flex-col gap-6">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="text-blue-700 text-lg font-semibold">
                    Searching for tutors...
                  </div>
                </div>
                <div className="text-gray-600 text-sm">
                  Please wait while we find the perfect match.
                </div>
              </div>
            ) : (
              <>
                {tutors.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-blue-700 text-lg font-semibold mb-2">
                      No online tutors found for your search.
                    </div>
                    <div className="text-gray-600 text-sm">
                      Try searching for different topics or check back later when more tutors are online.
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-center">
                    <div className="text-green-700 text-lg font-semibold">
                      Found {tutors.length} online tutor{tutors.length > 1 ? 's' : ''}!
                    </div>
                    <div className="text-gray-600 text-sm">
                      All tutors shown are currently online and available for sessions.
                    </div>
                  </div>
                )}
                {tutors.map((tutor, idx) => (
                  <TutorCard
                    key={tutor._id}
                    tutor={{
                      name: `${tutor.firstName} ${tutor.lastName}`,
                      profilePic: tutor.profilePic,
                      status: 'Online', // Since we're only showing online tutors
                      skills: tutor.skillsToTeach.map(s => `${s.subject} > ${s.topic} > ${s.subtopic}`),
                    }}
                    onRequestSession={() => handleSendRequest(tutor)}
                  />
                ))}
              </>
            )}
          </div>
        )}
        <div className="mt-12 text-center">
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartSkillSwap;
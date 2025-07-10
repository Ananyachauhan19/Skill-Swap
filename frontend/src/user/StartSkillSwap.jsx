import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Mock tutor data (replace with API call in production)
const mockTutors = [
  { id: '1', name: 'John Doe', expertise: 'React, JavaScript, Web Development' },
  { id: '2', name: 'Jane Smith', expertise: 'Python, Data Science, Machine Learning' },
  { id: '3', name: 'Alice Johnson', expertise: 'Java, Algorithms, System Design' },
];

const StartSkillSwap = () => {
  const [topic, setTopic] = useState('');
  const [tutors, setTutors] = useState([]);
  const navigate = useNavigate();

  const handleFindTutor = () => {
    // Simulate fetching tutors based on topic
    // In production, replace with API call: fetch(`${BACKEND_URL}/api/tutors?topic=${topic}`)
    const filteredTutors = mockTutors.filter((tutor) =>
      tutor.expertise.toLowerCase().includes(topic.toLowerCase())
    );
    setTutors(filteredTutors);
    console.log('Searching for tutors with topic:', topic, 'Found:', filteredTutors);
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-8 text-center animate-fadeIn">
          Find Tutors for Your Doubts
        </h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-10 text-center animate-fadeIn">
          Search for expert tutors by entering a topic related to your doubts. Connect with the perfect mentor to guide your learning journey.
        </p>
        <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-4 flex items-center gap-4 animate-slideUp">
          <div className="relative flex-1">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Search for a topic (e.g., React, Python)"
              className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-300"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <button
            onClick={handleFindTutor}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-md"
          >
            Find Tutor
          </button>
        </div>
        {tutors.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {tutors.map((tutor) => (
              <div
                key={tutor.id}
                className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-300 hover:scale-105"
              >
                <div className="bg-blue-100 text-blue-700 rounded-full p-3 mb-3">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-blue-800">{tutor.name}</h2>
                <p className="text-gray-600 mt-2 text-sm">{tutor.expertise}</p>
                <button
                  onClick={() => navigate(`/session/${tutor.id}`, { state: { topic } })}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-all duration-300 hover:scale-105 shadow-sm"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
        {tutors.length === 0 && topic && (
          <p className="mt-8 text-center text-gray-500 text-lg animate-fadeIn">
            No tutors found for "{topic}". Try a different topic.
          </p>
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
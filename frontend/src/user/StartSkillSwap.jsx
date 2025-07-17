import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/searchBar';
import TutorCard from './oneononeSection/TutorCard';


const StartSkillSwap = () => {
  const navigate = useNavigate();
  const [courseValue, setCourseValue] = useState("");
  const [unitValue, setUnitValue] = useState("");
  const [topicValue, setTopicValue] = useState("");
  const [tutors, setTutors] = useState([]);
  const [searched, setSearched] = useState(false);

  const handleFindTutor = () => {
    // Replace with API call in production
    const mockTutors = [
      {
        name: "Ananya Chauhan",
        profilePic: "",
        status: "Available",
        date: "2025-07-14",
        time: "5:00 PM",
        skills: [courseValue, unitValue, topicValue].filter(Boolean),
        rating: 4.9,
      },
      {
        name: "Rahul Sharma",
        profilePic: "",
        status: "Busy",
        date: "2025-07-15",
        time: "7:00 PM",
        skills: [courseValue, unitValue, topicValue].filter(Boolean),
        rating: 4.7,
      },
      {
        name: "Priya Singh",
        profilePic: "",
        status: "Available",
        date: "2025-07-16",
        time: "6:30 PM",
        skills: [courseValue, unitValue, topicValue].filter(Boolean),
        rating: 4.8,
      },
    ];
    setTutors(mockTutors);
    setSearched(true);
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
        />
        {searched && (
          <div className="mt-10 max-w-3xl mx-auto w-full flex flex-col gap-6">
            {tutors.length === 0 ? (
              <div className="text-center text-blue-700 text-lg">No tutors found for your search.</div>
            ) : (
              tutors.map((tutor, idx) => (
                <TutorCard
                  key={idx}
                  tutor={tutor}
                  onRequestSession={() => alert(`Request sent to ${tutor.name}`)}
                />
              ))
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
import React, { useEffect, useState } from 'react';
import SearchBar from '../user/oneononeSection/serachBar';
import LiveStream from './SessionsFolder/LiveStream';
import UploadedVideos from './SessionsFolder/UploadedVideos';
import { StartLiveStreamButton, UploadSessionButton } from './SessionsFolder/Buttons';
import Testimonial from "./Testimonial";

// TODO: Replace with backend API calls
// Example: fetch('/api/sessions').then(...)
const DEMO_SESSIONS = [
  {
    id: 1,
    title: 'Algebra 101',
    tutor: 'John Doe',
    course: 'Mathematics',
    unit: 'Algebra',
    topic: 'Introduction to Algebra',
    date: '2025-07-10',
    time: '10:00 AM',
    status: 'Upcoming',
  },
  {
    id: 2,
    title: 'Calculus: The Basics',
    tutor: 'Jane Smith',
    course: 'Mathematics',
    unit: 'Calculus',
    topic: 'Limits and Continuity',
    date: '2025-07-12',
    time: '2:00 PM',
    status: 'Upcoming',
  },
  {
    id: 3,
    title: 'Physics: Motion in One Dimension',
    tutor: 'Albert Einstein',
    course: 'Physics',
    unit: 'Kinematics',
    topic: 'Introduction to Motion',
    date: '2025-07-15',
    time: '1:00 PM',
    status: 'Completed',
  },
];
const DEMO_LIVE_STREAMS = [
  {
    id: 1,
    title: 'Live Algebra Q&A',
    tutor: 'John Doe',
    course: 'Mathematics',
    unit: 'Algebra',
    topic: 'Linear Equations',
    time: '10:00 AM',
    date: '2025-07-08',
    status: 'Live',
  },
];
const DEMO_UPLOADED_VIDEOS = [
  {
    id: 1,
    title: 'Algebra Basics - Recorded',
    tutor: 'John Doe',
    course: 'Mathematics',
    unit: 'Algebra',
    topic: 'Linear Equations',
    videoUrl: 'https://www.example.com/video1',
    date: '2025-07-01',
  },
];

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  // State for search bar
  const [courseValue, setCourseValue] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [topicValue, setTopicValue] = useState('');

  useEffect(() => {
    // TODO: Replace with API call in production
    // fetch('/api/sessions').then(res => res.json()).then(setSessions);
    setSessions(DEMO_SESSIONS);
  }, []);

  return (
    <div className="max-w-6xl w-full mx-auto p-4 sm:p-8">
      {/* Heading and intro */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-2">Your 1-on-1 Sessions</h1>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
          <StartLiveStreamButton />
          <UploadSessionButton />
        </div>
        <p className="text-lg text-blue-700 max-w-2xl mx-auto">
          Book, track, and review your personalized learning sessions with top tutors. Manage your upcoming and past sessions all in one place.
        </p>
      </div>
      {/* How it works*/}
      <section className="relative bg-white rounded-xl shadow p-4 flex flex-col gap-4 border border-blue-200 mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-blue-900 text-center flex items-center justify-center gap-2">
          <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" d="M8 12l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-blue-900">Search for Content</h3>
            <p className="text-xs text-gray-700 mt-1">Find live sessions or recorded videos by course, subject, or topic.</p>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="bg-blue-100 text-yellow-700 rounded-full p-2 mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <text x="12" y="16" textAnchor="middle" fontSize="10" fill="gold">G</text>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-yellow-700">Unlock with Golden Coins</h3>
            <p className="text-xs text-yellow-700 mt-1">Each live or recorded session can be unlocked for <span className="font-bold">2 Golden Coins</span> (₹4).</p>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="bg-blue-100 text-yellow-700 rounded-full p-2 mb-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <text x="12" y="16" textAnchor="middle" fontSize="10" fill="gold">₹2</text>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-yellow-700">Golden Coin Value</h3>
            <p className="text-xs text-yellow-700 mt-1">1 Golden Coin = ₹2. Unlocking a session costs ₹4.</p>
          </div>
          <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
              <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="8" />
                <path strokeLinecap="round" d="M8 12h8" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-blue-900">Access Instantly</h3>
            <p className="text-xs text-gray-700 mt-1">Once unlocked, join the live session or watch the video anytime.</p>
          </div>
        </div>
      </section>
      {/* Search Bar */}
      <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 text-center">Find a Session</h2>
      <div className="mb-10">
        <SearchBar
          courseValue={courseValue}
          setCourseValue={setCourseValue}
          unitValue={unitValue}
          setUnitValue={setUnitValue}
          topicValue={topicValue}
          setTopicValue={setTopicValue}
        />
      </div>
      {/* Live Streams Section */}
      <LiveStream liveStreams={DEMO_LIVE_STREAMS} />
      {/* Uploaded Videos Section */}
      <UploadedVideos videos={DEMO_UPLOADED_VIDEOS} />
      {/* Testimonial Section */}
      <Testimonial />
      {/* Your Sessions list */}
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Your Sessions</h2>
      {sessions.length === 0 ? (
        <div className="text-gray-500">No sessions found.</div>
      ) : (
        <div className="space-y-6">
          {sessions.map(session => (
            <div key={session.id} className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-blue-100 w-full">
              <div>
                <div className="text-lg font-semibold text-blue-800">{session.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Course:</span> {session.course} &nbsp;|
                  <span className="font-medium ml-2">Unit:</span> {session.unit} &nbsp;|
                  <span className="font-medium ml-2">Topic:</span> {session.topic}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Tutor:</span> {session.tutor}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Date:</span> {session.date} &nbsp;|
                  <span className="font-medium ml-2">Time:</span> {session.time}
                </div>
              </div>
              <div className="mt-4 md:mt-0 md:text-right">
                <span className={`inline-block px-4 py-1 rounded-full text-xs font-semibold ${session.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{session.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sessions;

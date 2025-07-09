import React, { useEffect, useState } from 'react';
import SearchBar from '../user/oneononeSection/serachBar';
import LiveStream from './SessionsFolder/LiveStream';
import UploadedVideos from './SessionsFolder/UploadedVideos';
import { StartLiveStreamButton, UploadSessionButton } from './SessionsFolder/Buttons';
import Testimonial from "./Testimonial";

// TODO: Replace with backend API calls
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
  const [courseValue, setCourseValue] = useState('');
  const [unitValue, setUnitValue] = useState('');
  const [topicValue, setTopicValue] = useState('');

  useEffect(() => {
    setSessions(DEMO_SESSIONS);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: Text Content */}
          <div className="animate-fade-in-left space-y-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-blue-900 leading-tight tracking-tight">
              Learn Smarter with SkillSwap Hub
            </h1>
            <p className="text-lg text-blue-600 leading-relaxed max-w-md">
              Unlock personalized 1-on-1 sessions, live streams, and recorded videos with top tutors to master your subjects effortlessly.
            </p>
            <div className="flex gap-4">
              <StartLiveStreamButton className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 transition-all duration-300 transform hover:scale-105" />
              <UploadSessionButton className="px-6 py-3 bg-gradient-to-r from-blue-200 to-blue-400 text-blue-900 font-semibold rounded-full hover:bg-gradient-to-r hover:from-blue-300 hover:to-blue-500 transition-all duration-300 transform hover:scale-105" />
            </div>
          </div>
          {/* Right: Image */}
          <img
            src="/assets/session.webp" // Replace with your image source
            alt="Learning Illustration"
            className="w-full h-64 md:h-96 object-cover rounded-2xl animate-fade-in-right"
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 text-center mb-10 animate-fade-in">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Discover Sessions',
              description: 'Explore live or recorded sessions by course, unit, or topic with our intuitive search.',
              icon: (
                <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              ),
            },
            {
              title: 'Unlock with Coins',
              description: 'Access any session for just <span class="font-bold">2 Golden Coins</span> (₹4).',
              icon: (
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">G</text>
                </svg>
              ),
            },
            {
              title: 'Coin Value',
              description: 'Each Golden Coin equals ₹2, making learning affordable and accessible.',
              icon: (
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <text x="12" y="16" textAnchor="middle" fontSize="12" fill="currentColor">₹2</text>
                </svg>
              ),
            },
            {
              title: 'Instant Learning',
              description: 'Join live sessions or watch videos instantly after unlocking.',
              icon: (
                <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
          ].map((item, index) => (
            <div
              key={index}
              className="relative p-6 bg-white bg-opacity-20 backdrop-blur-lg rounded-xl border border-blue-100 hover:bg-opacity-30 transition-all duration-500 transform hover:-translate-y-2 hover:scale-105"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-30 rounded-xl"></div>
              <div className="relative flex flex-col items-center text-center">
                <div className="p-3 bg-blue-50 bg-opacity-50 rounded-full mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-blue-900">{item.title}</h3>
                <p className="text-sm text-blue-600 mt-2" dangerouslySetInnerHTML={{ __html: item.description }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 text-center mb-8">Find Your Perfect Session</h2>
        <div className="max-w-3xl mx-auto bg-white bg-opacity-20 backdrop-blur-lg p-6 rounded-2xl border border-blue-100">
          <SearchBar
            courseValue={courseValue}
            setCourseValue={setCourseValue}
            unitValue={unitValue}
            setUnitValue={setUnitValue}
            topicValue={topicValue}
            setTopicValue={setTopicValue}
            className="w-full"
          />
        </div>
      </section>

      {/* Tabbed Content Section */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-center gap-4 mb-10 flex-wrap">
          {['Live Streams', 'Uploaded Videos', 'Testimonials'].map((tab, index) => (
            <button
              key={index}
              className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="space-y-12">
          <LiveStream liveStreams={DEMO_LIVE_STREAMS} className="animate-slide-up" />
          <UploadedVideos videos={DEMO_UPLOADED_VIDEOS} className="animate-slide-up" />
          <Testimonial className="animate-slide-up" />
        </div>
      </section>

      {/* Your Sessions Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-8">Your Sessions</h2>
        {sessions.length === 0 ? (
          <div className="text-blue-600 text-center py-12 bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl border border-blue-100">
            No sessions found. Search and book a session to get started!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 border border-blue-100 hover:bg-opacity-30 transition-all duration-500 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-lg font-semibold text-blue-900 mb-3">{session.title}</h3>
                <div className="text-sm text-blue-600 space-y-2">
                  <p>
                    <span className="font-medium">Course:</span> {session.course} |{' '}
                    <span className="font-medium">Unit:</span> {session.unit} |{' '}
                    <span className="font-medium">Topic:</span> {session.topic}
                  </p>
                  <p>
                    <span className="font-medium">Tutor:</span> {session.tutor}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {session.date} |{' '}
                    <span className="font-medium">Time:</span> {session.time}
                  </p>
                </div>
                <div className="mt-4">
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      session.status === 'Completed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-blue-200 text-blue-800'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Sessions;
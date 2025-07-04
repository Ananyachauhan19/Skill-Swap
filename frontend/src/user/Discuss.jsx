import React from 'react';
import GDListSection from './discussSection/GDListSection';
import PastGDSection from './discussSection/PastGDSection';
import FAQSection from './discussSection/FAQSection';
import GDTestimonialSection from './discussSection/GDTestimonialSection';

const HowItWorks = () => (
  <section className="relative bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-8 border border-blue-200 mb-12">
    <h2 className="text-2xl sm:text-3xl font-bold text-blue-900 text-center flex items-center justify-center gap-3">
      <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a1.994 1.994 0 01-1.414.586z" />
      </svg>
      How It Works
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">Register & Book Session</h3>
        <p className="text-sm text-gray-700 mt-2">Sign up and select from trending or placement-focused GD topics.</p>
      </div>
      <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a1.994 1.994 0 01-1.414.586z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">Join Live Session</h3>
        <p className="text-sm text-gray-700 mt-2">Participate in a real-time, expert-moderated group discussion.</p>
      </div>
      <div className="flex flex-col items-center text-center p-6 bg-blue-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-900">Get Feedback & Improve</h3>
        <p className="text-sm text-gray-700 mt-2">Receive actionable feedback and ratings to boost your skills.</p>
      </div>
    </div>
  </section>
);

const Discuss = () => (
  <div className="min-h-screen w-full bg-blue-50 relative overflow-x-hidden">
    <header className="w-full max-w-7xl mx-auto text-center py-16 sm:py-24 px-4 sm:px-6 relative">
      <div className="absolute inset-0 bg-blue-100 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%231e40af' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v4h2v-4h4V2h-4V0h-2v2h-4v2h4zM6 34v4h4v-4h2v-4h-2v-4H6v4H2v2h4zm0-30v4h-4v2h4v4h2V6h4V4H6V0H4v4H0v2h4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }} />
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 animate-fadeIn">
        <div className="flex-1 text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-4 leading-tight">
            Engage in Dynamic Group Discussions
          </h1>
          <p className="text-lg sm:text-xl text-gray-700 max-w-xl mb-6">
            Collaborate with peers, debate trending topics, and gain confidence with expert-moderated sessions.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105">
            Join a Discussion
          </button>
        </div>
        <div className="flex-1 hidden md:block">
          <picture>
            <source srcSet="/assets/group-discussion-illustration.webp" type="image/webp" />
            <img
              src="/assets/group-discussion-illustration.webp"
              alt="Group Discussion Illustration"
              className="w-full max-w-md mx-auto object-contain"
            />
          </picture>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
          Live Expert Moderation
        </span>
        <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
          Placement Focused
        </span>
        <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
          Collaborative Growth
        </span>
      </div>
    </header>
    <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-16 px-4 sm:px-6 pb-12">
      <HowItWorks />
      <GDListSection />
      <PastGDSection />
      <FAQSection />
      <GDTestimonialSection />
    </main>
  </div>
);

export default Discuss;
import React from 'react';
import InterviewListSection from './interviewSection/InterviewListSection';
import PastInterviewSection from './interviewSection/PastInterviewSection';
import FAQSection from './interviewSection/FAQ';
import InterviewTestimonialSection from './interviewSection/InterviewTestimonialSection';

const AnimatedHeaderBG = () => (
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 1440 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ zIndex: 0 }}
  >
    <defs>
      <linearGradient id="waveGradientInterview" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e40af" stopOpacity="0.13" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.07" />
      </linearGradient>
    </defs>
    <path
      fill="url(#waveGradientInterview)"
      d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
    />
  </svg>
);

const HowItWorks = () => (
  <section className="relative bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col gap-6 border border-blue-100 mb-8">
    <h2 className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="inline-block text-blue-500"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      How It Works
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="flex flex-col items-center text-center">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-2 animate-bounce">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <span className="font-semibold text-blue-800">Book a Mock Interview</span>
        <p className="text-sm text-blue-700 mt-1">Choose your domain and schedule a session with an expert interviewer.</p>
      </div>
      <div className="flex flex-col items-center text-center">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-2 animate-pulse">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="8" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <span className="font-semibold text-blue-800">Attend & Get Evaluated</span>
        <p className="text-sm text-blue-700 mt-1">Participate in a real-time interview and receive live feedback.</p>
      </div>
      <div className="flex flex-col items-center text-center">
        <div className="bg-blue-100 text-blue-700 rounded-full p-4 mb-2 animate-bounce">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg>
        </div>
        <span className="font-semibold text-blue-800">Review & Improve</span>
        <p className="text-sm text-blue-700 mt-1">Get a detailed evaluation and actionable tips to ace your next interview.</p>
      </div>
    </div>
  </section>
);

const Interview = () => (
  <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-x-hidden">
    <header className="w-full max-w-7xl mx-auto text-center py-16 px-4 relative overflow-hidden">
      <AnimatedHeaderBG />
      <div className="relative z-10">
        <h1 className="text-4xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-500 mb-4 drop-shadow-lg">
          Ace Your Interviews with Expert-Led Mock Sessions
        </h1>
        <p className="text-xl sm:text-2xl text-blue-700 font-medium max-w-2xl mx-auto mb-2">
          Practice real-time interviews with industry professionals, receive personalized feedback, and boost your confidence before the big day.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold shadow-sm text-sm transition-transform hover:scale-105 hover:bg-blue-200">Expert Interviewers</span>
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold shadow-sm text-sm transition-transform hover:scale-105 hover:bg-blue-200">Personalized Feedback</span>
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold shadow-sm text-sm transition-transform hover:scale-105 hover:bg-blue-200">Placement Ready</span>
        </div>
      </div>
    </header>
    <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-16 px-4 pb-12">
      <HowItWorks />
      <InterviewListSection />
      <PastInterviewSection />
      <FAQSection />
      <InterviewTestimonialSection />
    </main>
  </div>
);

export default Interview;

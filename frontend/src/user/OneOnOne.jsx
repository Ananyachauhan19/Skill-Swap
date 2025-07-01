import React, { useState } from 'react';
import SearchBar from './oneononeSection/serachBar';
import TestimonialSection from './oneononeSection/TestimonialSection';

const AnimatedHeaderBG = () => (
  <svg
    className="absolute inset-0 w-full h-full"
    viewBox="0 0 1440 320"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ zIndex: 0 }}
  >
    <defs>
      <linearGradient id="waveGradientOneOnOne" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.13" />
        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.07" />
      </linearGradient>
    </defs>
    <path
      fill="url(#waveGradientOneOnOne)"
      d="M0,160L60,170.7C120,181,240,203,360,197.3C480,192,600,160,720,133.3C840,107,960,85,1080,101.3C1200,117,1320,171,1380,197.3L1440,224L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
    />
  </svg>
);

const OneOnOne = () => {
  const [course, setCourse] = useState('');
  const [unit, setUnit] = useState('');
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-x-hidden flex flex-col">
      <header className="w-full max-w-7xl mx-auto text-center py-16 px-4 relative overflow-hidden">
        <AnimatedHeaderBG />
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-500 mb-4 drop-shadow-lg">
            1-on-1 Expert Connect
          </h2>
          <p className="text-xl sm:text-2xl text-blue-700 font-medium max-w-2xl mx-auto mb-2">
            Instantly connect with subject experts for personalized, real-time help. Get your doubts solved, learn new concepts, and accelerate your growth.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold shadow-sm text-sm transition-transform hover:scale-105 hover:bg-blue-200">Instant Doubt Solving</span>
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold shadow-sm text-sm transition-transform hover:scale-105 hover:bg-blue-200">Personalized Guidance</span>
            <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold shadow-sm text-sm transition-transform hover:scale-105 hover:bg-blue-200">Flexible Scheduling</span>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-12 px-4 pb-12">
        <div className="pt-2" />
        <SearchBar
          courseValue={course}
          setCourseValue={setCourse}
          unitValue={unit}
          setUnitValue={setUnit}
        />
        <TestimonialSection />
      </main>
    </div>
  );
};

export default OneOnOne;
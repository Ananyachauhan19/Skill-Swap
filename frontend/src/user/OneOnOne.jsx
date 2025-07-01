import React, { useState } from 'react';
import SearchBar from './oneononeSection/serachBar';

const OneOnOne = () => {
  const [course, setCourse] = useState('');
  const [unit, setUnit] = useState('');
  return (
    <div className="min-h-screen flex flex-col bg-blue-50">
      <header className="w-full flex justify-center pt-8 pb-2 bg-blue-50">
        <h2 className="text-4xl font-bold text-blue-800">1-on-1 Expert Connect</h2>
      </header>
      <SearchBar
        courseValue={course}
        setCourseValue={setCourse}
        unitValue={unit}
        setUnitValue={setUnit}
      />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-4">1-on-1 Live Session</h1>
          <p className="text-lg text-gray-700">Connect with an expert for a personalized, real-time learning experience. Coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default OneOnOne;
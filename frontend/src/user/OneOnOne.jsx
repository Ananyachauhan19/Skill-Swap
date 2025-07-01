import React, { useState } from 'react';
import SearchBar from './oneononeSection/serachBar';
import TestimonialSection from './oneononeSection/TestimonialSection';

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
      <TestimonialSection />
      
    </div>
  );
};

export default OneOnOne;
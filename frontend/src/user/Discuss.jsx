import React from 'react';
import GDListSection from './discussSection/GDListSection';
import PastGDSection from './discussSection/PastGDSection';
import FAQSection from './discussSection/FAQSection';
import GDTestimonialSection from './discussSection/GDTestimonialSection';

const Discuss = () => (
  <div className="min-h-screen flex flex-col bg-blue-50">
    <div className="w-full max-w-3xl mx-auto text-center py-10">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Join High-Impact Group Discussions Curated by Experts</h1>
      <p className="text-lg text-blue-700">Practice structured communication, debate current topics, and build the confidence you need for placements and beyond.</p>
    </div>
    <GDListSection />
    <PastGDSection />
    <FAQSection />
    <GDTestimonialSection />
  </div>
);

export default Discuss;

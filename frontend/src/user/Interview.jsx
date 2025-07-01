import React from 'react';
import InterviewListSection from './interviewSection/InterviewListSection';
import PastInterviewSection from './interviewSection/PastInterviewSection';
import FAQSection from './interviewSection/FAQ';
import InterviewTestimonialSection from './interviewSection/InterviewTestimonialSection';

const Interview = () => (
  <div className="min-h-screen flex flex-col items-center bg-blue-50">
    <div className="w-full max-w-3xl mx-auto text-center py-10">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Ace Your Interviews with Expert-Led Mock Sessions</h1>
      <p className="text-lg text-blue-700">Practice real-time interviews with industry professionals, receive personalized feedback, and boost your confidence before the big day.</p>
    </div>
    <InterviewListSection />
    <PastInterviewSection />
    <div className="w-full max-w-3xl mt-10">
      <FAQSection />
    </div>
    <InterviewTestimonialSection />
  </div>
);

export default Interview;

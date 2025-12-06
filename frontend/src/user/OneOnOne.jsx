import React, { useState, useEffect, useRef } from 'react';
import { BACKEND_URL } from '../config.js';
import SearchBar from './oneononeSection/serachBar';
import TutorCard from './oneononeSection/TutorCard';
import Testimonial from "./Testimonial";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import Blog from '../user/company/Blog'; 
import { useNavigate, useLocation } from 'react-router-dom';
import StartSkillSwapSearchForm from './oneononeSection/StartSkillSwapSearchForm';

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Share Your Doubt",
      description: "Enter your class, subject, and topic. Add your specific question or upload a photo of the problem you need help with.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      number: "02",
      title: "Get Matched Instantly",
      description: "Our system finds available expert tutors who specialize in your topic. Browse their profiles, ratings, and availability.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      number: "03",
      title: "Start Live Session",
      description: "Connect with your chosen tutor through live video chat. Get personalized explanations and clear your doubts in real-time.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: "04",
      title: "Pay As You Learn",
      description: "Affordable and flexible pricing at ₹0.25 per minute. Use only the time you need, a 40 minute session comes to 10 coins.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-12 border border-slate-200/50 shadow-sm">
      <div className="mb-6 sm:mb-12 text-center">
        <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 sm:mb-3 tracking-tight">
          Your Learning Journey in 4 Simple Steps
        </h2>
        <p className="text-slate-500 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed px-2">
          From doubt to clarity in minutes. Here's how our one-on-one learning platform works
        </p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-900/20 via-blue-900/40 to-blue-900/20" style={{ top: '4rem' }}></div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Card */}
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 border border-slate-200/50 hover:border-blue-900/30 transition-all hover:shadow-lg group">
                {/* Number Badge */}
                <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 w-8 h-8 sm:w-12 sm:h-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {step.number}
                </div>
                
                {/* Icon */}
                <div className="mb-2 sm:mb-4 mt-1 sm:mt-2 flex justify-center">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-blue-900/10 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-blue-900/20 transition-colors">
                    <div className="scale-75 sm:scale-100">{step.icon}</div>
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-xs sm:text-base lg:text-lg font-bold text-slate-900 mb-1 sm:mb-3 text-center tracking-tight leading-tight">
                  {step.title}
                </h3>
                <p className="text-[10px] sm:text-sm text-slate-600 leading-relaxed text-center hidden sm:block">
                  {step.description}
                </p>
              </div>

              {/* Arrow for larger screens */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 -right-4 z-10">
                  <svg className="w-8 h-8 text-blue-900/30" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-6 sm:mt-12 text-center bg-blue-900/5 rounded-lg sm:rounded-xl p-4 sm:p-6 border border-blue-900/10">
        <p className="text-slate-900 font-semibold text-sm sm:text-base mb-1 sm:mb-2">Ready to start learning?</p>
        <p className="text-slate-600 text-xs sm:text-sm">Fill in the form above to find your perfect tutor and begin your personalized learning session today!</p>
      </div>
    </section>
  );
};

const OneOnOne = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-home-bg">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] w-full flex items-center justify-center overflow-hidden pt-16 sm:pt-20 pb-6 sm:pb-8 bg-gradient-to-b from-slate-50 to-white">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-900/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-900/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left space-y-4 sm:space-y-6">
              <div className="inline-block">
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-900/10 text-blue-900 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide">
                  One-on-One Learning Platform
                </span>
              </div>
              
              <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight tracking-tight px-2 sm:px-0">
                Connect with Experts for
                <span className="block text-blue-900 mt-1 sm:mt-2">
                  Personalized Learning
                </span>
              </h1>
              
              <p className="text-sm sm:text-base lg:text-lg text-slate-500 max-w-2xl mx-auto lg:mx-0 px-4 sm:px-0">
                Instantly connect with subject experts, get your doubts solved in real-time, and accelerate your learning journey.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 sm:pt-4 px-4 sm:px-0">
                <button
                  onClick={() => window.location.href = '/createSession'}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-blue-900 text-white rounded-xl font-semibold text-sm sm:text-base hover:bg-blue-800 transition-all hover:shadow-xl"
                >
                  Create a Session
                </button>
                <button
                  onClick={() => navigate('/startskillswap')}
                  className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-white text-blue-900 border-2 border-blue-900 rounded-xl font-semibold text-sm sm:text-base hover:bg-blue-50 transition-all"
                >
                  Find Expert Session
                </button>
              </div>
            </div>

            {/* Right Illustration */}
<div className="flex-1 relative hidden lg:block">
  <div className="relative w-full max-w-[480px] mx-auto scale-110">
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 to-blue-900/5 rounded-3xl blur-2xl"></div>
    <img
      src="/assets/expert-connect-illustration.webp"
      alt="Expert Connect"
      className="relative w-full h-auto object-contain drop-shadow-2xl"
    />
  </div>
</div>
 </div>
</div>


        {/* Scroll Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400">
       
          
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12 lg:gap-16 px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-16">
        {/* Start SkillSwap Search Section */}
        <section className="bg-gradient-to-br from-white via-blue-50/20 to-slate-50/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 lg:p-12 border border-slate-200/50 shadow-sm">
          <div className="mb-6 sm:mb-10">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold text-slate-900 text-center mb-2 sm:mb-3 tracking-tight">
              Find Your Perfect Tutor Instantly
            </h2>
            <p className="text-center text-slate-500 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed px-2">
              Connect with experts for personalized one-on-one learning. Enter your class, subject, and topic to get matched with the right tutor who can clear your doubts in real-time.
            </p>
          </div>

          <StartSkillSwapSearchForm />
        </section>

        {/* How It Works */}
        <HowItWorks />

        {/* Top Performers */}
        <TopPerformersSection />
      </main>
    </div>
  );
};

export default OneOnOne;
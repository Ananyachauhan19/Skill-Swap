import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Users, Video, TrendingUp } from 'lucide-react';
import CampusStartSkillSwapSearchForm from './CampusStartSkillSwapSearchForm';

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Select Your Topic",
      description: "Choose your class, subject, and topic from your institute's curriculum. Add your specific question or upload a photo.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      number: "02",
      title: "Find Campus Tutors",
      description: "Browse tutors from your institute who are online and available. View their profiles, ratings, and expertise.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    {
      number: "03",
      title: "Connect & Learn",
      description: "Start a live video session with your chosen campus tutor. Get personalized explanations from someone who understands your curriculum.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: "04",
      title: "Campus Rewards",
      description: "Earn campus coins for every session. Flexible pricing at ₹0.25 per minute. Build your learning network within your institute.",
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
          Campus Learning in 4 Simple Steps
        </h2>
        <p className="text-slate-500 text-xs sm:text-base max-w-2xl mx-auto leading-relaxed px-2">
          Connect with tutors from your institute for personalized one-on-one learning
        </p>
      </div>

      <div className="relative">
        {/* Connection Line */}
        <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-900/20 via-blue-900/40 to-blue-900/20" style={{ top: '4rem' }}></div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 border border-slate-200/50 hover:border-blue-900/30 transition-all hover:shadow-lg group">
                <div className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 w-8 h-8 sm:w-12 sm:h-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {step.number}
                </div>
                
                <div className="mb-2 sm:mb-4 mt-1 sm:mt-2 flex justify-center">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-blue-900/10 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:bg-blue-900/20 transition-colors">
                    <div className="scale-75 sm:scale-100">{step.icon}</div>
                  </div>
                </div>
                
                <h3 className="text-xs sm:text-base lg:text-lg font-bold text-slate-900 mb-1 sm:mb-3 text-center tracking-tight leading-tight">
                  {step.title}
                </h3>
                <p className="text-[10px] sm:text-sm text-slate-600 leading-relaxed text-center hidden sm:block">
                  {step.description}
                </p>
              </div>

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
    </section>
  );
};

const CampusOneOnOne = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user doesn't have institute info
  useEffect(() => {
    if (!user?.instituteId) {
      navigate('/campus-dashboard');
    }
  }, [user, navigate]);

  if (!user?.instituteId) {
    return (
      <div className="min-h-screen bg-home-bg flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Restricted</h2>
          <p className="text-gray-600 mb-6">You need to join a campus to access this feature.</p>
          <button
            onClick={() => navigate('/campus-dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Campus Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-home-bg text-gray-900 font-[Inter,Poppins,sans-serif] pt-16 md:pt-[72px] xl:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 backdrop-blur-sm px-4 py-1.5 shadow-sm mb-4">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-900 tracking-wide uppercase">
              Campus One-on-One
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Learn from Your <span className="text-blue-700">Campus Tutors</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Connect with expert tutors from your institute for personalized one-on-one learning sessions. 
            Get help tailored to your curriculum and build your campus learning network.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Live Sessions</p>
                <p className="text-2xl font-bold text-slate-900">24/7</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Campus Tutors</p>
                <p className="text-2xl font-bold text-slate-900">Available</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-slate-200/50 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Success Rate</p>
                <p className="text-2xl font-bold text-slate-900">95%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="mb-12">
          <CampusStartSkillSwapSearchForm />
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <HowItWorks />
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 text-center">
            Why Choose Campus One-on-One?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Curriculum-Aligned</h3>
                <p className="text-sm text-slate-600">Tutors understand your institute's syllabus and teaching methods</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Peer Learning</h3>
                <p className="text-sm text-slate-600">Learn from seniors and peers who excel in specific subjects</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Instant Connection</h3>
                <p className="text-sm text-slate-600">Connect instantly with available tutors from your campus</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Campus Rewards</h3>
                <p className="text-sm text-slate-600">Earn and spend coins within your institute ecosystem</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CampusOneOnOne;

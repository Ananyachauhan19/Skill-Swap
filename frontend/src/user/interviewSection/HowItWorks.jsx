import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Book Interview",
      description: "Choose your domain and schedule with an expert interviewer who understands your target role.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: "02",
      title: "Live Session",
      description: "Attend a real-time mock interview and get actionable feedback in a professional setting.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      number: "03",
      title: "Get Evaluated",
      description: "Receive detailed feedback and improvement suggestions to enhance your interview skills.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      number: "04",
      title: "Affordable Pricing",
      description: "Quality interview preparation at just ₹500 per session. Invest in your career success.",
      icon: (
        <svg className="w-8 h-8 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-6 lg:p-10 xl:p-12 border border-slate-200/50 shadow-sm max-w-7xl mx-auto">
      <div className="mb-4 sm:mb-8 lg:mb-12 text-center">
        <h2 className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-1 sm:mb-2 lg:mb-3 tracking-tight">
          Your Interview Preparation in 4 Simple Steps
        </h2>
        <p className="text-slate-500 text-[10px] sm:text-xs lg:text-sm xl:text-base max-w-2xl mx-auto leading-relaxed px-1 sm:px-2">
          From booking to feedback - get ready for your dream job with our expert-led mock interviews
        </p>
      </div>

      <div className="relative">
        <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-900/20 via-blue-900/40 to-blue-900/20" style={{ top: '4rem' }}></div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 xl:gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-md sm:rounded-lg lg:rounded-xl p-2 sm:p-3 lg:p-6 border border-slate-200/50 hover:border-blue-900/30 transition-all hover:shadow-lg group">
                <div className="absolute -top-1.5 -left-1.5 sm:-top-2 sm:-left-2 lg:-top-4 lg:-left-4 w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-blue-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] sm:text-xs lg:text-lg shadow-lg group-hover:scale-110 transition-transform">
                  {step.number}
                </div>
                
                <div className="mb-1 sm:mb-2 lg:mb-4 mt-0.5 sm:mt-1 lg:mt-2 flex justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-16 lg:h-16 bg-blue-900/10 rounded-lg sm:rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-blue-900/20 transition-colors">
                    <div className="scale-50 sm:scale-75 lg:scale-100">{step.icon}</div>
                  </div>
                </div>
                
                <h3 className="text-[10px] sm:text-xs lg:text-base xl:text-lg font-bold text-slate-900 mb-0.5 sm:mb-1 lg:mb-3 text-center tracking-tight leading-tight">
                  {step.title}
                </h3>
                <p className="text-[8px] sm:text-[10px] lg:text-sm text-slate-600 leading-relaxed text-center hidden sm:block">
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

      <div className="mt-4 sm:mt-8 lg:mt-12 text-center bg-blue-900/5 rounded-md sm:rounded-lg lg:rounded-xl p-3 sm:p-4 lg:p-6 border border-blue-900/10">
        <p className="text-slate-900 font-semibold text-xs sm:text-sm lg:text-base mb-0.5 sm:mb-1 lg:mb-2">Ready to ace your interview?</p>
        <p className="text-slate-600 text-[10px] sm:text-xs lg:text-sm">Book your mock interview session and get expert guidance to land your dream job!</p>
      </div>
    </section>
  );
};

export default HowItWorks;

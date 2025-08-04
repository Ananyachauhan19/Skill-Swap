import React from 'react';
import PastGDSection from './discussSection/PastGDSection';
import FAQSection from './discussSection/FAQSection';
import InterviewSearchBox from './interviewSection/InterviewSearchBox';
import PastGDExpertSection from './discussSection/PastGDExpertSection';
import TopPerformersSection from "./HomeSection/TopPerformersSection";

const HowItWorks = () => (
  <section className="relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-4 sm:p-8 flex flex-col gap-6 border border-blue-200 mb-8 animate-slideUp">
    <h2 className="text-xl sm:text-3xl font-extrabold text-blue-900 text-center flex items-center justify-center gap-2">
      <svg
        className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a1.994 1.994 0 01-1.414.586z" />
      </svg>
      How It Works
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {[
        {
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          ),
          title: "Register & Book Session",
          desc: "Sign up and select from trending or placement-focused GD topics."
        },
        {
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a1.994 1.994 0 01-1.414.586z" />
          ),
          title: "Join Live Session",
          desc: "Participate in a real-time, expert-moderated group discussion."
        },
        {
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          ),
          title: "Get Feedback & Improve",
          desc: "Receive actionable feedback and ratings to boost your skills."
        },
        {
          icon: (
            <g>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </g>
          ),
          title: "Session Fee & Payment",
          desc: "Each session costs ₹1500 per head, payable online via secure transaction."
        }
      ].map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-blue-50 border border-blue-100 cursor-pointer aspect-square sm:aspect-auto"
        >
          <div className={`bg-blue-600 text-white rounded-full p-3 mb-3 ${item.title === "Session Fee & Payment" ? "bg-green-600" : ""}`}>
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              {item.icon}
            </svg>
          </div>
          <h3 className="text-sm sm:text-xl font-semibold text-blue-900">{item.title}</h3>
          <p className="text-xs sm:text-base text-gray-600 mt-2 whitespace-pre-line">{item.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

const Discuss = () => {
  const gdListRef = React.useRef(null);

  const handleJoinClick = () => {
    if (gdListRef.current) {
      gdListRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 transition-all duration-2000 pt-16 sm:pt-20 relative overflow-x-hidden">
      <header className="w-full max-w-7xl mx-auto text-center py-6 sm:py-10 px-4 sm:px-6 relative animate-slideUp">
        <div className="absolute inset-0 bg-blue-100 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%231e40af' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v4h2v-4h4V2h-4V0h-2v2h-4v2h4zM6 34v4h4v-4h2v-4h-2v-4H6v4H2v2h4zm0-30v4h-4v2h4v4h2V6h4V4H6V0H4v4H0v2h4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }} />
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex-1 text-left">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Engage in Dynamic Group Discussions
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-700 max-w-xl mb-6">
              Collaborate with peers, debate trending topics, and gain confidence with expert-moderated sessions.
            </p>
            <button
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
              onClick={handleJoinClick}
            >
              Join a Discussion
            </button>
          </div>
          <div className="flex-1 mt-6 md:mt-0">
            <picture>
              <source srcSet="/assets/group-discussion-illustration.webp" type="image/webp" />
              <img
                src="/assets/group-discussion-illustration.webp"
                alt="Group Discussion Illustration"
                className="w-full max-w-xs sm:max-w-md mx-auto object-contain"
              />
            </picture>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-6 sm:mt-8">
          {[
            "Live Expert Moderation",
            "Placement Focused",
            "Collaborative Growth"
          ].map((text, index) => (
            <span
              key={index}
              className="inline-block bg-blue-100 text-blue-800 px-3 sm:px-4 py-2 rounded-full font-semibold text-xs sm:text-sm shadow-sm transition-transform duration-300 hover:scale-105 hover:bg-blue-200"
            >
              {text}
            </span>
          ))}
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12 px-4 sm:px-6 pb-12">
        <HowItWorks />
        <h2 className="text-lg sm:text-2xl font-bold text-blue-900 mb-2 text-center animate-slideUp">
          Find Upcoming Group Discussions
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center">
          Start typing a job, course, branch, or session title.
        </p>
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-3xl">
            <InterviewSearchBox />
          </div>
        </div>
        <div ref={gdListRef}>
          <PastGDExpertSection />
        </div>
        <PastGDSection />
        <FAQSection />
        <TopPerformersSection />
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }
        /* Ensure content starts below navbar */
        .min-h-screen {
          padding-top: 4rem; /* Adjust based on navbar height */
        }
        @media (min-width: 640px) {
          .min-h-screen {
            padding-top: 5rem;
          }
        }
        /* Square cards for mobile */
        @media (max-width: 639px) {
          .grid-cols-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
          .aspect-square {
            aspect-ratio: 1 / 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 0.75rem;
          }
          .aspect-square p {
            font-size: 0.65rem;
            line-height: 1.2;
          }
          .aspect-square h3 {
            font-size: 0.9rem;
          }
          .aspect-square svg {
            width: 1.25rem;
            height: 1.25rem;
          }
          .aspect-square > div {
            padding: 0.5rem;
            margin-bottom: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Discuss;
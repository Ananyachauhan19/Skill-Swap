/* eslint-disable no-unused-vars */
import React from "react";
import InterviewListSection from "./interviewSection/InterviewListSection";
import PastInterviewSection from "./interviewSection/PastInterviewSection";
import FAQSection from "./interviewSection/FAQ";
import InterviewSearchBox from "./interviewSection/InterviewSearchBox";
import TopPerformersSection from "./HomeSection/TopPerformersSection";

const HowItWorks = () => (
  <section className="relative bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col gap-6 border border-blue-200 mb-8 animate-slideUp w-full max-w-7xl mx-auto box-border">
    <h2 className="text-xl sm:text-3xl font-extrabold text-blue-900 text-center flex items-center justify-center gap-2 sm:gap-3">
      <svg
        className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      How It Works
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[
        {
          icon: (
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M8 12l2 2 4-4" />
            </svg>
          ),
          title: "Book a Mock Interview",
          desc: "Select domain and schedule with an expert."
        },
        {
          icon: (
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="16" height="16" rx="8" />
              <path strokeLinecap="round" d="M8 12h8" />
            </svg>
          ),
          title: "Attend & Get Evaluated",
          desc: "Join mock interview and get live feedback."
        },
        {
          icon: (
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          ),
          title: "Review & Improve",
          desc: "Get detailed feedback to excel in interviews."
        },
        {
          icon: (
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          ),
          title: "Session Fee",
          desc: "₹500 per session, payable online."
        }
      ].map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center justify-between text-center p-3 sm:p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-blue-50 border border-blue-100 cursor-pointer aspect-square"
        >
          <div className="bg-blue-600 text-white rounded-full p-2 sm:p-3 mb-2 sm:mb-3 transform transition-transform duration-300">
            {item.icon}
          </div>
          <h3 className="text-sm sm:text-lg font-semibold text-blue-900 leading-tight">{item.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 whitespace-pre-line line-clamp-3">{item.desc}</p>
        </div>
      ))}
    </div>
  </section>
);

// Sample performers data
const performers = [
  {
    title: "Top Scorer",
    name: "John Doe",
    img: "/assets/john-doe.webp",
    imgFallback: "/assets/john-doe.jpg",
    alt: "John Doe",
    stat: "Aced 5 mock interviews",
    extra: <p className="text-sm text-blue-600 mt-2">Placed at Google</p>,
  },
  {
    title: "Best Communicator",
    name: "Jane Smith",
    img: "/assets/jane-smith.webp",
    imgFallback: "/assets/jane-smith.jpg",
    alt: "Jane Smith",
    stat: "95% feedback score",
    extra: <p className="text-sm text-blue-600 mt-2">Placed at Microsoft</p>,
  },
  {
    title: "Most Improved",
    name: "Alex Johnson",
    img: "/assets/alex-johnson.webp",
    imgFallback: "/assets/alex-johnson.jpg",
    alt: "Alex Johnson",
    stat: "Improved score by 40%",
    extra: <p className="text-sm text-blue-600 mt-2">Placed at Amazon</p>,
  },
];

const Interview = () => {
  // Ref for InterviewListSection
  const interviewListRef = React.useRef(null);

  // --- Search State ---
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredInterviews, setFilteredInterviews] = React.useState(null);
  const [selectedJob, setSelectedJob] = React.useState("");
  const [selectedCourse, setSelectedCourse] = React.useState("");

  // --- Handler for search ---
  const handleSearch = () => {
    setFilteredInterviews({
      keyword: searchTerm.trim(),
      job: selectedJob,
      course: selectedCourse,
    });
    if (interviewListRef.current) {
      interviewListRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // --- Handler for Book a Mock Interview button ---
  const handleBookClick = () => {
    if (interviewListRef.current) {
      interviewListRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen w-full bg-blue-50 transition-all duration-2000 pt-16 sm:pt-20">
      <header className="w-full max-w-7xl mx-auto text-center py-6 sm:py-10 px-4 sm:px-6 relative animate-slideUp">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex-1 text-left">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Master Your Interviews with Expert Guidance
            </h1>
            <p className="text-sm sm:text-lg md:text-xl text-gray-700 max-w-xl mb-6">
              Practice with industry professionals, get personalized feedback, and build confidence to ace your next interview.
            </p>
            <button
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
              onClick={handleBookClick}
            >
              Book a Mock Interview
            </button>
          </div>
          <div className="flex-1 mt-6 md:mt-0">
            <img
              src="/assets/interview-illustration.webp"
              alt="Mock Interview Illustration"
              className="w-full max-w-xs sm:max-w-md mx-auto object-contain"
            />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8 sm:gap-12 px-4 sm:px-8 pb-16">
        <HowItWorks />
        <div>
          <h2 className="text-lg sm:text-2xl font-bold text-blue-900 mb-2 text-center animate-slideUp">Find Upcoming Interviews</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center animate-slideUp">
            Start typing a job, course, branch, or session title.
          </p>
          <InterviewSearchBox
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleSearch={handleSearch}
            handleInputKeyDown={handleInputKeyDown}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            selectedCourse={selectedCourse}
            setSelectedCourse={setSelectedCourse}
          />
        </div>
        <div ref={interviewListRef}>
          <InterviewListSection filteredInterviews={filteredInterviews} />
        </div>
        <PastInterviewSection />
        <FAQSection />
        <TopPerformersSection performers={performers} />
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
        /* Prevent overflow on mobile */
        html, body {
          overflow-x: hidden;
          width: 100%;
        }
        /* Responsive adjustments for mobile */
        @media (max-width: 640px) {
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .aspect-square {
            aspect-ratio: 1 / 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem;
            overflow: hidden;
          }
          .text-xl {
            font-size: 1.25rem;
          }
          .text-lg {
            font-size: 1rem;
          }
          .text-sm {
            font-size: 0.75rem;
          }
          .text-xs {
            font-size: 0.65rem;
          }
          .p-3 {
            padding: 0.75rem;
          }
          .p-2 {
            padding: 0.5rem;
          }
          .mb-2 {
            margin-bottom: 0.5rem;
          }
          .mt-1 {
            margin-top: 0.25rem;
          }
          .w-4 {
            width: 1rem;
            height: 1rem;
          }
          .max-w-xs {
            max-width: 18rem;
          }
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .leading-tight {
            line-height: 1.2;
          }
        }
      `}</style>
    </div>
  );
};

export default Interview;
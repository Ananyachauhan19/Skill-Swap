import React from "react";
import InterviewListSection from "./interviewSection/InterviewListSection";
import PastInterviewSection from "./interviewSection/PastInterviewSection";
import FAQSection from "./interviewSection/FAQ";
import InterviewSearchBox from "./interviewSection/InterviewSearchBox";
import TopPerformersSection from "./HomeSection/TopPerformersSection";

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
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      How It Works
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {[
        {
          icon: (
            <g>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M8 12l2 2 4-4" />
            </g>
          ),
          title: "Book a Mock Interview",
          desc: "Select your domain and schedule a session with an expert interviewer."
        },
        {
          icon: (
            <g>
              <rect x="4" y="4" width="16" height="16" rx="8" />
              <path strokeLinecap="round" d="M8 12h8" />
            </g>
          ),
          title: "Attend & Get Evaluated",
          desc: "Participate in a real-time mock interview and receive live feedback."
        },
        {
          icon: (
            <g>
              <path strokeLinecap="round" d="M12 6v6l4 2" />
              <circle cx="12" cy="12" r="10" />
            </g>
          ),
          title: "Review & Improve",
          desc: "Receive detailed feedback and actionable tips to excel in your interviews."
        },
        {
          icon: (
            <g>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </g>
          ),
          title: "Session Fee & Payment",
          desc: "Each session costs ₹500 per head, payable online via secure transaction."
        }
      ].map((item, index) => (
        <div
          key={index}
          className="flex flex-col items-center text-center p-4 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:bg-blue-50 border border-blue-100 cursor-pointer aspect-square sm:aspect-auto"
        >
          <div className="bg-blue-600 text-white rounded-full p-3 mb-3">
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

const Interview = () => {
  const interviewListRef = React.useRef(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredInterviews, setFilteredInterviews] = React.useState(null);
  const [selectedJob, setSelectedJob] = React.useState("");
  const [selectedCourse, setSelectedCourse] = React.useState("");

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
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-6 sm:mt-8">
          {[
            "Expert Interviewers",
            "Personalized Feedback",
            "Placement Ready"
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
          Find Upcoming Interviews
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 text-center">
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

export default Interview;
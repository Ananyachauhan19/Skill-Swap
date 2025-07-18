import React from "react";
import InterviewListSection from "./interviewSection/InterviewListSection";
import PastInterviewSection from "./interviewSection/PastInterviewSection";
import FAQSection from "./interviewSection/FAQ";
import InterviewSearchBox from "./interviewSection/InterviewSearchBox";
import TopPerformersSection from "./HomeSection/TopPerformersSection";
import Blog from '../user/company/Blog'; 

const HowItWorks = () => (
  <section className="relative bg-white rounded-xl shadow p-4 flex flex-col gap-4 border border-blue-200 mb-8">
    <h2 className="text-lg sm:text-xl font-bold text-blue-900 text-center flex items-center justify-center gap-2">
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      How It Works
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M8 12l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Book a Mock Interview</h3>
        <p className="text-xs text-gray-700 mt-1">Select your domain and schedule a session with an expert interviewer.</p>
      </div>
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="8" />
            <path strokeLinecap="round" d="M8 12h8" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Attend & Get Evaluated</h3>
        <p className="text-xs text-gray-700 mt-1">Participate in a real-time mock interview and receive live feedback.</p>
      </div>
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-blue-100 text-blue-700 rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M12 6v6l4 2" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-blue-900">Review & Improve</h3>
        <p className="text-xs text-gray-700 mt-1">Receive detailed feedback and actionable tips to excel in your interviews.</p>
      </div>
      <div className="flex flex-col items-center text-center p-3 bg-blue-50 rounded-lg shadow hover:shadow-md transition-all duration-200 hover:scale-105">
        <div className="bg-green-100 text-green-700 rounded-full p-2 mb-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-green-900">Session Fee & Payment</h3>
        <p className="text-xs text-green-900 mt-1">Each session costs <span className="font-bold">₹500 per head</span>, payable online via secure transaction before joining.</p>
      </div>
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
    // Combine searchTerm, selectedJob, selectedCourse for filtering
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
    <div className="min-h-screen w-full bg-blue-50">
      <header className="w-full max-w-7xl mx-auto text-center py-6 sm:py-10 px-4 sm:px-6 relative">
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-left">
            <h1 className="text-4xl sm:text-5xl font-bold text-blue-900 mb-4 leading-tight">
              Master Your Interviews with Expert Guidance
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 max-w-xl mb-6">
              Practice with industry professionals, get personalized feedback, and build confidence to ace your next interview.
            </p>
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-blue-700 transition-all duration-300 hover:scale-105"
              onClick={handleBookClick}
            >
              Book a Mock Interview
            </button>
          </div>
          <div className="flex-1 hidden md:block">
            <img
              src="/assets/interview-illustration.webp"
              alt="Mock Interview Illustration"
              className="w-full max-w-md mx-auto object-contain"
            />
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
            Expert Interviewers
          </span>
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
            Personalized Feedback
          </span>
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold text-sm shadow-sm transition-transform hover:scale-105 hover:bg-blue-200">
            Placement Ready
          </span>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-16 px-4 sm:px-6 pb-12">
        <HowItWorks />
        {/* Search Box */}
        <h2 className="text-2xl font-bold text-blue-900 mb-2 text-center">Find Upcoming Interviews</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
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
        <PastInterviewSection />
        <FAQSection />
        <TopPerformersSection performers={performers} />
         <Blog />
           
      </main>
    </div>
  );
};

export default Interview;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExchangeAlt, FaChalkboardTeacher, FaUsers, FaComments, FaRocket } from "react-icons/fa";

// Image imports
const oneOnOneImg = "/assets/one-on-one.png";
const groupChatImg = "/assets/group-chat.png";
const interviewImg = "/assets/interview-icon.png";
const user1Img = "/user1.png";
const user2Img = "/user2.png";
const user3Img = "/user3.png";

const Home = () => {
  const navigate = useNavigate();

  // Stats state
  const [stats] = useState([
    {
      icon: <FaChalkboardTeacher className="text-5xl text-blue-600" />,
      value: 18200,
      label: "Active Members",
    },
    {
      icon: <FaUsers className="text-5xl text-blue-600" />,
      value: 4500,
      label: "Experts Available",
    },
    {
      icon: <FaComments className="text-5xl text-blue-600" />,
      value: 50,
      label: "Session Types",
    },
  ]);

  // Top performers state
  const [performers] = useState([
    {
      img: user1Img,
      alt: "Most Active",
      title: "Most Active Learner",
      name: "Aditya Singh",
      stat: "15 sessions",
    },
    {
      img: user2Img,
      alt: "Top Tutor",
      title: "Highest Rated Tutor",
      name: "Ananya S.",
      extra: <span className="text-yellow-400 text-2xl">★★★★★</span>,
    },
    {
      img: user3Img,
      alt: "Top Earner",
      title: "Top Earner",
      name: "Rahul",
      stat: <span className="text-green-600 font-semibold">₹ 8,200 Earned</span>,
    },
  ]);

  // Feature tabs data
  const featureTabs = [
    {
      title: "1 on 1 Session",
      subtitle: "Personalized Mentorship",
      img: oneOnOneImg,
      bg: "bg-gradient-to-br from-blue-50 to-blue-200",
      path: "/one-on-one",
    },
    {
      title: "Job Interview",
      subtitle: "Real Practice. Real Growth.",
      img: interviewImg,
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-200",
      path: "/interview",
    },
    {
      title: "Group Discussion",
      subtitle: "Collaborative Growth",
      img: groupChatImg,
      bg: "bg-gradient-to-br from-purple-50 to-purple-200",
      path: "/discuss",
    },
    {
      title: "Workshops",
      subtitle: "Coming Soon!",
      img: oneOnOneImg,
      bg: "bg-gradient-to-br from-gray-100 to-gray-300",
      path: "#",
      disabled: true,
    },
    {
      title: "Masterclasses",
      subtitle: "Stay Tuned!",
      img: oneOnOneImg,
      bg: "bg-gradient-to-br from-gray-100 to-gray-300",
      path: "#",
      disabled: true,
    },
  ];

  return (
    <main className="bg-gray-50 text-gray-800 min-h-screen font-[Poppins,Inter,sans-serif] overflow-hidden">
    {/* Hero Section */}
<section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-8 relative">
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
    {/* Left Panel */}
    <div className="lg:col-span-3 flex flex-col justify-center">
      <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-500">
        Swapping Skills <br /> Together
      </h1>
      <p className="text-lg sm:text-xl text-gray-600 mt-6 max-w-2xl leading-relaxed">
        Empower your learning journey with live sessions, collaborative discussions, and real-world interview practice.
      </p>
      <button
        onClick={() => navigate("/pro")}
        className="mt-8 bg-gradient-to-r from-blue-700 to-blue-500 text-white px-8 py-3 rounded-full font-semibold flex items-center gap-3 w-fit hover:from-blue-800 hover:to-blue-600 hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <FaExchangeAlt className="w-5 h-5" />
        <span className="text-lg">Swap Skills Pro</span>
      </button>
    </div>

    {/* Right Panel - Feature Tabs */}
    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 z-10">
      {featureTabs.map((tab, idx) => (
        <div
          key={tab.title}
          className={`${tab.bg} rounded-2xl p-0 shadow-md border border-blue-100 hover:shadow-xl hover:scale-105 transition-all duration-300 ${
            tab.disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          } overflow-hidden`}
          onClick={() => !tab.disabled && navigate(tab.path)}
        >
          <img
            src={tab.img}
            alt={tab.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  </div>

 
</section>

      {/* Activity Section (Stats) */}
      <section className="bg-blue-50 py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-md border border-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              {stat.icon}
              <div>
                <p className="text-3xl font-bold text-blue-700">
                  {stat.value.toLocaleString()}+
                </p>
                <p className="text-base text-blue-600 mt-2">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Performers Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-blue-50">
        <h2 className="text-3xl sm:text-5xl font-bold text-center text-blue-800 mb-12">
          Our Top Performers
        </h2>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center gap-8">
          {performers.map((p, idx) => (
            <div
              key={p.title}
              className="bg-white rounded-2xl shadow-md p-6 w-full sm:w-80 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 border border-blue-100"
            >
              <img
                src={p.img}
                alt={p.alt}
                className="w-24 h-24 mx-auto rounded-full object-cover mb-4 border-4 border-blue-200"
              />
              <p className="font-semibold text-lg text-blue-800">{p.title}</p>
              <p className="font-bold text-xl text-blue-900 mt-2">{p.name}</p>
              {p.stat && <p className="text-base text-blue-600 mt-2">{p.stat}</p>}
              {p.extra}
            </div>
          ))}
        </div>
      </section>

      {/* Who Are We Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          <div className="lg:w-3/5">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-6">
              Who We Are
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
              Swap Skills Pro is a community-driven platform where learning and teaching go hand in hand. We create a space where everyone is both a student and a mentor, fostering growth through skill exchange and collaboration.
            </p>
          </div>
          <div className="lg:w-2/5 grid grid-cols-2 gap-4">
            {[
              { img: oneOnOneImg, alt: "Mentorship", bg: "bg-gradient-to-br from-blue-50 to-blue-200" },
              { img: groupChatImg, alt: "Discussion", bg: "bg-gradient-to-br from-purple-50 to-purple-200" },
              { img: interviewImg, alt: "Interview", bg: "bg-gradient-to-br from-indigo-50 to-indigo-200" },
              { img: oneOnOneImg, alt: "Mentorship", bg: "bg-gradient-to-br from-blue-50 to-blue-200" },
            ].map((tab, idx) => (
              <div
                key={tab.alt + idx}
                className={`${tab.bg} rounded-2xl p-6 shadow-md border border-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center`}
              >
                <img src={tab.img} alt={tab.alt} className="w-14 h-14 object-contain" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Swap Skills Pro Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          <div className="lg:w-2/5 grid grid-cols-2 gap-4">
            {[
              { img: groupChatImg, alt: "Discussion", bg: "bg-gradient-to-br from-purple-50 to-purple-200" },
              { img: interviewImg, alt: "Interview", bg: "bg-gradient-to-br from-indigo-50 to-indigo-200" },
              { img: oneOnOneImg, alt: "Mentorship", bg: "bg-gradient-to-br from-blue-50 to-blue-200" },
              { img: groupChatImg, alt: "Discussion", bg: "bg-gradient-to-br from-purple-50 to-purple-200" },
            ].map((tab, idx) => (
              <div
                key={tab.alt + idx}
                className={`${tab.bg} rounded-2xl p-6 shadow-md border border-blue-100 hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center`}
              >
                <img src={tab.img} alt={tab.alt} className="w-14 h-14 object-contain" />
              </div>
            ))}
          </div>
          <div className="lg:w-3/5">
            <h2 className="text-3xl sm:text-4xl font-bold text-blue-800 mb-6">
              Why Choose Swap Skills Pro
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl leading-relaxed">
              Our platform transforms learning into an interactive experience. Earn credits by sharing your expertise and use them to learn new skills. With live sessions and collaborative projects, Swap Skills Pro empowers you to grow actively within a vibrant community.
            </p>
          </div>
        </div>
      </section>

      {/* Let's Start Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-8 bg-gradient-to-b from-blue-50 to-blue-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-blue-800 mb-6">
            Let's Start Your Learning Journey
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Join thousands of learners and mentors in a community where knowledge is shared, skills are swapped, and growth is limitless. Start today and unlock your potential!
          </p>
          <button
            onClick={() => navigate("/register")}
            className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-10 py-4 rounded-full font-semibold flex items-center gap-3 mx-auto hover:from-blue-800 hover:to-blue-600 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <FaRocket className="w-6 h-6" />
            <span className="text-lg">Get Started Now</span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default Home;
import React, { useEffect, useState } from "react";
import {
  FaUser,
  FaCheckCircle,
  FaBook,
  FaChalkboardTeacher,
  FaUsers,
  FaComments,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import CountUp from "react-countup";
import { motion } from 'framer-motion';


const HomePage = () => {
  const navigate = useNavigate();

  // Stats and performers state
  const [stats, setStats] = useState([
    {
      icon: <FaUser className="text-4xl text-blue-600" />,
      value: 18200,
      label: "Active Members",
      bg: "bg-blue-100 text-blue-900 border-blue-200",
    },
    {
      icon: <FaCheckCircle className="text-4xl text-green-600" />,
      value: 4500,
      label: "Experts Available",
      bg: "bg-green-100 text-green-900 border-green-200",
    },
    {
      icon: <FaBook className="text-4xl text-indigo-600" />,
      value: 50,
      label: "Different Subjects",
      bg: "bg-indigo-100 text-indigo-900 border-indigo-200",
    },
  ]);

  const [performers, setPerformers] = useState([
    {
      img: "/user1.png",
      alt: "Most Active",
      title: "Most Active Learner",
      name: "Aditya Singh",
      stat: "15 sessions",
      extra: null,
    },
    {
      img: "/user2.png",
      alt: "Top Tutor",
      title: "Highest Rated Tutor",
      name: "Ananya S.",
      stat: null,
      extra: <span className="text-yellow-500">★★★★★</span>,
    },
    {
      img: "/user3.png",
      alt: "Top Earner",
      title: "Top Earner",
      name: "Rahul",
      stat: <span className="text-green-600 font-bold">₹ 8,200 Earned</span>,
      extra: null,
    },
  ]);

  // Placeholder: Replace with real API call
  useEffect(() => {
    // Example: fetchStatsData().then(setStats);
    // Example: fetchTopPerformers().then(setPerformers);
  }, []);

  return (
    <main className="bg-blue-600 text-white min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-10 sm:py-16 px-4 sm:px-8">
        <h1 className="text-3xl sm:text-5xl font-bold mb-2 mt-0 sm:mb-3 leading-tight">Find & share knowledge</h1>
        <p className="text-lg sm:text-2xl font-light mb-8 sm:mb-15">one-on-one or in groups</p>
        <div className="flex flex-col md:flex-row justify-center gap-7 mt-2 sm:mt-4 relative">
          <div className="hidden md:flex flex-col items-center justify-start min-w-[120px] pt-4 absolute left-0 top-1/2 -translate-y-1/2 ml-50">
            <FaChalkboardTeacher className="text-blue-200 text-5xl mb-8" />
            <FaUsers className="text-green-200 text-5xl mb-6" />
            <FaComments className="text-yellow-300 text-5xl" />
          </div>
          <div className="flex flex-col md:flex-row gap-7 md:ml-90 w-full justify-center">
            {/* Card 1 */}
            <div
              onClick={() => navigate("/one-on-one")}
              className="bg-white text-black rounded-xl shadow-lg p-4 w-full sm:w-52 cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl flex flex-col items-center group border border-gray-100"
            >
              <FaChalkboardTeacher className="text-blue-500 text-3xl mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-semibold text-center mt-1">1:1 Live Session</h3>
            </div>
            {/* Card 2 */}
            <div
              onClick={() => navigate("/discuss")}
              className="bg-white text-black rounded-xl shadow-lg p-4 w-full sm:w-52 cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl flex flex-col items-center group border border-gray-100"
            >
              <FaUsers className="text-green-500 text-3xl mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-semibold text-center mt-1">Group Discussion</h3>
            </div>
            {/* Card 3 */}
            <div
              onClick={() => navigate("/interview")}
              className="bg-white text-black rounded-xl shadow-lg p-4 w-full sm:w-52 cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl flex flex-col items-center group border border-gray-100"
            >
              <FaComments className="text-yellow-500 text-3xl mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-semibold text-center mt-1">Real-Time Job Interview Practice</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-500 py-10 sm:py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 sm:gap-9 text-center">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className={`${stat.bg} rounded-xl px-5 py-6 flex flex-col items-center justify-center gap-4 shadow-md hover:shadow-lg transition-all border`}
            >
              {stat.icon}
              <div>
                <p className="text-xl font-bold">
                  <CountUp end={stat.value} duration={2} separator="," />+
                </p>
                <p className="text-sm">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      
      {/* Top Performers Section */}
      <section className="bg-blue-100 py-10 sm:py-14 text-black px-4 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10">
          This week’s top performers
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-6 sm:gap-10">
          {performers.map((p, idx) => (
            <div key={p.title} className="bg-white rounded-2xl shadow-md p-6 sm:p-8 w-full sm:w-72 text-center hover:shadow-xl transition duration-300 border border-gray-200">
              <img
                src={p.img}
                alt={p.alt}
                className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full object-cover mb-4"
              />
              <p className="mt-2 font-semibold">{p.title}</p>
              <p className="font-bold">{p.name}</p>
              {p.stat && <p>{p.stat}</p>}
              {p.extra}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;

import React from "react";
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

  return (
    <main className="bg-blue-600 text-white min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-16 px-4">
        <h1 className="text-4xl font-bold mb-4">Find & share knowledge</h1>
        <p className="text-2xl font-light">one-on-one or in groups</p>

        <div className="flex flex-col md:flex-row justify-center gap-6 mt-12 relative">
          <div className="hidden md:flex flex-col items-center justify-start min-w-[120px] pt-4 absolute left-0 top-1/2 -translate-y-1/2">
            <FaChalkboardTeacher className="text-blue-200 text-5xl mb-6" />
            <FaUsers className="text-green-200 text-5xl mb-6" />
            <FaComments className="text-yellow-300 text-5xl" />
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:ml-40 w-full justify-center">
            {/* Card 1 */}
            <div
              onClick={() => navigate("/one-on-one")}
              className="bg-white text-black rounded-xl shadow-lg p-4 w-56 cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl flex flex-col items-center group"
            >
              <FaChalkboardTeacher className="text-blue-500 text-4xl mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-semibold text-center mt-1">
                1:1 Live Session
              </h3>
            </div>

            {/* Card 2 */}
            <div
              onClick={() => navigate("/discuss")}
              className="bg-white text-black rounded-xl shadow-lg p-4 w-56 cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl flex flex-col items-center group"
            >
              <FaUsers className="text-green-500 text-4xl mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-semibold text-center mt-1">
                Group Discussion
              </h3>
            </div>

            {/* Card 3 */}
            <div
              onClick={() => navigate("/interview")}
              className="bg-white text-black rounded-xl shadow-lg p-4 w-56 cursor-pointer transition-transform transform hover:scale-105 hover:shadow-2xl flex flex-col items-center group"
            >
              <FaComments className="text-yellow-500 text-4xl mb-2 group-hover:scale-110 transition-transform" />
              <h3 className="text-base font-semibold text-center mt-1">
                Real-Time Job Interview Practice
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-500 py-12 px-6">
  <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 text-center">
    
    {/* Active Members */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-blue-100 text-blue-900 rounded-lg px-4 py-6 flex items-center gap-4 shadow-md hover:shadow-lg transition-all"
    >
      <FaUser className="text-3xl text-blue-600" />
      <div>
        <p className="text-xl font-bold">
          <CountUp end={18200} duration={2} separator="," />+
        </p>
        <p className="text-sm">Active Members</p>
      </div>
    </motion.div>

    {/* Experts Available */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-green-100 text-green-900 rounded-lg px-4 py-6 flex items-center gap-4 shadow-md hover:shadow-lg transition-all"
    >
      <FaCheckCircle className="text-3xl text-green-600" />
      <div>
        <p className="text-xl font-bold">
          <CountUp end={4500} duration={2} separator="," />+
        </p>
        <p className="text-sm">Experts Available</p>
      </div>
    </motion.div>

    {/* Different Subjects */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-indigo-100 text-indigo-900 rounded-lg px-4 py-6 flex items-center gap-4 shadow-md hover:shadow-lg transition-all"
    >
      <FaBook className="text-3xl text-indigo-600" />
      <div>
        <p className="text-xl font-bold">
          <CountUp end={50} duration={2} separator="," />+
        </p>
        <p className="text-sm">Different Subjects</p>
      </div>
    </motion.div>

  </div>
</section>

      {/* Top Performers Section */}
      <section className="bg-blue-100 py-10 text-black px-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          This week’s top performers
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-6">
          {/* Performer 1 */}
          <div className="bg-white rounded-xl shadow-md p-6 w-64 text-center hover:shadow-xl transition duration-300">
            <img
              src="/user1.png"
              alt="Most Active"
              className="w-20 h-20 mx-auto rounded-full"
            />
            <p className="mt-4 font-semibold">Most Active Learner</p>
            <p className="font-bold">Aditya Singh</p>
            <p>15 sessions</p>
          </div>

          {/* Performer 2 */}
          <div className="bg-white rounded-xl shadow-md p-6 w-64 text-center hover:shadow-xl transition duration-300">
            <img
              src="/user2.png"
              alt="Top Tutor"
              className="w-20 h-20 mx-auto rounded-full"
            />
            <p className="mt-4 font-semibold">Highest Rated Tutor</p>
            <p className="font-bold">Ananya S.</p>
            <p className="text-yellow-500">★★★★★</p>
          </div>

          {/* Performer 3 */}
          <div className="bg-white rounded-xl shadow-md p-6 w-64 text-center hover:shadow-xl transition duration-300">
            <img
              src="/user3.png"
              alt="Top Earner"
              className="w-20 h-20 mx-auto rounded-full"
            />
            <p className="mt-4 font-semibold">Top Earner</p>
            <p className="font-bold">Rahul</p>
            <p className="text-green-600 font-bold">₹ 8,200 Earned</p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;

import React from "react";
import { FaRocket } from "react-icons/fa";

const LetsStartSection = ({ isLoggedIn, openLogin, buttonVariants }) => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-8 bg-gradient-to-b from-blue-50 to-gray-100">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl sm:text-4xl font-bold text-blue-900 mb-6">
          Begin Your Learning Journey
        </h2>
        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Join a global community of professionals dedicated to lifelong learning and skill-sharing. Start today and elevate your career.
        </p>
        <button
          onClick={() => {
            if (isLoggedIn) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              openLogin();
            }
          }}
          className="bg-blue-900 text-white px-8 py-4 rounded-md font-semibold flex items-center gap-2 mx-auto hover:shadow-xl transition-all duration-300"
        >
          <FaRocket className="w-5 h-5" />
          <span className="text-base">Get Started</span>
        </button>
      </div>
    </section>
  );
};

export default LetsStartSection;

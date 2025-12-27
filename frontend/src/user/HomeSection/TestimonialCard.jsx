import React from 'react';
import { FaStar } from 'react-icons/fa';

const TestimonialCard = ({ testimonial }) => {
  const { username, rating, description, profilePic } = testimonial;

  return (
    <div className="flex-shrink-0 w-[260px] sm:w-[300px] md:w-[340px] lg:w-[360px] bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 mx-2 sm:mx-3">
      {/* Header with Avatar and SkillSwapHub Logo */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Avatar */}
          <img
            src={profilePic || 'https://ui-avatars.com/api/?name=' + username + '&background=0D8ABC&color=fff'}
            alt={username}
            className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover border-2 border-gray-100"
          />
          {/* Name and Username */}
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base md:text-lg">{username}</h3>
            <p className="text-xs sm:text-sm text-gray-500">@{username.toLowerCase().replace(/\s+/g, '')}</p>
          </div>
        </div>
        {/* SkillSwapHub Logo */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-blue-900 p-1 sm:p-1.5 flex items-center justify-center bg-white flex-shrink-0">
          <img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
            alt="SkillSwapHub"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Star Rating */}
      <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={`text-sm sm:text-base md:text-lg ${
              index < rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Testimonial Text */}
      <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-[15px]">
        {description}
      </p>
    </div>
  );
};

export default TestimonialCard;

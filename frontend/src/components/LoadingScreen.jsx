import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo container with spinner */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
            alt="SkillSwap Logo"
            className="w-12 h-12 object-contain drop-shadow-md z-10"
          />
          {/* Spinner ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-[3px] border-blue-900/20 border-t-blue-900 animate-spin" />
          </div>
        </div>
        
        {/* SkillSwap Hub text */}
        <h1 className="text-xl font-semibold text-blue-900 tracking-wide">
          SkillSwap Hub
        </h1>
      </div>
    </div>
  );
};

export default LoadingScreen;

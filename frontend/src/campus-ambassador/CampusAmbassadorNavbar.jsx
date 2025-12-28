import React from 'react';
import { Plus, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CampusAmbassadorNavbar = ({ onAddInstitute, onUploadTest }) => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 w-full h-[64px] sm:h-[72px] bg-[#F5F9FF] text-blue-900 px-3 sm:px-4 shadow-md border-b border-gray-200/50 z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto h-full">
        
        {/* Left Side - Logo and Title (Same as main navbar) */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-transform duration-300 hover:scale-105 flex-shrink-0"
          onClick={() => navigate('/')}
        >
          <img
            src="https://res.cloudinary.com/dbltazdsa/image/upload/v1766589377/webimages/skillswap-logo.png"
            alt="SkillSwapHub Logo"
            className="h-9 w-9 md:h-10 md:w-10 lg:h-12 lg:w-12 object-contain rounded-full shadow-md border-2 border-blue-900"
          />
          <span className="text-sm md:text-base lg:text-lg font-extrabold text-blue-900 font-lora tracking-wide drop-shadow-md">
            SkillSwapHub
          </span>
        </div>

        {/* Center - Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onAddInstitute}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-blue-800 rounded-full shadow-md hover:from-blue-800 hover:to-blue-700 hover:scale-105 transition-all duration-300 whitespace-nowrap"
          >
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add College / School</span>
            <span className="sm:hidden">Add</span>
          </button>
          
          <button
            onClick={onUploadTest}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-blue-900 bg-blue-100/50 rounded-full shadow-sm hover:bg-gradient-to-r hover:from-blue-900 hover:to-blue-800 hover:text-white hover:shadow-md hover:scale-105 transition-all duration-300 whitespace-nowrap"
          >
            <Upload size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Upload Test</span>
            <span className="sm:hidden">Upload</span>
          </button>
        </div>

        {/* Right Side - Empty for visual balance */}
        <div className="w-20 sm:w-32 flex-shrink-0"></div>
      </div>
    </nav>
  );
};

export default CampusAmbassadorNavbar;

import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

const UserInfoSection = ({ fullName, setFullName, email, setEmail, profilePicPreview, handleProfilePicChange, editMode }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
      {/* Profile Picture */}
      <div className="relative w-28 h-28">
        <img
          src={profilePicPreview}
          alt="Profile Preview"
          className="w-full h-full object-cover rounded-full border border-gray-300"
        />
        {/* Camera icon (upload trigger) */}
        <label className={`absolute bottom-0 right-0 bg-white rounded-full p-1 shadow ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Camera className="w-5 h-5 text-gray-600" />
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={editMode ? handleProfilePicChange : undefined}
            className="hidden"
            disabled={!editMode}
          />
        </label>
      </div>
      {/* User Info (Full Name and Email) */}
      <div className="flex flex-col items-start justify-center flex-1 w-full">
        <input
          type="text"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          readOnly={!editMode}
          className="text-lg font-semibold text-blue-900 break-all bg-transparent border-b focus:outline-none w-full"
          placeholder="Full Name"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          readOnly={!editMode}
          className="text-base text-gray-600 break-all bg-transparent border-b focus:outline-none w-full"
          placeholder="Email"
        />
      </div>
    </div>
  );
};

export default UserInfoSection;

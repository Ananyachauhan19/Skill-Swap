import React, { useEffect } from "react";

const UserInfoSection = ({ fullName, setFullName, email, setEmail, profilePicPreview, handleProfilePicChange }) => {
  // Simulate fetching user info from backend
  useEffect(() => {
    // Example: fetchUserInfo().then(({ fullName, email }) => { setFullName(fullName); setEmail(email); });
    // For now, set static sample data
    // setFullName("Ananya Sharma");
    // setEmail("ananya@example.com");
  }, [setFullName, setEmail]);

  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div>
        <label className="block font-semibold mb-1">Full Name</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      {/* Email Address */}
      <div>
        <label className="block font-semibold mb-1">Email Address</label>
        <input
          type="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      {/* Profile Picture Upload */}
      <div>
        <label className="block font-semibold mb-1">Upload Profile Picture <span className="font-normal text-gray-500">(optional, jpg/png)</span></label>
        <input
          type="file"
          accept="image/png, image/jpeg"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          onChange={handleProfilePicChange}
        />
        {profilePicPreview && (
          <img
            src={profilePicPreview}
            alt="Profile Preview"
            className="mt-3 w-24 h-24 rounded-full object-cover border border-gray-300 mx-auto"
          />
        )}
      </div>
    </div>
  );
};

export default UserInfoSection;

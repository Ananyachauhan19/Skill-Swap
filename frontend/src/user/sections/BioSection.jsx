import React from "react";

const BioSection = ({ bio, setBio }) => (
  <div className="mb-6">
    <label className="block font-semibold mb-1">Tell Us About Yourself</label>
    <textarea
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
      placeholder="Add a short description about your experience, interests, or motivation."
      value={bio}
      onChange={e => setBio(e.target.value)}
      maxLength={500}
    />
    <div className="text-xs text-gray-500 text-right mt-1">{bio.length}/500</div>
  </div>
);

export default BioSection;

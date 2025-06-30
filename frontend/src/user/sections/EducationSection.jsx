import React from "react";

const EducationSection = ({ education, setEducation }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEducation((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="mb-6">
      <label className="block font-semibold mb-1">Education Details</label>
      <div className="space-y-3">
        <input
          type="text"
          name="degree"
          placeholder="Degree (e.g. B.Tech, M.Sc, etc.)"
          value={education.degree}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="university"
          placeholder="University/Institute Name"
          value={education.university}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="year"
          placeholder="Year of Graduation"
          value={education.year}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          name="specialization"
          placeholder="Specialization (optional)"
          value={education.specialization}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>
    </div>
  );
};

export default EducationSection;

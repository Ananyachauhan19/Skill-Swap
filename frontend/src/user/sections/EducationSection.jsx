import React from "react";

const EducationSection = ({ education, setEducation, editMode, onAddClick, onSave, onCancel, autoFocus }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEducation({ ...education, [name]: value });
  };
  
  const safeEducation = {
    degree: education?.degree || '',
    university: education?.university || '',
    year: education?.year || '',
    specialization: education?.specialization || ''
  };
  const isEmpty = !safeEducation.degree && !safeEducation.university && !safeEducation.year && !safeEducation.specialization;

  return (
    <div className="mb-6 group relative">
      <label className="block font-semibold mb-1">Education Details</label>
      {editMode ? (
        <>
          <div className="space-y-3">
            <input
              type="text"
              name="degree"
              placeholder="Degree (e.g. B.Tech, M.Sc, etc.)"
              value={safeEducation.degree}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus={autoFocus}
            />
            <input
              type="text"
              name="university"
              placeholder="University/Institute Name"
              value={safeEducation.university}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="year"
              placeholder="Year of Graduation"
              value={safeEducation.year}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="specialization"
              placeholder="Specialization (optional)"
              value={safeEducation.specialization}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700 border"
              onClick={onSave}
              type="button"
            >
              Save
            </button>
            <button
              className="text-sm bg-gray-100 hover:bg-gray-200 border px-3 py-1 rounded-md font-medium"
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="w-full px-1 py-2 text-gray-700 text-base">
          {isEmpty ? (
            <button
              className="text-blue-600 underline text-sm hover:text-blue-800 p-0 m-0 bg-transparent border-none outline-none"
              onClick={onAddClick}
              type="button"
            >
              + Add Education
            </button>
          ) : (
            <div className="space-y-1">
              {safeEducation.degree && <div><span className="font-medium">Degree:</span> {safeEducation.degree}</div>}
              {safeEducation.university && <div><span className="font-medium">University:</span> {safeEducation.university}</div>}
              {safeEducation.year && <div><span className="font-medium">Year:</span> {safeEducation.year}</div>}
              {safeEducation.specialization && <div><span className="font-medium">Specialization:</span> {safeEducation.specialization}</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EducationSection;

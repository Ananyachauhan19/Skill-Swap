import React from "react";

const ExperienceSection = ({ experience, setExperience, experienceSummary, setExperienceSummary, editMode, onAddClick, onSave, onCancel, autoFocus }) => {
  const handleChange = (e, idx) => {
    const { name, value } = e.target;
    setExperience(prev => prev.map((exp, i) => i === idx ? { ...exp, [name]: value } : exp));
  };
  const handleAdd = () => setExperience([...experience, { role: '', company: '', years: '' }]);
  const handleRemove = idx => setExperience(experience.filter((_, i) => i !== idx));
  const isEmpty = !experience || experience.length === 0;

  return (
    <div className="mb-6 group relative">
      <label className="block font-semibold mb-1">Experience</label>
      {editMode ? (
        <>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[60px] mb-4"
            placeholder="Write a summary about your professional experience, achievements, or anything you'd like to highlight."
            value={experienceSummary}
            onChange={e => setExperienceSummary(e.target.value)}
            maxLength={1000}
            autoFocus={autoFocus && (!experience || experience.length === 0)}
          />
          {experience.map((exp, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2">
              <input
                type="text"
                name="role"
                placeholder="Role/Title"
                value={exp.role}
                onChange={e => handleChange(e, idx)}
                className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
                autoFocus={autoFocus && idx === 0 && experience.length > 0}
              />
              <input
                type="text"
                name="company"
                placeholder="Company/Organization"
                value={exp.company}
                onChange={e => handleChange(e, idx)}
                className="border border-gray-300 rounded-lg px-3 py-2 flex-1"
              />
              <input
                type="text"
                name="years"
                placeholder="Years (e.g. 2020-2023)"
                value={exp.years}
                onChange={e => handleChange(e, idx)}
                className="border border-gray-300 rounded-lg px-3 py-2 w-32"
              />
              <button type="button" onClick={() => handleRemove(idx)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
            </div>
          ))}
          <button type="button" onClick={handleAdd} className="text-blue-600 underline text-sm hover:text-blue-800 mb-2">+ Add Experience</button>
          <div className="flex gap-2 mt-2">
            <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md font-medium hover:bg-blue-700 border" onClick={onSave} type="button">Save</button>
            <button className="text-sm bg-gray-100 hover:bg-gray-200 border px-3 py-1 rounded-md font-medium" onClick={onCancel} type="button">Cancel</button>
          </div>
        </>
      ) : (
        <div className="w-full px-1 py-2 text-gray-700 text-base">
          {(!experienceSummary || experienceSummary.trim() === '') && isEmpty ? (
            <button className="text-blue-600 underline text-sm hover:text-blue-800 p-0 m-0 bg-transparent border-none outline-none" onClick={onAddClick} type="button">+ Add Experience</button>
          ) : (
            <>
              {experienceSummary && <div className="mb-2 whitespace-pre-line">{experienceSummary}</div>}
              {experience.length > 0 && (
                <ul className="space-y-1">
                  {experience.map((exp, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{exp.role}</span> at <span className="font-medium">{exp.company}</span> <span className="text-gray-500">({exp.years})</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ExperienceSection;

import React, { useEffect } from "react";

const SkillsLearnSection = ({ learnSkillInput, setLearnSkillInput, learnSkills, handleAddLearnSkill, handleRemoveLearnSkill, editMode, onAddClick, onSave, onCancel, autoFocus }) => {
  // Simulate fetching learning interests from backend
  useEffect(() => {
    // Example: fetchLearnSkills().then(setLearnSkills);
    // setLearnSkills(["React", "Data Science"]);
  }, []);

  return (
    <div className="mb-6 group relative">
      <label className="block font-semibold mb-1">I Want to Learn</label>
      {editMode ? (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Add a learning interest (e.g. React)"
              value={learnSkillInput}
              onChange={e => setLearnSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' ? (e.preventDefault(), handleAddLearnSkill()) : null}
              readOnly={!editMode}
              autoFocus={autoFocus}
            />
            <button type="button" onClick={handleAddLearnSkill} className="px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center gap-1" disabled={!editMode}>
              <span>➕</span> Add Learning Interest
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {learnSkills.map((skill, idx) => (
              <span key={skill} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                {skill}
                <button type="button" onClick={() => handleRemoveLearnSkill(idx)} className="ml-1 text-red-500 hover:text-red-700 text-xs font-semibold" disabled={!editMode}>✕</button>
              </span>
            ))}
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
          {learnSkills.length === 0 ? (
            <button
              className="text-blue-600 underline text-sm hover:text-blue-800 p-0 m-0 bg-transparent border-none outline-none"
              onClick={onAddClick}
              type="button"
            >
              + Add Learning Interest
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {learnSkills.map((skill, idx) => (
                <span key={skill} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsLearnSection;

import React, { useEffect } from "react";

const SkillsLearnSection = ({ learnSkillInput, setLearnSkillInput, learnSkills, handleAddLearnSkill, handleRemoveLearnSkill }) => {
  // Simulate fetching learning interests from backend
  useEffect(() => {
    // Example: fetchLearnSkills().then(setLearnSkills);
    // For now, set static sample data
    // Uncomment below to see sample data on mount:
    // setLearnSkills(["React", "Data Science"]);
  }, []);

  return (
    <div className="mb-6">
      <label className="block font-semibold mb-1">I Want to Learn</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Add a learning interest (e.g. React)"
          value={learnSkillInput}
          onChange={e => setLearnSkillInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' ? (e.preventDefault(), handleAddLearnSkill()) : null}
        />
        <button type="button" onClick={handleAddLearnSkill} className="px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center gap-1">
          <span>➕</span> Add Learning Interest
        </button>
      </div>
      {/* List learning interests */}
      <div className="flex flex-wrap gap-2">
        {learnSkills.map((skill, idx) => (
          <span key={skill} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            {skill}
            <button type="button" onClick={() => handleRemoveLearnSkill(idx)} className="ml-1 text-red-500 hover:text-red-700 text-xs font-semibold">✕</button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default SkillsLearnSection;

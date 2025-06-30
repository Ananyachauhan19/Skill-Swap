import React, { useEffect } from "react";

const SkillsTeachSection = ({ teachSkillInput, setTeachSkillInput, teachSkills, handleAddTeachSkill, handleAttachProof, handleRemoveTeachSkill }) => {
  // Simulate fetching skills from backend
  useEffect(() => {
    // Example: fetchTeachSkills().then(setTeachSkills);
    
    setTeachSkillInput("");
    // Uncomment below to see sample data on mount:
    // setTeachSkills([
    //   { skill: "Python", proof: null, proofName: null },
    //   { skill: "Maths", proof: null, proofName: null },
    // ]);
  }, []);

  return (
    <div className="mb-6">
      <label className="block font-semibold mb-1">I Can Teach</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Add a teaching skill (e.g. Python)"
          value={teachSkillInput}
          onChange={e => setTeachSkillInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' ? (e.preventDefault(), handleAddTeachSkill()) : null}
        />
        <button type="button" onClick={handleAddTeachSkill} className="px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center gap-1">
          <span>➕</span> Add Teaching Skill
        </button>
      </div>
      {/* List teaching skills with proof upload */}
      <div className="space-y-2">
        {teachSkills.map((s, idx) => (
          <div key={s.skill} className="flex flex-col sm:flex-row sm:items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <span className="font-medium text-blue-700">{s.skill}</span>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <span className="text-blue-500">📁</span> Attach Document
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                className="hidden"
                onChange={e => handleAttachProof(idx, e.target.files[0])}
              />
            </label>
            {s.proofName && <span className="text-xs text-green-600 ml-2">{s.proofName}</span>}
            <button type="button" onClick={() => handleRemoveTeachSkill(idx)} className="ml-auto text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillsTeachSection;

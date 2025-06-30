import React, { useEffect } from "react";

const SkillsTeachSection = ({ teachSkillInput, setTeachSkillInput, teachSkills, handleAddTeachSkill, handleAttachProof, handleRemoveTeachSkill, editMode, onAddClick, onSave, onCancel, autoFocus }) => {
  // Simulate fetching skills from backend
  useEffect(() => {
    setTeachSkillInput("");
  }, []);

  return (
    <div className="mb-6 group relative">
      <label className="block font-semibold mb-1">I Can Teach</label>
      {editMode ? (
        <>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Add a teaching skill (e.g. Python)"
              value={teachSkillInput}
              onChange={e => setTeachSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' ? (e.preventDefault(), handleAddTeachSkill()) : null}
              readOnly={!editMode}
              autoFocus={autoFocus}
            />
            <button type="button" onClick={handleAddTeachSkill} className="px-3 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 flex items-center gap-1" disabled={!editMode}>
              <span>➕</span> Add Teaching Skill
            </button>
          </div>
          <div className="space-y-2">
            {teachSkills.map((s, idx) => (
              <div key={s.skill} className="flex flex-col sm:flex-row sm:items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
                <span className="font-medium text-blue-700">{s.skill}</span>
                <label className={`flex items-center gap-1 text-sm ${!editMode ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <span className="text-blue-500">📁</span> Attach Document
                  <input
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={editMode ? (e => handleAttachProof(idx, e.target.files[0])) : undefined}
                    disabled={!editMode}
                  />
                </label>
                {s.proofName && <span className="text-xs text-green-600 ml-2">{s.proofName}</span>}
                <button type="button" onClick={() => handleRemoveTeachSkill(idx)} className="ml-auto text-red-500 hover:text-red-700 text-xs font-semibold" disabled={!editMode}>Remove</button>
              </div>
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
          {teachSkills.length === 0 ? (
            <button
              className="text-blue-600 underline text-sm hover:text-blue-800 p-0 m-0 bg-transparent border-none outline-none"
              onClick={onAddClick}
              type="button"
            >
              + Add Teaching Skill
            </button>
          ) : (
            <div className="space-y-2">
              {teachSkills.map((s, idx) => (
                <div key={s.skill} className="flex flex-col sm:flex-row sm:items-center gap-2 border-none bg-transparent px-0 py-0">
                  <span className="font-medium text-blue-700">{s.skill}</span>
                  {s.proofName && <span className="text-xs text-green-600 ml-2">{s.proofName}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsTeachSection;

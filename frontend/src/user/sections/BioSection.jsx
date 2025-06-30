import React from "react";

const BioSection = ({ bio, setBio, editMode, onAddClick, onSave, onCancel, autoFocus }) => (
  <div className="mb-6 group relative">
    <label className="block font-semibold mb-1">Tell Us About Yourself</label>
    {editMode ? (
      <>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px]"
          placeholder="Add a short description about your experience, interests, or motivation."
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={500}
          autoFocus={autoFocus}
        />
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
        <div className="text-xs text-gray-500 text-right mt-1">{bio.length}/500</div>
      </>
    ) : (
      <div className="w-full min-h-[80px] text-gray-700 text-base px-1 py-2">
        {bio ? (
          <span>{bio}</span>
        ) : (
          <button
            className="text-blue-600 underline text-sm hover:text-blue-800 p-0 m-0 bg-transparent border-none outline-none"
            onClick={onAddClick}
            type="button"
          >
            + Add About
          </button>
        )}
      </div>
    )}
  </div>
);

export default BioSection;

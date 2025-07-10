import React from 'react';
import { Edit2, Save, XCircle } from 'lucide-react';

// Add a prop for onSaveEdit to trigger backend update
const AboutSection = ({ profile, editingField, fieldDraft, setFieldDraft, startEdit, saveEdit, cancelEdit, onSaveEdit }) => {
  const handleSave = () => {
    saveEdit('bio');
    if (onSaveEdit) onSaveEdit({ ...profile, bio: fieldDraft.bio });
  };
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8 mb-2`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-2">About</h3>
        {editingField !== 'bio' && (
          <button onClick={() => startEdit('bio')} className="text-blue-600 hover:text-blue-800"><Edit2 size={16}/></button>
        )}
      </div>
      {editingField === 'bio' ? (
        <div className="flex gap-2 items-center">
          <textarea
            className="w-full border border-blue-300 rounded-md p-2 text-gray-700 focus:outline-none focus:border-blue-600 min-h-[60px] bg-blue-50 shadow-sm"
            value={fieldDraft.bio}
            onChange={e => setFieldDraft(d => ({ ...d, bio: e.target.value }))}
            placeholder="Write something about yourself..."
          />
          <button onClick={handleSave} className="text-green-600 hover:text-green-800"><Save size={18}/></button>
          <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600"><XCircle size={18}/></button>
        </div>
      ) : (
        <p className="text-gray-700 text-sm sm:text-base">{profile.bio || <span className="text-gray-400">Not added yet</span>}</p>
      )}
    </div>
  );
};

export default AboutSection;

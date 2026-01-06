import React from 'react';
import { Edit2, Save, XCircle } from 'lucide-react';

// Add a prop for onSaveEdit to trigger backend update
const AboutSection = ({ profile, editingField, fieldDraft, setFieldDraft, startEdit, saveEdit, cancelEdit, onSaveEdit }) => {
  const handleSave = () => {
    saveEdit('bio');
    if (onSaveEdit) onSaveEdit({ ...profile, bio: fieldDraft.bio });
  };
  return (
    <div className="bg-transparent rounded-2xl border border-blue-100 p-4 sm:p-6 mt-3">
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="text-base font-semibold text-blue-900">About</h3>
        {editingField !== 'bio' && (
          <button onClick={() => startEdit('bio')} className="text-blue-600 hover:text-blue-800"><Edit2 size={16}/></button>
        )}
      </div>
      {editingField === 'bio' ? (
        <div className="flex gap-2 items-start">
          <textarea
            className="w-full border border-blue-200 rounded-xl p-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[72px] bg-blue-50/70"
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

import React from 'react';
import { Edit2, Save, XCircle, Linkedin } from 'lucide-react';

const SocialLinksSection = ({ profile, editingField, fieldDraft, setFieldDraft, startEdit, saveEdit, cancelEdit, onSaveEdit }) => {
  const handleSave = () => {
    saveEdit('links');
    if (onSaveEdit) onSaveEdit({ ...profile, ...fieldDraft });
  };
  return (
    <div className="bg-transparent rounded-2xl border border-blue-100 p-4 sm:p-6 mt-3">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-semibold text-blue-900">Social Links</h3>
        {editingField !== 'links' && (
          <button onClick={() => startEdit('links')} className="text-blue-600 hover:text-blue-800"><Edit2 size={16}/></button>
        )}
      </div>
      {editingField === 'links' ? (
        <div className="flex flex-col gap-2">
          <input
            className="border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/70 px-2 py-1.5 rounded-xl text-sm text-gray-800"
            value={fieldDraft.linkedin}
            onChange={e => setFieldDraft(d => ({ ...d, linkedin: e.target.value }))}
            placeholder="LinkedIn username"
          />
          <input
            className="border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/70 px-2 py-1.5 rounded-xl text-sm text-gray-800"
            value={fieldDraft.github}
            onChange={e => setFieldDraft(d => ({ ...d, github: e.target.value }))}
            placeholder="GitHub username"
          />
          <input
            className="border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/70 px-2 py-1.5 rounded-xl text-sm text-gray-800"
            value={fieldDraft.twitter}
            onChange={e => setFieldDraft(d => ({ ...d, twitter: e.target.value }))}
            placeholder="Twitter username"
          />
          <input
            className="border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/70 px-2 py-1.5 rounded-xl text-sm text-gray-800"
            value={fieldDraft.website}
            onChange={e => setFieldDraft(d => ({ ...d, website: e.target.value }))}
            placeholder="Website URL"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSave} className="bg-green-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1"><Save size={16}/>Save</button>
            <button onClick={cancelEdit} className="bg-gray-200 text-gray-800 text-sm px-3 py-1.5 rounded-lg hover:bg-gray-300 flex items-center gap-1"><XCircle size={16}/>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 text-sm text-gray-800">
          <div className="flex items-center gap-3">
            <Linkedin size={16} className="text-blue-900" />
            {profile.linkedin ? (
              <a href={`https://linkedin.com/in/${profile.linkedin}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.linkedin}</a>
            ) : <span className="text-gray-400">Not added</span>}
          </div>
          <div className="flex items-center gap-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.66 8.84 8.36 9.74.61.11.84-.26.84-.58v-2.02c-3.4.74-4.12-1.64-4.12-1.64-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.78.42-1.3.76-1.6-2.71-.31-5.56-1.36-5.56-6.06 0-1.34.47-2.44 1.23-3.3-.12-.31-.53-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.69.24 2.94.12 3.25.77.86 1.23 1.96 1.23 3.3 0 4.71-2.86 5.75-5.58 6.06.43.37.81 1.1.81 2.22v3.29c0 .32.23.7.85.58C18.34 20.84 22 16.84 22 12c0-5.52-4.48-10-10-10z" fill="#1e40af"/></svg>
            {profile.github ? (
              <a href={`https://github.com/${profile.github}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.github}</a>
            ) : <span className="text-gray-400">Not added</span>}
          </div>
          <div className="flex items-center gap-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.47.69a4.3 4.3 0 0 0 1.88-2.37 8.59 8.59 0 0 1-2.72 1.04A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.38 1.64 4.7c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.82 1.92 3.6-.7-.02-1.36-.21-1.94-.53v.05c0 2.1 1.5 3.85 3.5 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.7 2.1 2.94 3.95 2.97A8.6 8.6 0 0 1 2 19.54c-.63 0-1.25-.04-1.86-.11A12.13 12.13 0 0 0 6.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 22.46 6z" fill="#1e40af"/></svg>
            {profile.twitter ? (
              <a href={`https://twitter.com/${profile.twitter}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.twitter}</a>
            ) : <span className="text-gray-400">Not added</span>}
          </div>
          <div className="flex items-center gap-3">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.84 3.66 8.84 8.36 9.74.61.11.84-.26.84-.58v-2.02c-3.4.74-4.12-1.64-4.12-1.64-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.74.08-.74 1.2.08 1.83 1.23 1.83 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.78.42-1.3.76-1.6-2.71-.31-5.56-1.36-5.56-6.06 0-1.34.47-2.44 1.23-3.3-.12-.31-.53-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.01 2.05.14 3 .4 2.29-1.55 3.3-1.23 3.3-1.23.65 1.69.24 2.94.12 3.25.77.86 1.23 1.96 1.23 3.3 0 4.71-2.86 5.75-5.58 6.06.43.37.81 1.1.81 2.22v3.29c0 .32.23.7.85.58C18.34 20.84 22 16.84 22 12c0-5.52-4.48-10-10-10z" fill="#1e40af"/></svg>
            {profile.website ? (
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} className="hover:underline" target="_blank" rel="noopener noreferrer">{profile.website}</a>
            ) : <span className="text-gray-400">Not added</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialLinksSection;

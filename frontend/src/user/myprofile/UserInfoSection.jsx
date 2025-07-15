import React from 'react';
import { Edit2, Save, XCircle, Plus, Trash2 } from 'lucide-react';
import { STATIC_COURSES, STATIC_UNITS, STATIC_TOPICS } from '../../constants/teachingData';

const UserInfoSection = ({ profile, editingField, fieldDraft, startEdit, saveEdit, cancelEdit, handleArrayChange, handleArrayAdd, handleArrayRemove, handleTeachProofUpload, handleCertFileUpload, teachProofs, certFiles, onSaveEdit }) => {
  const handleSave = () => {
    // Create updated profile with current changes
    const updatedProfile = {
      ...profile,
      ...fieldDraft,
      // Only skillsToTeach is included now
      skillsToTeach: fieldDraft.skillsToTeach || profile.skillsToTeach || [],
    };
    
    console.log('UserInfoSection - Saving profile with skills:', {
      fieldDraft: fieldDraft,
      profile: profile,
      updatedProfile: updatedProfile,
      skillsToTeach: updatedProfile.skillsToTeach,
    });
    
    // Call the parent's save function
    if (onSaveEdit) {
      onSaveEdit(updatedProfile);
    }
    
    // Exit edit mode
    cancelEdit();
  };
  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-8 flex flex-col md:flex-row gap-4 sm:gap-8 items-center mb-2`}>
      <div className="flex-1 flex flex-col gap-2 w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-blue-900 text-lg">User Info</div>
          {editingField !== 'userInfo' && (
            <button onClick={() => startEdit('userInfo')} className="text-blue-600 hover:text-blue-800"><Edit2 size={18}/></button>
          )}
        </div>
        {editingField === 'userInfo' ? (
          <>
            {/* Certificates */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Certificates:</div>
              <div className="flex flex-col gap-2 bg-blue-50 p-2 rounded-md border border-blue-200">
                {(profile.certificates || []).map((cert, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-24"
                      value={typeof cert === 'string' ? cert : cert.name || ''}
                      onChange={e => handleArrayChange('certificates', i, e.target.value, typeof cert === 'string' ? undefined : 'name')}
                      placeholder="Certificate Name"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-20"
                      value={typeof cert === 'object' ? (cert.issuer || '') : ''}
                      onChange={e => handleArrayChange('certificates', i, e.target.value, 'issuer')}
                      placeholder="Issuer"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-12"
                      value={typeof cert === 'object' ? (cert.year || '') : ''}
                      onChange={e => handleArrayChange('certificates', i, e.target.value, 'year')}
                      placeholder="Year"
                    />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={e => handleCertFileUpload(i, e.target.files[0])}
                      className="text-xs"
                    />
                    {certFiles[i]?.file && (
                      <a href={certFiles[i].url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline text-xs">View Cert</a>
                    )}
                    <button onClick={() => handleArrayRemove('certificates', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('certificates', { name: '', issuer: '', year: '' })} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"><Plus size={14}/>Add Certificate</button>
              </div>
            </div>
            {/* What I Can Teach */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">What I Can Teach:</div>
              <div className="flex flex-col gap-2">
                {(fieldDraft.skillsToTeach || profile.skillsToTeach || []).map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={s.subject || ''}
                      onChange={e => handleArrayChange('skillsToTeach', i, e.target.value, 'subject')}
                      required
                    >
                      <option value="">Select Subject</option>
                      {STATIC_COURSES.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                    </select>
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={s.topic || ''}
                      onChange={e => handleArrayChange('skillsToTeach', i, e.target.value, 'topic')}
                      required
                      disabled={!s.subject}
                    >
                      <option value="">Select Topic</option>
                      {(STATIC_UNITS[s.subject] || []).map(topic => <option key={topic} value={topic}>{topic}</option>)}
                    </select>
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={s.subtopic || ''}
                      onChange={e => handleArrayChange('skillsToTeach', i, e.target.value, 'subtopic')}
                      required
                      disabled={!s.topic}
                    >
                      <option value="">Select Subtopic</option>
                      {(STATIC_TOPICS[s.topic] || []).map(subtopic => <option key={subtopic} value={subtopic}>{subtopic}</option>)}
                    </select>
                    <button onClick={() => handleArrayRemove('skillsToTeach', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('skillsToTeach', { subject: '', topic: '', subtopic: '' })} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"><Plus size={14}/>Add Skill</button>
              </div>
            </div>
            {/* Experience */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Experience:</div>
              <div className="flex flex-col gap-2">
                {(profile.experience || []).map((exp, i) => (
                  <div key={i} className="flex gap-2 items-center flex-wrap">
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-20"
                      value={typeof exp === 'string' ? exp : exp.title || ''}
                      onChange={e => handleArrayChange('experience', i, e.target.value, typeof exp === 'string' ? undefined : 'title')}
                      placeholder="Title"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-20"
                      value={typeof exp === 'object' ? (exp.company || '') : ''}
                      onChange={e => handleArrayChange('experience', i, e.target.value, 'company')}
                      placeholder="Company"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-16"
                      value={typeof exp === 'object' ? (exp.duration || '') : ''}
                      onChange={e => handleArrayChange('experience', i, e.target.value, 'duration')}
                      placeholder="Duration"
                    />
                    <input
                      className="border-b border-blue-200 focus:outline-none focus:border-blue-600 bg-blue-50 px-1 py-0.5 rounded text-xs w-32"
                      value={typeof exp === 'object' ? (exp.description || '') : ''}
                      onChange={e => handleArrayChange('experience', i, e.target.value, 'description')}
                      placeholder="Description"
                    />
                    <button onClick={() => handleArrayRemove('experience', i)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                  </div>
                ))}
                <button onClick={() => handleArrayAdd('experience', { title: '', company: '', duration: '', description: '' })} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"><Plus size={14}/>Add Experience</button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"><Save size={16}/>Save</button>
              <button onClick={cancelEdit} className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400 flex items-center gap-1"><XCircle size={16}/>Cancel</button>
            </div>
          </>
        ) : (
          <>
            {/* Certificates */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Certificates:</div>
              <ul className="flex flex-wrap gap-2">
                {profile.certificates && profile.certificates.length > 0 ? (
                  profile.certificates.map((cert, i) => {
                    if (typeof cert === 'string') {
                      return (
                        <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                          {cert}
                          {certFiles[i]?.file && (
                            <a href={certFiles[i].url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-700 underline text-xs">Cert</a>
                          )}
                        </li>
                      );
                    } else if (cert && typeof cert === 'object') {
                      const { name, issuer, year } = cert;
                      return (
                        <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                          {name ? name : ''}{issuer ? ` by ${issuer}` : ''}{year ? ` (${year})` : ''}
                          {certFiles[i]?.file && (
                            <a href={certFiles[i].url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-700 underline text-xs">Cert</a>
                          )}
                        </li>
                      );
                    } else {
                      return null;
                    }
                  })
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </ul>
            </div>
            {/* What I Can Teach */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">What I Can Teach:</div>
              <ul className="flex flex-wrap gap-2">
                {(profile.skillsToTeach || []).length > 0 ? (
                  (profile.skillsToTeach || []).map((s, i) => (
                    <li key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                      {s.subject} {s.topic ? `> ${s.topic}` : ''} {s.subtopic ? `> ${s.subtopic}` : ''}
                    </li>
                  ))
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </ul>
            </div>
            {/* Experience */}
            <div className="mt-2">
              <div className="font-semibold text-blue-900 mb-1">Experience:</div>
              <ul className="list-disc list-inside text-gray-700 text-sm">
                {profile.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp, i) => {
                    if (typeof exp === 'string') {
                      return <li key={i}>{exp}</li>;
                    } else if (exp && typeof exp === 'object') {
                      const { title, company, duration, description } = exp;
                      return (
                        <li key={i}>
                          {title ? <span className="font-semibold">{title}</span> : null}
                          {company ? ` at ${company}` : ''}
                          {duration ? ` (${duration})` : ''}
                          {description ? `: ${description}` : ''}
                        </li>
                      );
                    } else {
                      return null;
                    }
                  })
                ) : (
                  <div className="text-gray-400">Not added yet</div>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserInfoSection;

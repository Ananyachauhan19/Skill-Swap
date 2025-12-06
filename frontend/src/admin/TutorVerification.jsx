import React, { useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

// Single tutor application detail panel. Expects a selected application passed from parent.
export default function TutorVerification({ selected }) {
  const [actionLoading, setActionLoading] = useState(false);
  if (!selected) return <div className="p-4 text-sm text-gray-500">No tutor application selected.</div>;

  // Support data coming either directly on object or nested under tutorApplication
  const tutorApp = selected.tutorApplication || selected;
  const user = tutorApp.user || selected.user || {};
  const isSkillsUpdate = tutorApp.applicationType === 'skills-update';
  const approvedSkills = Array.isArray(user?.skillsToTeach) ? user.skillsToTeach : [];

  const approve = async (id) => {
    if (!window.confirm('Approve this tutor application?')) return;
    try {
      setActionLoading(true);
      await axios.put(`${BACKEND_URL}/api/admin/tutor/applications/${id}/approve`, {}, { withCredentials: true });
      // Optimistic UI update
      tutorApp.status = 'approved';
    } catch (e) {
      alert(e.response?.data?.message || 'Approve failed');
    } finally { setActionLoading(false); }
  };

  const reject = async (id) => {
    const reason = prompt('Rejection reason (optional)') || '';
    try {
      setActionLoading(true);
      await axios.put(`${BACKEND_URL}/api/admin/tutor/applications/${id}/reject`, { reason }, { withCredentials: true });
      tutorApp.status = 'rejected';
      tutorApp.rejectionReason = reason;
    } catch (e) {
      alert(e.response?.data?.message || 'Reject failed');
    } finally { setActionLoading(false); }
  };

  // No countdown anymore; activation is immediate on approval

  const statusClass = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    reverted: 'bg-purple-100 text-purple-700'
  }[tutorApp.status] || 'bg-gray-100 text-gray-700';

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Tutor Verification
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}>{tutorApp.status}</span>
          {isSkillsUpdate && (
            <span className="px-2 py-1 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-700" title="Updated skills Approval Request">
              Updated skills Approval Request
            </span>
          )}
        </h2>
        <p className="text-xs text-gray-500">Only selected tutor application is shown here.</p>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded p-3 text-xs">
          <div className="font-medium text-gray-700 mb-1">Profile</div>
          <div><span className="font-semibold">Username:</span> {user.username}</div>
          <div><span className="font-semibold">Email:</span> {user.email}</div>
          {tutorApp.status === 'approved' && !user.isTutor && (
            <div className="text-[11px] text-green-600 mt-1">Verified</div>
          )}
          {tutorApp.status === 'approved' && user.isTutor && (
            <div className="text-[11px] text-green-600 mt-1">Tutor active</div>
          )}
          {tutorApp.status === 'reverted' && (
            <div className="text-[11px] text-purple-600 mt-1 font-medium">
              ⚠️ User unregistered as tutor - All data preserved for audit trail
            </div>
          )}
          {tutorApp.status === 'rejected' && tutorApp.rejectionReason && (
            <div className="text-[11px] text-red-600 mt-1" title={tutorApp.rejectionReason}>Reason: {tutorApp.rejectionReason}</div>
          )}
        </div>
        <div className="bg-white border rounded-lg p-3 text-xs shadow-sm">
          <div className="font-medium text-gray-700 mb-1">Education</div>
          <div>{tutorApp.educationLevel} • {tutorApp.institutionName} • {tutorApp.classOrYear}</div>
        </div>
        <div className="bg-white border rounded-lg p-3 text-xs shadow-sm">
          <div className="font-medium text-gray-700 mb-2 flex items-center gap-2">
            {tutorApp.status === 'reverted' ? 'Previously Approved Skills (Before Unregister)' : 'Skills in Application'} 
            <span className="text-gray-400">({tutorApp.skills?.length || 0})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {tutorApp.skills && tutorApp.skills.map((s,i)=>(
              <span key={i} className={`text-[11px] px-2 py-0.5 rounded ${
                tutorApp.status === 'reverted' 
                  ? 'bg-purple-50 border border-purple-200' 
                  : 'bg-indigo-50 border border-indigo-200'
              }`}>
                {s.class} • {s.subject} : {s.topic === 'ALL' ? 'ALL Topics' : s.topic}
              </span>
            ))}
            {(!tutorApp.skills || tutorApp.skills.length===0) && <span className="text-[11px] text-gray-400">No skills</span>}
          </div>
        </div>
        {tutorApp.status !== 'reverted' && (
          <div className="bg-white border rounded-lg p-3 text-xs shadow-sm">
            <div className="font-medium text-gray-700 mb-2 flex items-center gap-2">Currently Approved Skills <span className="text-gray-400">({approvedSkills.length})</span></div>
            <div className="flex flex-wrap gap-1">
              {approvedSkills.map((s,i)=>(
                <span key={i} className="text-[11px] bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                  {s.class} • {s.subject} : {s.topic === 'ALL' ? 'ALL Topics' : s.topic}
                </span>
              ))}
              {approvedSkills.length === 0 && <span className="text-[11px] text-gray-400">No approved skills</span>}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 text-xs">
          <div className="font-medium text-gray-700">Submitted Documents</div>
          <div className="flex flex-wrap gap-3">
            {(Array.isArray(tutorApp.marksheetUrls) ? tutorApp.marksheetUrls : (tutorApp.marksheetUrl ? [tutorApp.marksheetUrl] : [])).map((u, i) => (
              <a key={`m-${i}`} href={u} target="_blank" rel="noreferrer" className="text-blue-600 underline">Marksheet #{i+1}</a>
            ))}
            {(Array.isArray(tutorApp.videoUrls) ? tutorApp.videoUrls : (tutorApp.videoUrl ? [tutorApp.videoUrl] : [])).map((u, i) => (
              <a key={`v-${i}`} href={u} target="_blank" rel="noreferrer" className="text-blue-600 underline">Video #{i+1}</a>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          {tutorApp.status === 'pending' && (
            <>
              <button disabled={actionLoading} onClick={() => approve(tutorApp._id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50">Approve</button>
              <button disabled={actionLoading} onClick={() => reject(tutorApp._id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded disabled:opacity-50">Reject</button>
            </>
          )}
          {tutorApp.status === 'approved' && !user.isTutor && (
            <span className="text-[11px] text-gray-500">Activation pending sync</span>
          )}
          {tutorApp.status === 'approved' && user.isTutor && (
            <span className="text-[11px] text-green-600">Tutor active</span>
          )}
          {tutorApp.status === 'reverted' && (
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-purple-600 font-medium">User unregistered as tutor</span>
              <span className="text-[11px] text-gray-500">Application data preserved for audit trail</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

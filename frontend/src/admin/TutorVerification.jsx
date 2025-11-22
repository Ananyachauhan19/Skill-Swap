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

  const formatCountdown = (ts, isTutor) => {
    if (!ts || isTutor) return null;
    const diff = new Date(ts).getTime() - Date.now();
    if (diff <= 0) return 'Activating...';
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${String(s).padStart(2,'0')} remaining`;
  };
  const countdown = formatCountdown(user.tutorActivationAt, user.isTutor);

  const statusClass = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  }[tutorApp.status] || 'bg-gray-100 text-gray-700';

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Tutor Verification
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}>{tutorApp.status}</span>
        </h2>
        <p className="text-xs text-gray-500">Only selected tutor application is shown here.</p>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded p-3 text-xs">
          <div className="font-medium text-gray-700 mb-1">Profile</div>
          <div><span className="font-semibold">Username:</span> {user.username}</div>
          <div><span className="font-semibold">Email:</span> {user.email}</div>
          {tutorApp.status === 'approved' && !user.isTutor && countdown && (
            <div className="text-[11px] text-gray-500 mt-1">Activation countdown: {countdown}</div>
          )}
          {tutorApp.status === 'approved' && user.isTutor && (
            <div className="text-[11px] text-green-600 mt-1">Tutor active</div>
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
          <div className="font-medium text-gray-700 mb-2 flex items-center gap-2">Skills <span className="text-gray-400">({tutorApp.skills?.length || 0})</span></div>
          <div className="flex flex-wrap gap-1">
            {tutorApp.skills && tutorApp.skills.map((s,i)=>(
              <span key={i} className="text-[11px] bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">{s.subject} : {s.topic}</span>
            ))}
            {(!tutorApp.skills || tutorApp.skills.length===0) && <span className="text-[11px] text-gray-400">No skills</span>}
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          <a href={tutorApp.marksheetUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Marksheet</a>
          <a href={tutorApp.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">Video</a>
        </div>
        <div className="flex gap-2">
          {tutorApp.status === 'pending' && (
            <>
              <button disabled={actionLoading} onClick={() => approve(tutorApp._id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50">Approve</button>
              <button disabled={actionLoading} onClick={() => reject(tutorApp._id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded disabled:opacity-50">Reject</button>
            </>
          )}
          {tutorApp.status === 'approved' && !user.isTutor && countdown && (
            <span className="text-[11px] text-gray-500">Awaiting activation window</span>
          )}
          {tutorApp.status === 'approved' && user.isTutor && (
            <span className="text-[11px] text-green-600">Tutor active</span>
          )}
        </div>
      </div>
    </div>
  );
}

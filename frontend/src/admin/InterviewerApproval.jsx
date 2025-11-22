import React from 'react';

// Component dedicated to rendering interviewer expert application details
// Includes approve / reject actions when status is pending.
export default function InterviewerApproval({ selected, detailTab, setDetailTab, approve, reject, actionLoading }) {
  if (!selected) return null;

  const renderDetail = () => {
    switch (detailTab) {
      case 'profile':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                {selected.user?.profilePic ? <img className="w-full h-full object-cover" src={selected.user.profilePic} alt="avatar" /> : null}
              </div>
              <div>
                <div className="font-medium">{selected.name || `${selected.user?.firstName || ''} ${selected.user?.lastName || ''}`.trim() || selected.user?.username}</div>
                <div className="text-xs text-gray-600">{selected.user?.email}</div>
              </div>
            </div>
            <div>Country: <span className="font-medium">{selected.user?.country || '—'}</span></div>
            <div>Category: <span className="font-medium">Interview Expert</span></div>
            <div>Company: <span className="font-medium">{selected.company || '—'}</span></div>
            <div>Position: <span className="font-medium">{selected.position || '—'}</span></div>
            <div>Qualification: <span className="font-medium">{selected.qualification || '—'}</span></div>
            <div>Status: <span className="font-medium">{selected.status}</span></div>
          </div>
        );
      case 'education':
        return (
          <div className="space-y-2">
            {(selected.user?.education || []).length === 0 && (
              <div className="text-gray-500">No education records.</div>
            )}
            {(selected.user?.education || []).map((e, idx) => (
              <div key={idx} className="border rounded p-2">
                <div className="font-medium">{e.course || 'Course'} {e.branch ? `• ${e.branch}` : ''}</div>
                <div className="text-xs text-gray-600">{e.college || '—'} {e.city ? `• ${e.city}` : ''} {e.passingYear ? `• ${e.passingYear}` : ''}</div>
              </div>
            ))}
          </div>
        );
      case 'experience':
        return (
          <div className="space-y-2">
            {(selected.user?.experience || []).length === 0 && (
              <div className="text-gray-500">No experience records.</div>
            )}
            {(selected.user?.experience || []).map((e, idx) => (
              <div key={idx} className="border rounded p-2">
                <div className="font-medium">{e.company || 'Company'} {e.position ? `• ${e.position}` : ''}</div>
                <div className="text-xs text-gray-600">{e.duration || ''}</div>
                {e.description && <div className="text-xs text-gray-700 mt-1">{e.description}</div>}
              </div>
            ))}
          </div>
        );
      case 'certificates':
        return (
          <div className="space-y-2">
            {(selected.user?.certificates || []).length === 0 && (
              <div className="text-gray-500">No certificates.</div>
            )}
            {(selected.user?.certificates || []).map((c, idx) => (
              <div key={idx} className="border rounded p-2">
                <div className="font-medium">{c.name || 'Certificate'} {c.issuer ? `• ${c.issuer}` : ''}</div>
                <div className="text-xs text-gray-600">{c.date || ''}</div>
                {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View</a>}
              </div>
            ))}
          </div>
        );
      case 'resume':
        return (
          <div className="space-y-2">
            {selected.resumeUrl ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const raw = selected.resumeUrl;
                    // Fallback: prepend origin if relative path (e.g. /uploads/resumes/...)
                    const href = /^(https?:)?\/\//i.test(raw) ? raw : `${window.location.origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
                    try {
                      window.open(href, '_blank', 'noopener,noreferrer');
                    } catch (_) {}
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Opens resume in a new tab"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7v7M10 14L21 3M5 21h14a2 2 0 002-2V9"/></svg>
                  Open Resume
                </button>
                <p className="text-xs text-gray-500 break-all">{selected.resumeUrl}</p>
              </>
            ) : (
              <div className="text-gray-500">No resume provided.</div>
            )}
          </div>
        );
      case 'activity':
        return (
          <div className="space-y-2">
            <div>Total Past Interviews: <span className="font-medium">{typeof selected.totalPastInterviews === 'number' ? selected.totalPastInterviews : '—'}</span></div>
            <div>Average Rating: <span className="font-medium">{typeof selected.averageRating === 'number' ? selected.averageRating : '—'}</span></div>
            <div>Total Ratings: <span className="font-medium">{typeof selected.totalRatings === 'number' ? selected.totalRatings : '—'}</span></div>
            <div>Conducted Interviews: <span className="font-medium">{typeof selected.conductedInterviews === 'number' ? selected.conductedInterviews : '—'}</span></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b bg-gradient-to-br from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 ring-2 ring-gray-200">
            {selected?.user?.profilePic ? (
              <img className="w-full h-full object-cover" src={selected.user.profilePic} alt="avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">{(selected?.name || selected?.user?.username || '?').charAt(0).toUpperCase()}</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 truncate">{selected?.name || `${selected?.user?.firstName || ''} ${selected?.user?.lastName || ''}`.trim() || selected?.user?.username}</div>
            <div className="text-sm text-gray-600 truncate mt-0.5">{selected?.user?.email}</div>
          </div>
        </div>
        <div className="mt-3">
          {selected?.status === 'pending' && <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Review</span>}
          {selected?.status === 'approved' && <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">Approved</span>}
          {selected?.status === 'rejected' && <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800">Rejected</span>}
        </div>
      </div>

      <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex flex-wrap gap-2">
          {['profile','education','experience','certificates','resume','activity'].map(t => (
            <button
              key={t}
              onClick={() => setDetailTab(t)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${detailTab===t ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}`}
            >{t.charAt(0).toUpperCase()+t.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5 text-sm overflow-y-auto flex-1">
        {renderDetail()}
      </div>

      {selected?.status === 'pending' && (
        <div className="px-6 py-5 border-t bg-gradient-to-br from-gray-50 to-white flex-shrink-0 flex gap-3">
          <button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            onClick={() => approve(selected._id)}
            disabled={!!actionLoading[selected._id]}
          >{actionLoading[selected._id] ? 'Approving…' : 'Approve Application'}</button>
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            onClick={() => reject(selected._id)}
            disabled={!!actionLoading[selected._id]}
          >{actionLoading[selected._id] ? 'Rejecting…' : 'Reject Application'}</button>
        </div>
      )}
    </div>
  );
}

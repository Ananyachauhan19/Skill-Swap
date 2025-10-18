import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function InterviewerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const { user } = useAuth() || {};

  const loadApplications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/applications`, { credentials: 'include' });
      if (!res.ok) return setApplications([]);
      const data = await res.json();
      setApplications(data || []);
    } catch (e) {
      console.error('failed to load apps', e);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApplications(); }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Interviewer Applications</h2>
      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app._id} className="border rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 flex-shrink-0">
                {app.user?.profilePic ? (
                  <img src={app.user.profilePic} alt={app.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{(app.name || '?').charAt(0)}</div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{app.name} {app.user?.username ? <span className="text-sm text-gray-500">({app.user.username})</span> : null}</div>
                    <div className="text-sm text-gray-600">{app.user?.email}</div>
                  </div>
                  <div className="text-right">
                    <div>
                      {app.status === 'pending' && <span className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">Pending</span>}
                      {app.status === 'approved' && <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">Approved</span>}
                      {app.status === 'rejected' && <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full">Rejected</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-700">Company: <span className="font-medium">{app.company || '—'}</span> • Position: <span className="font-medium">{app.position || '—'}</span></div>
                <div className="mt-1 text-sm text-gray-600">Qualification: {app.qualification || '—'} • Experience: {app.experience || '—'}</div>
                <div className="mt-3 flex items-center gap-3">
                  {app.resumeUrl && (
                    <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      View Resume
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {app.status === 'pending' ? (
                  <>
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                      onClick={async () => {
                        if (!window.confirm('Approve this application?')) return;
                        try {
                          setActionLoading(prev => ({ ...prev, [app._id]: true }));
                          const res = await fetch(`${BACKEND_URL}/api/interview/applications/${app._id}/approve`, { method: 'POST', credentials: 'include' });
                          let json = null; try { json = await res.json(); } catch (_) {}
                          if (!res.ok) throw new Error((json && json.message) || (await res.text()) || 'approve failed');
                          setApplications(prev => prev.map(p => p._id === app._id ? { ...p, status: 'approved' } : p));
                          alert('Application approved');
                          loadApplications();
                        } catch (e) { console.error(e); alert(e.message || 'Failed'); }
                        finally { setActionLoading(prev => ({ ...prev, [app._id]: false })); }
                      }}
                      disabled={!!actionLoading[app._id]}
                    >{actionLoading[app._id] ? 'Approving...' : 'Approve'}</button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
                      onClick={async () => {
                        if (!window.confirm('Reject this application?')) return;
                        try {
                          setActionLoading(prev => ({ ...prev, [app._id]: true }));
                          const res = await fetch(`${BACKEND_URL}/api/interview/applications/${app._id}/reject`, { method: 'POST', credentials: 'include' });
                          let json = null; try { json = await res.json(); } catch (_) {}
                          if (!res.ok) throw new Error((json && json.message) || (await res.text()) || 'reject failed');
                          setApplications(prev => prev.map(p => p._id === app._id ? { ...p, status: 'rejected' } : p));
                          alert('Application rejected');
                          loadApplications();
                        } catch (e) { console.error(e); alert(e.message || 'Failed'); }
                        finally { setActionLoading(prev => ({ ...prev, [app._id]: false })); }
                      }}
                      disabled={!!actionLoading[app._id]}
                    >{actionLoading[app._id] ? 'Processing...' : 'Reject'}</button>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">Handled</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

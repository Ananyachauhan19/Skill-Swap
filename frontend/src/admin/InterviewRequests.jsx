import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function InterviewRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignInput, setAssignInput] = useState({});
  const { user, loading: authLoading } = useAuth();

  const load = () => {
    // If current user is admin, fetch all requests. Otherwise fetch only the requests relevant to the user
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const isAdmin = user && user.email && adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase();

    const endpoint = isAdmin ? '/api/interview/all-requests' : '/api/interview/requests';

    fetch(`${BACKEND_URL}${endpoint}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        // normalize data shape: admin gets an array, non-admin gets { received, sent }
        if (isAdmin) {
          setRequests(data || []);
        } else {
          const received = (data && data.received) || [];
          const sent = (data && data.sent) || [];
          // combine for display but keep status of which side they are
          const combined = [
            ...received.map((r) => ({ ...r, _role: 'received' })),
            ...sent.map((r) => ({ ...r, _role: 'sent' })),
          ];
          setRequests(combined);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  // Wait for auth to resolve so we can decide admin vs user endpoint
  useEffect(() => {
    if (!authLoading) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Applications (admin only)
  const [applications, setApplications] = useState([]);
  const loadApplications = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/applications`, { credentials: 'include' });
      if (!res.ok) return setApplications([]);
      const data = await res.json();
      setApplications(data || []);
    } catch (e) {
      console.error('failed to load apps', e);
      setApplications([]);
    }
  };

  useEffect(() => {
    // load applications only if admin
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
    const isAdmin = user && user.email && adminEmail && user.email.toLowerCase() === adminEmail.toLowerCase();
    if (isAdmin) loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const assign = async (requestId) => {
    const username = assignInput[requestId];
    if (!username) return alert('Enter interviewer username');

    try {
      const res = await fetch(`${BACKEND_URL}/api/interview/assign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, interviewerUsername: username }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Assign failed');
      alert('Interviewer assigned');
      setAssignInput((s) => ({ ...s, [requestId]: '' }));
      load();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Interview Requests</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="py-2 px-4 border">User</th>
              <th className="py-2 px-4 border">Topic</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Assigned To</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req._id}>
                <td className="py-2 px-4 border">{req.requester?.username || req.requester?._id}</td>
                <td className="py-2 px-4 border">{req.topic || req.subject}</td>
                <td className="py-2 px-4 border">{req.status}{req._role ? ` (${req._role})` : ''}</td>
                <td className="py-2 px-4 border">{req.assignedInterviewer?.username || '-'}</td>
                <td className="py-2 px-4 border">
                  {/* Only admin can assign */}
                  {user && user.email && import.meta.env.VITE_ADMIN_EMAIL && user.email.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL.toLowerCase() && req.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <input
                        className="border px-2 py-1"
                        placeholder="interviewer username"
                        value={assignInput[req._id] || ''}
                        onChange={(e) => setAssignInput((s) => ({ ...s, [req._id]: e.target.value }))}
                      />
                      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => assign(req._id)}>Assign</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Admin: Manage interviewer applications on the dedicated page */}
      {user && user.email && import.meta.env.VITE_ADMIN_EMAIL && user.email.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL.toLowerCase() && (
        <div className="mt-8">
          <a className="text-blue-600 underline" href="/admin/applications">Go to Interviewer Applications</a>
        </div>
      )}
    </div>
  );
}

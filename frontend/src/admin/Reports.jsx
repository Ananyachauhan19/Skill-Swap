import React, { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('video');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open'); // open | resolved | all

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        params.set('type', activeTab);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const res = await fetch(`${BACKEND_URL}/api/admin/reports?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load reports');
        }
        const data = await res.json();
        setReports(Array.isArray(data.reports) ? data.reports : []);
      } catch (e) {
        setError(e.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTab, statusFilter]);

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/reports/${id}/resolve`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to mark as resolved');
      }
      const data = await res.json();
      setReports(prev => prev.map(r => (r._id === id ? data.report : r)));
    } catch (e) {
      setError(e.message || 'Failed to mark as resolved');
    }
  };

  const handleDeleteVideo = async (report) => {
    if (!report?.videoId) return;
    const confirm = window.confirm('Delete this video permanently? This cannot be undone.');
    if (!confirm) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/videos/${report.videoId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete video');
      }
      // Optionally mark the report as resolved after deletion
      await handleResolve(report._id);
    } catch (e) {
      setError(e.message || 'Failed to delete video');
    }
  };

  const handleDeleteAccount = async (report) => {
    if (!report?.reportedUserId) return;
    const confirm = window.confirm('Delete this user account permanently? This cannot be undone.');
    if (!confirm) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${report.reportedUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete user account');
      }
      // Mark the report as resolved after account deletion
      await handleResolve(report._id);
    } catch (e) {
      setError(e.message || 'Failed to delete user account');
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-4">Reports</h1>
      <p className="text-sm text-slate-600 mb-4">
        All reports submitted by users are sent to <span className="font-semibold">skillswaphubb@gmail.com</span> and listed here.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-3 py-1.5 rounded text-sm font-medium border ${
            activeTab === 'video'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
          onClick={() => setActiveTab('video')}
        >
          Video Reports
        </button>
        <button
          className={`px-3 py-1.5 rounded text-sm font-medium border ${
            activeTab === 'account'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
          onClick={() => setActiveTab('account')}
        >
          Account Reports
        </button>
        <div className="ml-auto flex gap-1 text-xs items-center">
          <span className="text-slate-500 mr-1 hidden sm:inline">Status:</span>
          <button
            className={`px-2 py-1 rounded border text-[11px] ${
              statusFilter === 'open'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
            onClick={() => setStatusFilter('open')}
          >
            Open
          </button>
          <button
            className={`px-2 py-1 rounded border text-[11px] ${
              statusFilter === 'resolved'
                ? 'bg-slate-700 text-white border-slate-700'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </button>
          <button
            className={`px-2 py-1 rounded border text-[11px] ${
              statusFilter === 'all'
                ? 'bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading...</div>}
      {error && !loading && (
        <div className="text-sm text-red-600 mb-3">{error}</div>
      )}

      {!loading && !error && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-200">
            <div className="col-span-3">Reporter</div>
            <div className="col-span-3">Target</div>
            <div className="col-span-3">Issues / Other Details</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-1 text-right pr-1">Type / Status</div>
          </div>
          {reports.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500">No reports found.</div>
          ) : (
            <ul className="divide-y divide-slate-100 text-xs sm:text-sm">
              {reports.map((r) => (
                <li key={r._id} className="grid grid-cols-12 gap-2 px-3 py-2">
                  <div className="col-span-3 truncate">
                    <div className="font-medium text-slate-900">{r.reporterEmail}</div>
                  </div>
                  <div className="col-span-3 truncate">
                    {r.type === 'video' ? (
                      <>
                        <div className="font-medium text-slate-900 truncate">{r.videoTitle || 'Video'}</div>
                        <div className="text-slate-500 text-[11px] truncate">Video ID: {r.videoId || '—'}</div>
                        {r.videoId && (
                          <button
                            onClick={() => handleDeleteVideo(r)}
                            className="mt-0.5 text-[11px] text-red-600 hover:underline"
                          >
                            Delete Video
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-slate-900 truncate">{r.reportedUsername || 'User'}</div>
                        <div className="text-slate-500 text-[11px] truncate">User ID: {r.reportedUserId || '—'}</div>
                        {r.reportedUserId && (
                          <button
                            onClick={() => handleDeleteAccount(r)}
                            className="mt-0.5 text-[11px] text-red-600 hover:underline"
                          >
                            Delete Account
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="col-span-3 truncate">
                    <div className="text-slate-700 text-[11px] sm:text-xs">
                      {Array.isArray(r.issues) && r.issues.length
                        ? r.issues.join(', ')
                        : '—'}
                    </div>
                    {r.otherDetails && (
                      <div className="mt-0.5 text-slate-500 text-[11px] sm:text-xs line-clamp-2">
                        Other: {r.otherDetails}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-slate-500 text-[11px] sm:text-xs">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                  </div>
                  <div className="col-span-1 text-right text-[11px] uppercase tracking-wide text-slate-500 space-y-1">
                    <div>{r.type}</div>
                    {r.resolved ? (
                      <div className="inline-flex items-center justify-end">
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                          Resolved
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleResolve(r._id)}
                        className="inline-flex items-center justify-end px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 text-[10px] hover:bg-amber-100"
                      >
                        Mark
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;

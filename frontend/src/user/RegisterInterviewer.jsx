import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const RegisterInterviewer = () => {
  const { user } = useAuth() || {};
  const navigate = useNavigate();
  const [name, setName] = useState(user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [experience, setExperience] = useState('');
  const [totalPastInterviews, setTotalPastInterviews] = useState(0);
  const [qualification, setQualification] = useState('');
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appLoading, setAppLoading] = useState(true);
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const fetchApp = async () => {
      try {
        setAppLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/interview/application`, { credentials: 'include' });
        if (!res.ok) { setApplication(null); return; }
        const data = await res.json();
        if (data) {
          setApplication(data);
          setName(data.name || name);
          setCompany(data.company || company);
          setPosition(data.position || position);
          setExperience(data.experience || experience);
          setTotalPastInterviews(data.totalPastInterviews || totalPastInterviews);
          setQualification(data.qualification || qualification);
        }
      } catch (e) {
        console.error('Failed to fetch existing application', e);
      } finally {
        setAppLoading(false);
      }
    };
    fetchApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!name) return alert('Please provide your name');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('company', company);
  form.append('position', position);
      form.append('experience', experience);
      form.append('totalPastInterviews', totalPastInterviews);
      form.append('qualification', qualification);
      if (resume) form.append('resume', resume);

      const response = await fetch(`${BACKEND_URL}/api/interview/apply`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      let json = null;
      try { json = await response.json(); } catch (_) { }
      if (!response.ok) throw new Error((json && json.message) || (await response.text()) || 'Failed to submit');
      alert('Application submitted. Await admin approval.');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Register as Interviewer</h2>
        {appLoading ? <div className="text-sm text-gray-600 mb-2">Checking application status...</div> : (
          application ? (
            <div className="mb-3">
              <span className={`px-2 py-1 rounded text-sm ${application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : application.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {application.status.toUpperCase()}
              </span>
              {application.resumeUrl && <a className="ml-3 text-sm text-blue-600 underline" href={application.resumeUrl} target="_blank" rel="noreferrer">View resume</a>}
            </div>
          ) : null
        )}
        <div className="grid grid-cols-1 gap-3">
          <input className="border px-3 py-2" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input className="border px-3 py-2" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
            <input className="border px-3 py-2" placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} />
          <input className="border px-3 py-2" placeholder="Experience (e.g. 5 years)" value={experience} onChange={e => setExperience(e.target.value)} />
          <input className="border px-3 py-2" type="number" placeholder="Total Past Interviews taken" value={totalPastInterviews} onChange={e => setTotalPastInterviews(e.target.value)} />
          <input className="border px-3 py-2" placeholder="Qualification" value={qualification} onChange={e => setQualification(e.target.value)} />
          <label className="text-sm text-gray-600">Upload Resume (PDF)</label>
          <input type="file" accept="application/pdf" onChange={e => setResume(e.target.files[0])} />
        </div>
        <div className="mt-4 flex justify-end">
          <button className="bg-blue-900 text-white px-4 py-2 rounded" onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterInterviewer;

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config.js';
import { toast } from 'react-hot-toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [valid, setValid] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${BACKEND_URL}/api/auth/password/verify?token=${encodeURIComponent(token||'')}`);
      const data = await res.json();
      setValid(!!data.valid);
      if (!data.valid) toast.error(data.message || 'Invalid or expired link');
    })();
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const res = await fetch(`${BACKEND_URL}/api/auth/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    if (res.ok) {
      toast.success('Password reset successful');
      navigate('/login');
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.message || 'Failed to reset');
    }
  };

  if (!valid) return <div className="p-6 text-center">Checking link…</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Set New Password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="password" placeholder="New password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full border rounded px-3 py-2" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Reset Password</button>
      </form>
    </div>
  );
}

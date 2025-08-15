import React, { useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config.js';
import { useNavigate } from 'react-router-dom';

export default function ProfileDropdown() {
  const navigate = useNavigate();

  async function signOutFromGoogle() {
    try {
      const userStr = Cookies.get('user') || localStorage.getItem('user') || '{}';
      const email = JSON.parse(userStr)?.email || localStorage.getItem('email') || '';

      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
        if (email) {
          await new Promise((resolve) => window.google.accounts.id.revoke(email, resolve));
        }
      } else if (window.gapi?.auth2) {
        const auth2 = window.gapi.auth2.getAuthInstance();
        if (auth2) {
          await auth2.signOut();
          auth2.disconnect();
        }
      }
    } catch {}
  }

  const handleLogout = async () => {
    // Ask backend to clear httpOnly cookie (if used)
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}

    // Revoke Google session
    await signOutFromGoogle();

    // Remove non-httpOnly cookies (fallback)
    try { Cookies.remove('token', { path: '/' }); } catch {}
    try { Cookies.remove('user',  { path: '/' }); } catch {}
    // If you set a custom domain when creating the cookie, pass it here too:
    // Cookies.remove('token', { path: '/', domain: '.yourdomain.com' });

    // Clear any local state/storage
    try { localStorage.removeItem('token'); } catch {}
    try { localStorage.removeItem('user'); } catch {}
    try {
      const api = (await import('../lib/api.js')).default;
      if (api?.defaults?.headers?.common?.Authorization) {
        delete api.defaults.headers.common.Authorization;
      }
    } catch {}

    navigate('/auth/login');
  };

  return (
    <div
      className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg z-50 flex flex-col p-4"
    >
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { navigate('/profile'); }}
      >
        Profile
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { navigate('/createSession'); }}
      >
        Schedule Sessions
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { navigate('/learning-history'); }}
      >
        Learning History
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { navigate('/teaching-history'); }}
      >
        Teaching History
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { navigate('/package'); }}
      >
        Purchase
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-blue-50 rounded"
        onClick={() => { navigate('/help'); }}
      >
        Help & Support
      </button>
      <button
        className="text-left px-4 py-2 hover:bg-red-50 text-red-600 rounded"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};
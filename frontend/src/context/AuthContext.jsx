import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear all authentication data
  const clearAuthData = () => {
    // Clear all cookies for all paths and domains
    const cookieNames = Object.keys(Cookies.get());
    cookieNames.forEach(cookieName => {
      Cookies.remove(cookieName, { path: '/', domain: window.location.hostname });
      Cookies.remove(cookieName, { path: '/' });
      Cookies.remove(cookieName);
    });
    localStorage.clear();
    sessionStorage.clear();
  };

  // Fetch authenticated user
  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/me', {
        withCredentials: true,
        headers: { 'Cache-Control': 'no-cache' }
      });
      const fetchedUser = response.data.user || null;
      setUser(fetchedUser);
      if (!fetchedUser) {
        clearAuthData();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      clearAuthData();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Handle authChanged event
  useEffect(() => {
    const handleAuthChange = async () => {
      clearAuthData();
      setUser(null);
      setLoading(true);
      await fetchUser(); // Revalidate to confirm no session
      window.dispatchEvent(new Event('authChanged')); // Ensure event loops
    };

    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  // Add this helper somewhere inside the AuthContext component/file
  async function signOutFromGoogle(userEmail) {
    // New Google Identity Services
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
        if (userEmail) {
          await new Promise((resolve) => window.google.accounts.id.revoke(userEmail, resolve));
        }
      } catch (_) {}
      return;
    }
    // Old gapi.auth2
    if (window.gapi?.auth2) {
      try {
        const auth2 = window.gapi.auth2.getAuthInstance();
        if (auth2) {
          await auth2.signOut();
          auth2.disconnect();
        }
      } catch (_) {}
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Attempt to sign out/revoke Google session
      const email = (typeof user === 'object' && user?.email) ? user.email : localStorage.getItem('email');
      await signOutFromGoogle(email);
    } finally {
      // Clear client tokens/state
      try { sessionStorage.removeItem('token'); } catch {}
      try { Cookies.remove('token'); } catch {}

      // If you set Authorization on an axios instance, clear it
      try {
        const { default: api } = await import('../lib/api.js');
        if (api?.defaults?.headers?.common?.Authorization) {
          delete api.defaults.headers.common.Authorization;
        }
      } catch {}

      // Update context state
      try { setUser(null); } catch {}
      try { setIsAuthenticated?.(false); } catch {}
      // Optionally navigate to login
      // navigate('/auth/login');
    }
  };

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, logout, fetchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
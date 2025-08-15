import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../lib/api';

// Ensure the context is a named export
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Optional helper to sign out from Google
async function signOutFromGoogle(userEmail) {
  if (window.google?.accounts?.id) {
    try {
      window.google.accounts.id.disableAutoSelect();
      if (userEmail) {
        await new Promise((resolve) => window.google.accounts.id.revoke(userEmail, resolve));
      }
    } catch (_) {}
    return;
  }
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      setIsAuthenticated(false);
      await fetchUser(); // Revalidate to confirm no session
      window.dispatchEvent(new Event('authChanged')); // Ensure event loops
    };

    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  const logout = async () => {
    try {
      const email = user?.email || localStorage.getItem('email') || '';
      await signOutFromGoogle(email);
      // If your backend clears httpOnly cookie
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        // no-op on failure
        await res?.text();
      } catch (_) {}
    } finally {
      try { localStorage.removeItem('token'); } catch {}
      try { localStorage.removeItem('user'); } catch {}
      try { localStorage.removeItem('email'); } catch {}
      try { sessionStorage.removeItem('token'); } catch {}
      try { Cookies.removeItem('email'); } catch {}


      // If you use a shared axios instance, clear its header
      try {
        const api = (await import('../lib/api.js')).default;
        if (api?.defaults?.headers?.common?.Authorization) {
          delete api.defaults.headers.common.Authorization;
        }
      } catch {}

      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, setIsAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook
export const useAuth = () => useContext(AuthContext);

// Keep default export if other files import it as default
export default AuthProvider;
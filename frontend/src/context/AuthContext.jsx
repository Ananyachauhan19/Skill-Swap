<<<<<<< HEAD

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';
||||||| 6cdbdab (s)
import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../lib/api';
=======
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
>>>>>>> parent of 6cdbdab (s)

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

<<<<<<< HEAD
  // Fetch user data on mount
||||||| 6cdbdab (s)
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
=======
>>>>>>> parent of 6cdbdab (s)
  useEffect(() => {
<<<<<<< HEAD
    api
      .get("/api/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Logout function to handle both backend and Google OAuth logout
  const logout = async () => {
    try {
      // Call backend logout endpoint
      await api.post("/api/auth/logout");
      
      // Clear Google OAuth session
      googleLogout();
      
      // Clear cookies
      Object.keys(Cookies.get()).forEach(cookieName => 
        Cookies.remove(cookieName, { path: '/', domain: window.location.hostname })
      );
      
      // Clear local and session storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Update auth state
      setUser(null);
      
      // Trigger authChanged event for other components
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

||||||| 6cdbdab (s)
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
        const res = await fetch(${import.meta.env.VITE_BACKEND_URL || ''}/api/auth/logout, {
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

=======
    api
      .get("/api/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

>>>>>>> parent of 6cdbdab (s)
  return (
<<<<<<< HEAD
    <AuthCtx.Provider value={{ user, loading, setUser, logout }}>
||||||| 6cdbdab (s)
    <AuthContext.Provider value={{ user, setUser, isAuthenticated, setIsAuthenticated, logout }}>
=======
    <AuthCtx.Provider value={{ user, loading, setUser }}>
>>>>>>> parent of 6cdbdab (s)
      {children}
    </AuthCtx.Provider>
  );
}

<<<<<<< HEAD
export const useAuth = () => useContext(AuthCtx);
||||||| 6cdbdab (s)
// Convenience hook
export const useAuth = () => useContext(AuthContext);

// Keep default export if other files import it as default
export default AuthProvider;
=======
export const useAuth = () => useContext(AuthCtx);


>>>>>>> parent of 6cdbdab (s)

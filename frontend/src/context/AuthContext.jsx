import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import api from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear all authentication data
  const clearAuthData = () => {
    // Clear cookies for all paths and domains
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
      // Only set cookie if user exists
      if (fetchedUser) {
        Cookies.set('user', JSON.stringify(fetchedUser), { path: '/', secure: true, sameSite: 'strict' });
      } else {
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
  }, []); // Removed location.pathname dependency

  // Handle authChanged event and force revalidation
  useEffect(() => {
    const handleAuthChange = async () => {
      clearAuthData();
      setUser(null);
      setLoading(true);
      await fetchUser(); // Revalidate backend session
    };

    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  // Logout function
  const logout = async () => {
    try {
      await api.post('/api/auth/logout', {}, {
        withCredentials: true,
        headers: { 'Cache-Control': 'no-cache' }
      });
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      clearAuthData();
      setUser(null);
      setLoading(false);
      window.dispatchEvent(new Event('authChanged'));
    }
  };

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, logout, fetchUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
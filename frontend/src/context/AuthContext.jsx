import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';

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
      await fetchUser();
    };

    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  // Logout function to handle both backend and Google OAuth logout
  const logout = async () => {
    try {
      // Call backend logout endpoint
      await api.post("/api/auth/logout", {}, { withCredentials: true });
      
      // Clear Google OAuth session
      googleLogout();
      
      // Clear authentication data
      clearAuthData();
      
      // Update auth state
      setUser(null);
      
      // Trigger authChanged event for other components
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      clearAuthData();
    }
  };

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

export default AuthProvider;
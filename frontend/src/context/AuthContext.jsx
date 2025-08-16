import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = isProduction ? 'skillswaphub.in' : undefined; // No leading dot

  // Clear client-side authentication data
  const clearAuthData = () => {
    // Clear 'user' cookie with matching attributes
    Cookies.remove('user', {
      path: '/',
      domain: cookieDomain,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
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
      if (fetchedUser) {
        setUser(fetchedUser);
        Cookies.set('user', JSON.stringify(fetchedUser), {
          path: '/',
          domain: cookieDomain,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'lax'
        });
      } else {
        setUser(null);
        clearAuthData();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      clearAuthData();
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

  // Logout function
  const logout = async () => {
    try {
      // Call backend logout endpoint
      await api.post('/api/auth/logout', {}, { withCredentials: true });
      // Clear Google OAuth session
      googleLogout();
      // Clear client-side data
      clearAuthData();
      // Update auth state
      setUser(null);
      // Trigger authChanged event
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      clearAuthData();
      window.dispatchEvent(new Event('authChanged'));
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
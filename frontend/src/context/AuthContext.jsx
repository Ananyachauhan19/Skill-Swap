import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieDomain = isProduction ? 'skillswaphub.in' : undefined;

  // Clear client-side authentication data
  const clearAuthData = () => {
    console.info('[DEBUG] Clearing auth data');
    Cookies.remove('user', {
      path: '/',
      domain: cookieDomain,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });
    Cookies.remove('token', {
      path: '/',
      domain: cookieDomain,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });
    // Fallback: Try clearing without domain for robustness
    Cookies.remove('user', { path: '/' });
    Cookies.remove('token', { path: '/' });
    localStorage.clear();
    sessionStorage.clear();
    console.info('[DEBUG] Cookies after clear:', Cookies.get());
  };

  // Fetch authenticated user
  const fetchUser = async () => {
    try {
      console.info('[DEBUG] Fetching user from /api/auth/me');
      const response = await api.get('/api/auth/me', {
        withCredentials: true,
        headers: { 'Cache-Control': 'no-cache' }
      });
      const fetchedUser = response.data.user || null;
      console.info('[DEBUG] Fetched user:', fetchedUser);
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
      console.error('[DEBUG] Failed to fetch user:', error.message, error.response?.data);
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
      console.info('[DEBUG] authChanged event triggered');
      await fetchUser();
    };
    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  // Logout function
  const logout = async () => {
    try {
      console.info('[DEBUG] Initiating logout');
      await api.post('/api/auth/logout', {}, { withCredentials: true });
      console.info('[DEBUG] Backend logout successful');
      googleLogout();
      console.info('[DEBUG] Google logout called');
      clearAuthData();
      setUser(null);
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('[DEBUG] Logout failed:', error.message, error.response?.data);
      clearAuthData();
      setUser(null);
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
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  // flag to prevent /me re-fetch during logout
  const isLoggingOutRef = useRef(false);

  const clearAuthData = () => {
    // Only remove specific auth-related cookies, not all cookies
    try {
      Cookies.remove('token', { path: '/' });
      Cookies.remove('user', { path: '/' });
      Cookies.remove('registeredEmail', { path: '/' });
      Cookies.remove('isRegistered', { path: '/' });
    } catch (e) {
      console.error('Error removing cookies:', e);
    }
    localStorage.clear();
    sessionStorage.clear();
  };

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me', {
        withCredentials: true,
        headers: { 'Cache-Control': 'no-cache' },
      });
      const fetchedUser = response.data.user || null;
      setUser(fetchedUser);
      if (fetchedUser) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (error.response && error.response.status === 401) {
        clearAuthData();
        setUser(null);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Logout for both backend & Google OAuth
  const logout = async () => {
    try {
      isLoggingOutRef.current = true;

      // backend logout
      try {
        await api.post("/api/auth/logout", {}, { withCredentials: true });
      } catch (e) {
        console.warn('Backend logout failed or not reachable, proceeding with client cleanup.');
      }

      // Google logout
      try {
        googleLogout();
      } catch (_) {}

      // client cleanup
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);

      // notify app - use 'logout' event specifically
      window.dispatchEvent(new Event('logout'));
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      clearAuthData();
      window.dispatchEvent(new Event('logout'));
    } finally {
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 0);
    }
  };

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, logout, isAuthenticated }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export default AuthProvider;
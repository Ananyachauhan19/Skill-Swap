import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Flag to prevent /me re-fetch during logout
  const isLoggingOutRef = useRef(false);

  // Define the actual cookie names used by your app
  const cookieNames = ['user']; // Only non-HttpOnly cookie; connect.sid and token are server-cleared
  const isProduction = !window.location.hostname.includes('localhost');
  const cookieDomain = isProduction ? '.skillswaphub.in' : undefined;

  const clearAuthData = () => {
    try {
      cookieNames.forEach((cookieName) => {
        // Remove with production domain if applicable
        Cookies.remove(cookieName, { path: '/', domain: cookieDomain });
        // Fallback removals for safety
        Cookies.remove(cookieName, { path: '/' });
        Cookies.remove(cookieName);
      });

      // Clear only auth-related storage items (add specific keys if used)
      localStorage.removeItem('auth_data'); // Replace with actual keys if any
      sessionStorage.removeItem('auth_data'); // Replace with actual keys if any
    } catch (_) {
      // Ignore errors
    }
  };

  const fetchUser = async () => {
    if (isLoggingOutRef.current) return; // Skip fetch during logout

    try {
      const response = await api.get('/api/auth/me', {
        withCredentials: true,
        headers: { 'Cache-Control': 'no-cache' },
      });
      const fetchedUser = response.data.user || null;
      setUser(fetchedUser);
      if (!fetchedUser) clearAuthData();
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

  // Respond to global "authChanged" event
  useEffect(() => {
    const handleAuthChange = async () => {
      if (isLoggingOutRef.current) {
        setUser(null);
        return; // Skip fetch during logout
      }
      await fetchUser();
    };
    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  // Login function: Call backend login endpoint, then trigger auth change
  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/login', credentials, { withCredentials: true });
      setUser(response.data.user || null);
      window.dispatchEvent(new Event('authChanged'));
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      clearAuthData();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google-specific login
  const googleLogin = async (googleCredential) => {
    try {
      setLoading(true);
      const response = await api.post('/api/auth/google', { credential: googleCredential }, { withCredentials: true });
      setUser(response.data.user || null);
      window.dispatchEvent(new Event('authChanged'));
      return response.data;
    } catch (error) {
      console.error('Google login failed:', error);
      clearAuthData();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      isLoggingOutRef.current = true;

      // Call backend logout to clear HttpOnly cookies (connect.sid, token)
      await api.post('/api/auth/logout', {}, { withCredentials: true });

      // Google logout
      try {
        googleLogout();
      } catch (_) {}

      // Client-side cleanup for non-HttpOnly cookies and storage
      clearAuthData();
      setUser(null);

      // Notify other tabs/windows
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Logout failed:', error);
      clearAuthData();
      setUser(null);
      window.dispatchEvent(new Event('authChanged'));
    } finally {
      // Reset flag after a delay to ensure event handlers complete
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 200); // Increased to 200ms for reliability
    }
  };

  // Token refresh mechanism (if used)
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await api.post('/api/auth/refresh', {}, { withCredentials: true });
        await fetchUser();
      } catch (error/"Failed to fetch user: AxiosError: Request failed with status code 401") {
        console.error('Token refresh failed:', error);
        await logout(); // Auto-logout on refresh failure
      }
    }, 30 * 60 * 1000); // Every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, login, googleLogin, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
export default AuthProvider;
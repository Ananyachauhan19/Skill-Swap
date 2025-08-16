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

  // Assume your auth cookie name is 'auth_token' – replace with actual name if known.
  // If not, you can keep broad removal but it's not ideal; try to specify.
  const authCookieName = 'auth_token'; // Adjust based on your backend (e.g., 'jwt', 'sessionid')

  const clearAuthData = () => {
    // Targeted cookie removal instead of clearing all
    try {
      Cookies.remove(authCookieName, { path: '/', domain: window.location.hostname });
      Cookies.remove(authCookieName, { path: '/' });
      Cookies.remove(authCookieName);
    } catch (_) {
      // Ignore errors
    }

    // Clear only auth-related storage items if any (add keys as needed)
    localStorage.removeItem('auth_data'); // Example: replace with actual keys
    sessionStorage.removeItem('auth_data'); // Example: replace with actual keys

    // Avoid clearing entire storage to preserve other app data
  };

  const fetchUser = async () => {
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
  // Assumes backend sets cookie/token on successful login
  const login = async (credentials) => { // credentials: e.g., { email, password } or Google token
    try {
      setLoading(true);
      const response = await api.post('/api/auth/login', credentials, { withCredentials: true });
      // Assuming backend sets auth cookie/token here
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

  // Google-specific login (if using OAuth)
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

      // Backend logout to invalidate server-side session/token
      try {
        await api.post("/api/auth/logout", {}, { withCredentials: true });
      } catch (e) {
        console.warn('Backend logout failed, proceeding with client cleanup.');
      }

      // Google logout if applicable
      try {
        googleLogout();
      } catch (_) {}

      // Client-side cleanup
      clearAuthData();
      setUser(null);

      // Notify other tabs/windows
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      clearAuthData();
      window.dispatchEvent(new Event('authChanged'));
    } finally {
      // Reset flag after a small delay to ensure event handlers run first
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 100); // Increased delay for reliability
    }
  };

  // Optional: Token refresh mechanism (if your tokens expire)
  // This runs periodically if user is logged in
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      try {
        await api.post('/api/auth/refresh', {}, { withCredentials: true });
        // Assuming backend refreshes the token/cookie
        await fetchUser(); // Re-fetch user to update state if needed
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout(); // Auto-logout on refresh failure
      }
    }, 30 * 60 * 1000); // Every 30 minutes – adjust based on token expiry

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
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // flag to prevent /me re-fetch during logout
  const isLoggingOutRef = useRef(false);

  const clearAuthData = () => {
    // Remove cookies in multiple ways to cover path/domain variations
    const cookieNames = Object.keys(Cookies.get());
    cookieNames.forEach((cookieName) => {
      try {
        Cookies.remove(cookieName, { path: '/', domain: window.location.hostname });
        Cookies.remove(cookieName, { path: '/' });
        Cookies.remove(cookieName);
      } catch (_) {
        // ignore
      }
    });
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

  // Respond to global "authChanged" event:
  // - If triggered by logout, skip /me fetch and just ensure user=null.
  // - If triggered by login elsewhere, fetch the user.
  useEffect(() => {
    const handleAuthChange = async () => {
      if (isLoggingOutRef.current) {
        setUser(null);
        return; // do NOT fetch during logout
      }
      await fetchUser();
    };
    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  // Logout for both backend & Google OAuth
  const logout = async () => {
    try {
      isLoggingOutRef.current = true;

      // backend logout
      try {
        await api.post("/api/auth/logout", {}, { withCredentials: true });
      } catch (e) {
        // proceed even if backend call fails
        console.warn('Backend logout failed or not reachable, proceeding with client cleanup.');
      }

      // Google logout (safe to call even if not logged in with Google)
      try {
        googleLogout();
      } catch (_) {}

      // client cleanup
      clearAuthData();
      setUser(null);

      // notify app
      window.dispatchEvent(new Event('authChanged'));
    } catch (error) {
      console.error('Logout failed:', error);
      setUser(null);
      clearAuthData();
      window.dispatchEvent(new Event('authChanged'));
    } finally {
      // small delay ensures listeners handle the event before we allow fetches again
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 0);
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
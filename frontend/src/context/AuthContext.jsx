
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import { googleLogout } from '@react-oauth/google';
import Cookies from 'js-cookie';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data on mount
  useEffect(() => {
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

  return (
    <AuthCtx.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

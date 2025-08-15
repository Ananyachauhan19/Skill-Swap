import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";
import Cookies from 'js-cookie';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch authenticated user on mount
    api
      .get("/api/auth/me")
      .then((r) => {
        setUser(r.data.user);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  // Listen for authChanged event
  useEffect(() => {
    const handleAuthChange = () => {
      // Clear all client-side authentication data
      Object.keys(Cookies.get()).forEach(cookieName => Cookies.remove(cookieName, { path: '/', domain: window.location.hostname }));
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('authChanged', handleAuthChange);
    return () => window.removeEventListener('authChanged', handleAuthChange);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
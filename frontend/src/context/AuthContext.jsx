// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const BACKEND_URL = 'https://skill-swap-69nw.onrender.com';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.info('[DEBUG] AuthContext: Checking for user...');
      
      try {
        // Only check backend authentication - no localStorage
        const response = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data._id) {
          const userData = { ...data, isAdmin: data.isAdmin || false };
          setUser(userData);
        }
      } catch (error) {
        console.error("[DEBUG] Auth initialization failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const userData = await response.json();
        if (userData && userData._id) {
          const userWithAdmin = { ...userData, isAdmin: userData.isAdmin || false };
          setUser(userWithAdmin);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("[DEBUG] Auth check failed:", error);
      return false;
    }
  };

  const login = (userData) => {
    if (userData && userData._id) {
      const userWithAdmin = { ...userData, isAdmin: userData.isAdmin || false };
      setUser(userWithAdmin);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = (newUser) => {
    if (newUser && newUser._id) {
      const userData = { ...newUser, isAdmin: newUser.isAdmin || false };
      setUser(userData);
    } else {
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    loading,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

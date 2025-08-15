// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { BACKEND_URL } from "../config.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.info('[DEBUG] AuthContext: Checking for user...');
      
      try {
        // First try to get user from localStorage
        const storedUser = localStorage.getItem("user");
        
        if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && typeof parsedUser === 'object') {
              setUser({ ...parsedUser, isAdmin: parsedUser.isAdmin || false });
              setLoading(false);
              return; // Successfully loaded user from localStorage
            }
          } catch (parseError) {
            console.error('[DEBUG] AuthContext: Error parsing stored user:', parseError);
            localStorage.removeItem("user");
          }
        }

        // If we get here, either there was no stored user or it was invalid
        const token = Cookies.get('token');
        if (!token) {
          console.info("[DEBUG] No token found. User is not logged in.");
          setLoading(false);
          return;
        }

        // Try to fetch fresh user data from backend
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
          localStorage.setItem("user", JSON.stringify(userData));
        } else {
          console.warn("[DEBUG] No valid user data received from backend.");
        }
      } catch (error) {
        console.error("[DEBUG] Auth initialization failed:", error);
        localStorage.removeItem("user");
        Cookies.remove("token");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const updateUser = (newUser) => {
    if (newUser) {
      // Validate and store user data
      try {
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser({ ...newUser, isAdmin: newUser.isAdmin || false });
      } catch (error) {
        console.error('[DEBUG] AuthContext: Error storing user data:', error);
        // If storing fails, at least update the state
        setUser({ ...newUser, isAdmin: newUser.isAdmin || false });
      }
    } else {
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  const logout = () => {
    // Clear all auth-related data
    Cookies.remove("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser: updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

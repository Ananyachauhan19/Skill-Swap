// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { BACKEND_URL } from "../config.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      console.info('[DEBUG] AuthContext: Checking for user...');
      
      try {
        const storedUser = localStorage.getItem("user");
        
        // Check for invalid or empty data
        if (!storedUser || storedUser === 'undefined' || storedUser === 'null') {
          localStorage.removeItem("user");
          return;
        }

        // Try to parse the stored user data
        const parsedUser = JSON.parse(storedUser);
        
        // Validate parsed data
        if (!parsedUser || typeof parsedUser !== 'object') {
          throw new Error('Invalid user data structure');
        }

        setUser({ ...parsedUser, isAdmin: parsedUser.isAdmin || false });
      } catch (error) {
        console.error('[DEBUG] AuthContext: Error with stored user:', error);
        localStorage.removeItem("user");
        
        // Try to fetch user data from backend if we have a token
        const token = Cookies.get('token');
        if (token) {
          try {
            const response = await fetch(`${BACKEND_URL}/api/auth/user/profile`, {
              credentials: "include"
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data._id) {
              setUser({ ...data, isAdmin: data.isAdmin || false });
              localStorage.setItem("user", JSON.stringify(data));
            }
          } catch (err) {
            console.error("[DEBUG] Failed to fetch user profile:", err);
            Cookies.remove("token");
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    } else {
      const token = Cookies.get('token');
      if (!token) {
        console.info("[DEBUG] No token found. User is not logged in.");
        setLoading(false);
        return;
      }

      fetch(`${BACKEND_URL}/api/auth/user/profile`, {
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data && data._id) {
            setUser({ ...data, isAdmin: data.isAdmin || false });
          } else {
            console.warn("[DEBUG] No valid user data received from backend.");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("[DEBUG] Failed to fetch user profile:", err);
          setLoading(false);
        });
    }
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

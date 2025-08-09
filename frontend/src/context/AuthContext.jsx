// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { BACKEND_URL } from "../config.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    console.info('[DEBUG] AuthContext: Checking for user...');
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== 'undefined') { // Add check for 'undefined' string
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, isAdmin: parsedUser.isAdmin || false });
        setLoading(false);
      } catch (error) {
        console.error('[DEBUG] AuthContext: Error parsing stored user:', error);
        // Clear invalid stored user to prevent future errors
        localStorage.removeItem("user");
        setLoading(false);
      }
    } else {
      const token = Cookies.get('token');
      if (token) {
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
    setUser(newUser ? { ...newUser, isAdmin: newUser.isAdmin || false } : null);
  };

  const logout = () => {
    Cookies.remove("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser: updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

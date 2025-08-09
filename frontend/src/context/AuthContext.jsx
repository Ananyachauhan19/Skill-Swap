import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { BACKEND_URL } from "../config.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from backend using token in cookies
  useEffect(() => {
    console.info("[DEBUG] AuthContext: Checking auth cookie...");
    const token = Cookies.get("token");

    if (!token) {
      console.info("[DEBUG] No token found, skipping user fetch.");
      setLoading(false);
      return;
    }

    fetch(`${BACKEND_URL}/api/auth/user/profile`, {
      credentials: "include", // send cookies with request
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && data._id) {
          setUser({ ...data, isAdmin: data.isAdmin || false });
        } else {
          console.warn("[DEBUG] No valid user data received.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[DEBUG] AuthContext: Failed to fetch user profile:", err);
        setLoading(false);
      });
  }, []);

  // Update user in state only (no localStorage)
  const updateUser = (newUser) => {
    setUser(newUser ? { ...newUser, isAdmin: newUser.isAdmin || false } : null);
  };

  // Logout helper (optional)
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

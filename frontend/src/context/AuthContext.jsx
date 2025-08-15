import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { BACKEND_URL } from "../config.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const loadUser = async () => {
      console.info('[DEBUG] AuthContext: Checking for user...');
      const storedUser = localStorage.getItem("user");

      if (storedUser && storedUser !== 'undefined') {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({ ...parsedUser, isAdmin: parsedUser.isAdmin || false });
        } catch (error) {
          console.error('[DEBUG] AuthContext: Error parsing stored user:', error);
          localStorage.removeItem("user"); // Clear invalid data
        }
        setLoading(false);
      } else {
        const token = Cookies.get('token');
        if (token) {
          try {
            // Assuming you have an endpoint to get user profile from token
            const response = await fetch(`${BACKEND_URL}/api/auth/profile`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            if (response.ok) {
              const profileData = await response.json();
              const userData = { ...profileData, isAdmin: profileData.isAdmin || false };
              setUser(userData);
              localStorage.setItem("user", JSON.stringify(userData));
            } else {
              // Token is invalid or expired
              logout();
            }
          } catch (err) {
            console.error("[DEBUG] Failed to fetch user profile:", err);
            logout(); // Logout on error
          } finally {
            setLoading(false);
          }
        } else {
          console.info("[DEBUG] No stored user or token found. User is not logged in.");
          setLoading(false);
        }
      }
    };

    loadUser();
  }, []);

  const updateUser = (newUser) => {
    if (newUser) {
      const updatedUser = { ...newUser, isAdmin: newUser.isAdmin || false };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } else {
      setUser(null);
      localStorage.removeItem("user");
    }
  };

  const logout = () => {
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
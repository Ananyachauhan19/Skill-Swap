import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    console.info('[DEBUG] AuthContext: Checking for user...');
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({ ...parsedUser, isAdmin: parsedUser.isAdmin || false });
        setLoading(false);
      } catch (error) {
        console.error('[DEBUG] AuthContext: Error parsing stored user:', error);
        setLoading(false);
      }
    } else {
      const token = Cookies.get('token');
      if (token) {
        fetch(`${BACKEND_URL}/api/auth/user/profile`, {
          credentials: 'include'
        })
          .then(res => res.json())
          .then(data => {
            if (data && data._id) {
              const userWithAdminStatus = { ...data, isAdmin: data.isAdmin || false };
              setUser(userWithAdminStatus);
              localStorage.setItem("user", JSON.stringify(userWithAdminStatus));
            }
            setLoading(false);
          })
          .catch(err => {
            console.error('[DEBUG] AuthContext: Failed to fetch user profile:', err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, []);

  const updateUser = (newUser) => {
    const userToSet = newUser ? { ...newUser, isAdmin: newUser.isAdmin || false } : null;
    setUser(userToSet);
    if (userToSet) {
      localStorage.setItem("user", JSON.stringify(userToSet));
    } else {
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
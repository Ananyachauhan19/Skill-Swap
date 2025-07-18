import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { BACKEND_URL } from '../config.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    console.info('[DEBUG] AuthContext: Checking for user...');
    // Try to get user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.info('[DEBUG] AuthContext: Found user in localStorage:', parsedUser._id);
        setUser(parsedUser);
      } catch (error) {
        console.error('[DEBUG] AuthContext: Error parsing stored user:', error);
      }
    } else {
      // If no user in localStorage, but token exists, fetch user profile
      const token = Cookies.get('token');
      console.info('[DEBUG] AuthContext: No user in localStorage, token exists:', !!token);
      if (token) {
        fetch(`${BACKEND_URL}/api/auth/user/profile`, {
          credentials: 'include'
        })
          .then(res => {
            console.info('[DEBUG] AuthContext: Profile fetch response status:', res.status);
            return res.json();
          })
          .then(data => {
            console.info('[DEBUG] AuthContext: Profile fetch data:', data);
            if (data && data._id) {
              setUser(data);
              localStorage.setItem("user", JSON.stringify(data));
              console.info('[DEBUG] AuthContext: User set from profile fetch:', data._id);
            }
          })
          .catch(err => {
            console.error('[DEBUG] AuthContext: Failed to fetch user profile after OAuth:', err);
          });
      }
    }
  }, []);

  const updateUser = (newUser) => {
    console.info('[DEBUG] AuthContext: updateUser called with:', newUser && newUser._id);
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 
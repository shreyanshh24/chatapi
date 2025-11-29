// src/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import { api } from "./api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // while checking token

  // call this after login to set user
  const onLoggedIn = (u) => {
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  // On mount: if token exists, fetch profile
  useEffect(() => {
    async function fetchMe() {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/users/me"); // backend should return current user
        setUser(res.data);
      } catch (err) {
        console.warn("Could not fetch /users/me, logging out", err);
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchMe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, onLoggedIn, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

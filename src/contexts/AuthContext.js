import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('cx_token'));

  useEffect(() => { token ? fetchMe() : setLoading(false); }, []);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setUser(data.user); else logout();
    } catch { logout(); }
    finally { setLoading(false); }
  };

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) { localStorage.setItem('cx_token', data.token); setToken(data.token); setUser(data.user); }
      return data;
    } catch (err) { return { success: false, error: err.message }; }
  };

  const register = async (name, email, password, phone, panNumber) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, panNumber })
      });
      const data = await res.json();
      if (data.success) { localStorage.setItem('cx_token', data.token); setToken(data.token); setUser(data.user); }
      return data;
    } catch (err) { return { success: false, error: err.message }; }
  };

  const logout = () => { localStorage.removeItem('cx_token'); setToken(null); setUser(null); };

  const apiCall = async (url, options = {}) => {
    try {
      const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers } });
      return res.json();
    } catch (err) { return { success: false, error: err.message }; }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, apiCall }}>
      {children}
    </AuthContext.Provider>
  );
};

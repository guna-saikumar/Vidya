import React, { createContext, useContext, useState, useEffect } from 'react';

const ADMIN_TOKEN_KEY = 'vidya_admin_token';
const DEFAULT_TOKEN = 'vidya-admin-secret';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminTokenState] = useState(() => {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || DEFAULT_TOKEN;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY) || DEFAULT_TOKEN);
  });

  const login = (token) => {
    const trimmed = (token || '').trim();
    if (!trimmed) return false;
    localStorage.setItem(ADMIN_TOKEN_KEY, trimmed);
    setAdminTokenState(trimmed);
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminTokenState('');
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

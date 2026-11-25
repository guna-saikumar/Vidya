import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { ADMIN_TOKEN_KEY, ADMIN_USER_KEY } from '../services/adminApiClient';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminToken, setAdminTokenState] = useState(() => {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  });

  const [adminUser, setAdminUserState] = useState(() => {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const isAuthenticated = Boolean(adminToken && adminUser);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await adminService.login({ email, password });
      const token = data?.token || 'vidya-admin-secret';
      const user = data?.user || {
        id: 'admin-root',
        email,
        name: 'Academic Administrator',
        role: 'ADMIN',
      };

      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
      setAdminTokenState(token);
      setAdminUserState(user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid email or password.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdminTokenState('');
    setAdminUserState(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminToken,
        adminUser,
        isAuthenticated,
        loading,
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

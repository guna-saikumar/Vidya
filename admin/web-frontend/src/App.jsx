import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminLayout } from './components/layout/AdminLayout';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BooksMaterialsPage } from './pages/BooksMaterialsPage';
import { AlertsNotificationsPage } from './pages/AlertsNotificationsPage';
import { StudentsManagementPage } from './pages/StudentsManagementPage';
import { CurriculumClassesPage } from './pages/CurriculumClassesPage';
import { SupportTicketsPage } from './pages/SupportTicketsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="books" element={<BooksMaterialsPage />} />
            <Route path="alerts" element={<AlertsNotificationsPage />} />
            <Route path="students" element={<StudentsManagementPage />} />
            <Route path="curriculum" element={<CurriculumClassesPage />} />
            <Route path="support" element={<SupportTicketsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
};

export default App;

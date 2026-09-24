import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// User Panel Components
import UserLayout from './pages/user/UserLayout';
import BrowseCarsPage from './pages/user/BrowseCarsPage';
import MyRequestsPage from './pages/user/MyRequestsPage';
import ProfilePage from './pages/user/ProfilePage';
import UserAuthPage from './pages/user/UserAuthPage';

// Admin Panel Components
import AdminLayout from './pages/admin/AdminLayout';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCarsPage from './pages/admin/AdminCarsPage';
import AdminRequestsPage from './pages/admin/AdminRequestsPage';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* User / Public Customer Panel */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<BrowseCarsPage />} />
            <Route path="requests" element={<MyRequestsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="auth" element={<UserAuthPage />} />
          </Route>

          {/* Dedicated Staff / Admin Auth Portal (Unlisted Route) */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Staff / Admin Operations Panel */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="requests" element={<AdminRequestsPage />} />
            <Route path="cars" element={<AdminCarsPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}


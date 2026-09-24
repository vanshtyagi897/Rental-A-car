import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function AdminProtectedRoute({ children }) {
  const { isAdminAuthenticated, isAuthChecking, checkAdminAuth } = useApp();
  const location = useLocation();

  useEffect(() => {
    checkAdminAuth();
  }, [location.pathname]);

  if (isAuthChecking) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0c1315',
        color: 'var(--color-text-bright)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(159, 237, 215, 0.2)',
          borderTopColor: 'var(--color-accent-mint)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '1rem'
        }} />
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Verifying security session...
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}

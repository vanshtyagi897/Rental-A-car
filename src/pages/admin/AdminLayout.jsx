import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function AdminLayout() {
  const { adminUser, isAdminAuthenticated, logoutAdmin, requests } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutAdmin();
    navigate('/admin/login', { replace: true });
  };

  const pendingCount = requests.filter(r => r.status.includes('Pending')).length;

  return (
    <div className="app-container">
      {/* Top Admin Header */}
      <header className="admin-navbar">
        <div className="container-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link to="/admin" style={{ color: 'var(--color-heading)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.25rem' }}>
              K<span style={{ color: 'var(--color-accent-mint)' }}>&amp;</span>K OPERATIONS
            </Link>
            <span className="admin-header-badge">Staff Management Portal</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Logged in: <strong style={{ color: 'var(--color-text-bright)' }}>{adminUser.name}</strong>
            </span>
            <button 
              type="button" 
              onClick={handleLogout}
              className="btn btn-sm btn-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Admin Sub-navigation Bar */}
      <nav style={{ backgroundColor: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)', padding: '0.65rem 0' }}>
        <div className="container-wide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ul className="nav-links" style={{ gap: '0.5rem' }}>
            <li>
              <Link 
                to="/admin" 
                className={`btn btn-sm ${location.pathname === '/admin' ? 'btn-primary' : 'btn-subtle'}`}
              >
                Operations Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/requests" 
                className={`btn btn-sm ${location.pathname === '/admin/requests' ? 'btn-primary' : 'btn-subtle'}`}
              >
                Rental Requests {pendingCount > 0 && `(${pendingCount} Pending)`}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/cars" 
                className={`btn btn-sm ${location.pathname === '/admin/cars' ? 'btn-primary' : 'btn-subtle'}`}
              >
                Fleet & Pricing Control
              </Link>
            </li>
          </ul>

          <div>
            <Link to="/" target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline" style={{ fontSize: '0.8rem' }}>
              Open Customer View ↗
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Admin Content View */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

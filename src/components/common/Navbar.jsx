import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import logoImg from '../../assets/logo.png';

export default function Navbar() {
  const { currentUser, requests, logoutUser } = useApp();
  const location = useLocation();

  // Count user's requests
  const userRequestsCount = requests.filter(
    r => currentUser && (r.userId === currentUser.id || r.customerEmail === currentUser.email)
  ).length;

  return (
    <>
      {/* Top Advisory Banner */}
      <div className="policy-banner">
        <div className="container policy-banner-content">
          <div>
            <strong>Fixed Time Slots:</strong> 12-Hour Minimum | 24-Hour Standard Booking
          </div>
          <div>
            Serving Siyana &amp; Bulandshahr • Phone: <a href="tel:+919997784944" style={{ color: 'var(--color-accent-mint)', fontWeight: 600 }}>+91 99977 84944</a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="brand-link" aria-label="K&K Car Rentals Home">
            <img 
              src={logoImg} 
              alt="K&K Car Rentals Logo" 
              className="brand-logo-circle" 
            />
            <span className="brand-wordmark">
              K<span className="brand-ampersand">&amp;</span>K Car Rentals
            </span>
          </Link>

          <nav>
            <ul className="nav-links">
              <li>
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  Browse Fleet
                </Link>
              </li>
              <li>
                <a href="#about" className="nav-link">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="nav-link">
                  Contact
                </a>
              </li>
              <li>
                <Link 
                  to="/requests" 
                  className={`nav-link ${location.pathname === '/requests' ? 'active' : ''}`}
                >
                  My Requests {userRequestsCount > 0 && `(${userRequestsCount})`}
                </Link>
              </li>
              {currentUser ? (
                <>
                  <li>
                    <Link 
                      to="/profile" 
                      className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
                    >
                      Profile
                    </Link>
                  </li>
                  <li style={{ marginLeft: '0.5rem' }}>
                    <div className="user-pill">
                      <span>{currentUser.name}</span>
                      <button 
                        onClick={logoutUser} 
                        className="btn-subtle" 
                        style={{ color: 'var(--color-accent-mint)', padding: '0.2rem 0.4rem', fontSize: '0.78rem' }}
                        title="Sign Out"
                      >
                        Sign Out
                      </button>
                    </div>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/auth" className="btn btn-accent btn-sm">
                    Sign In / Register
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

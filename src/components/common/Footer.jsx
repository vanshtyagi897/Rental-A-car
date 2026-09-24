import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.01em' }}>
              K<span style={{ color: 'var(--color-accent-mint)' }}>&amp;</span>K CAR RENTALS
            </h4>
            <p style={{ color: 'var(--color-text-body)', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.6' }}>
              Specialized vehicle rental operations structured around fixed 12-hour and 24-hour time slots. Transparent flat pricing with dedicated fleet dispatch.
            </p>
            <p style={{ color: 'var(--color-text-subtle)', fontSize: '0.8rem' }}>
              Operational Base: Siyana, Bulandshahr, Uttar Pradesh, India
            </p>
          </div>

          <div>
            <h4>RENTAL POLICIES</h4>
            <ul className="footer-links">
              <li>• Minimum rental period is 12 hours flat</li>
              <li>• Standard rental period is 24 hours flat</li>
              <li>• For rentals &gt; 24 hours, advance notice is required</li>
              <li>• Late returns without notice incur hourly overage rates</li>
              <li>• Government ID (Aadhaar) & deposit verified at pickup</li>
            </ul>
          </div>

          <div>
            <h4>CUSTOMER PORTAL</h4>
            <ul className="footer-links">
              <li><Link to="/">Browse Available Models</Link></li>
              <li><Link to="/requests">Track Booking Status</Link></li>
              <li><Link to="/profile">Manage Customer Profile</Link></li>
              <li><Link to="/auth">Sign In / Register</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} K&amp;K Car Rentals. All rights reserved.
          </div>
          <div>
            Fixed Slot Fleet Booking System
          </div>
        </div>
      </div>
    </footer>
  );
}

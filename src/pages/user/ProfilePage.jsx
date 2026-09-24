import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export default function ProfilePage() {
  const { currentUser, updateUserProfile } = useApp();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [city, setCity] = useState(currentUser?.city || '');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    updateUserProfile({ name, phone, email, city });
    setSuccessMessage('Profile details updated successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="container-narrow">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Customer Profile</h1>
        <p style={{ color: 'var(--color-text-body)', marginTop: '0.25rem' }}>
          Manage your contact credentials for speedier booking dispatch.
        </p>
      </div>

      {successMessage && (
        <div className="notice-box notice-box-info" style={{ marginBottom: '1.5rem' }}>
          {successMessage}
        </div>
      )}

      <div className="card card-white" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">City / Operating Region</label>
            <input
              type="text"
              className="form-control"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. New Delhi / NCR"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary">
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* In-Person Verification Reminder */}
      <div className="card card-cream">
        <h4 style={{ marginBottom: '0.75rem' }}>In-Person Pickup Verification Policy</h4>
        <p style={{ fontSize: '0.885rem', color: 'var(--color-text-body)', lineHeight: '1.6', marginBottom: '0.75rem' }}>
          For security and insurance compliance, every customer must physically present:
        </p>
        <ul style={{ fontSize: '0.885rem', color: 'var(--color-text-body)', marginLeft: '1.25rem', lineHeight: '1.6' }}>
          <li>Original Indian Government <strong>Aadhaar Card</strong>.</li>
          <li>Original valid <strong>Driving License</strong> (minimum 1 year holding).</li>
          <li>Security deposit (processed via UPI / card at the pickup dispatch counter).</li>
        </ul>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';

export default function MyRequestsPage() {
  const { requests, currentUser } = useApp();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('All');

  // Filter requests belonging to this customer
  const userRequests = requests.filter(req => {
    if (!currentUser) return true; // Show all if guest/test
    return req.userId === currentUser.id || req.customerEmail === currentUser.email || req.customerPhone === currentUser.phone;
  });

  const filteredRequests = userRequests.filter(req => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return req.status === 'Pending Confirmation' || req.status === 'Pending';
    return req.status === activeTab;
  });

  const formatDate = (isoString) => {
    if (!isoString) return 'Not specified';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const justSubmittedId = location.state?.justSubmitted;

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>My Rental Booking Requests</h1>
        <p style={{ color: 'var(--color-text-body)', marginTop: '0.25rem' }}>
          Track the review and dispatch status of your submitted vehicle requests.
        </p>
      </div>

      {justSubmittedId && (
        <div className="notice-box notice-box-info" style={{ marginBottom: '1.75rem' }}>
          <strong>Request Submitted Successfully!</strong> Your request (ID: {justSubmittedId}) is currently under review by our fleet dispatchers. We will update the status below shortly.
        </div>
      )}

      {/* Tabs */}
      <div className="filter-bar" style={{ marginBottom: '1.75rem' }}>
        <div className="filter-pills">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Rejected'].map(tab => (
            <button
              key={tab}
              type="button"
              className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({userRequests.filter(r => tab === 'All' ? true : (tab === 'Pending' ? (r.status.includes('Pending')) : r.status === tab)).length})
            </button>
          ))}
        </div>
        <Link to="/" className="btn btn-secondary btn-sm">
          + Request Another Vehicle
        </Link>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', color: 'var(--color-heading)' }}>No requests found in this view</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '480px', marginInline: 'auto' }}>
            {activeTab === 'All' 
              ? "You haven't submitted any vehicle rental requests yet. Explore our fixed-slot vehicle catalog to place a reservation." 
              : `No requests with status "${activeTab}".`}
          </p>
          <Link to="/" className="btn btn-primary">
            Browse Vehicle Fleet
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredRequests.map(req => (
            <div key={req.id} className="card card-white" style={{ borderLeft: `4px solid ${req.status === 'Confirmed' ? 'var(--color-accent-mint)' : req.status.includes('Pending') ? 'var(--color-accent-gold)' : req.status === 'Rejected' ? '#f87171' : '#94a3b8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--color-heading)' }}>{req.carName}</h3>
                    <StatusBadge status={req.status} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>
                    Request ID: <strong style={{ color: 'var(--color-text-bright)' }}>{req.id}</strong> • Submitted: {formatDate(req.createdAt)}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Estimated Base Amount</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-accent-mint)', fontFamily: 'var(--font-heading)' }}>
                    ₹{req.estimatedBasePrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ background: 'var(--color-bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Duration Slot
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-bright)', marginTop: '0.2rem' }}>
                    {req.duration}
                  </div>
                  {req.expectedDurationNote && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-body)', marginTop: '0.35rem', fontStyle: 'italic' }}>
                      "{req.expectedDurationNote}"
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Requested Pickup Time
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-bright)', marginTop: '0.2rem' }}>
                    {formatDate(req.startDateTime)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Contact Person
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-bright)', marginTop: '0.2rem' }}>
                    {req.customerName} ({req.customerPhone})
                  </div>
                </div>
              </div>

              {/* Staff / Dispatcher Notes */}
              {req.adminNotes && (
                <div style={{ padding: '0.85rem 1rem', background: 'var(--color-bg-surface-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem' }}>
                  <strong style={{ color: 'var(--color-accent-mint)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Staff Operational Note:
                  </strong>
                  <p style={{ color: 'var(--color-text-body)', marginTop: '0.25rem', margin: 0 }}>
                    {req.adminNotes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

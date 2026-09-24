import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

export default function AdminDashboardPage() {
  const { cars, requests, updateRequestStatus, updateRequestNotes } = useApp();

  // Metrics
  const totalCars = cars.length;
  const pendingRequests = requests.filter(r => r.status.includes('Pending'));
  const activeRentals = requests.filter(r => r.status === 'Confirmed');
  const completedRentals = requests.filter(r => r.status === 'Completed');

  // Modal note state
  const [editingRequest, setEditingRequest] = useState(null);
  const [noteText, setNoteText] = useState('');

  const openNoteModal = (req) => {
    setEditingRequest(req);
    setNoteText(req.adminNotes || '');
  };

  const saveNote = async () => {
    if (editingRequest) {
      await updateRequestNotes(editingRequest.id, noteText);
      setEditingRequest(null);
    }
  };

  return (
    <div className="container-wide">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Fleet Operations Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Real-time summary of fleet capacity, booking triage, and active rental dispatches.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="admin-stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Fleet Vehicles</span>
          <span className="stat-number">{totalCars}</span>
          <span className="stat-desc">Models managed in database</span>
        </div>

        <div className="stat-card" style={{ borderColor: pendingRequests.length > 0 ? 'var(--color-accent-gold)' : 'var(--color-border)' }}>
          <span className="stat-label" style={{ color: pendingRequests.length > 0 ? 'var(--color-accent-gold)' : 'var(--color-text-muted)' }}>
            Pending Requests
          </span>
          <span className="stat-number" style={{ color: pendingRequests.length > 0 ? 'var(--color-accent-gold)' : 'var(--color-accent-mint)' }}>
            {pendingRequests.length}
          </span>
          <span className="stat-desc">Awaiting staff confirmation</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Dispatches (Confirmed)</span>
          <span className="stat-number">{activeRentals.length}</span>
          <span className="stat-desc">Approved & on schedule</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Completed Rentals</span>
          <span className="stat-number">{completedRentals.length}</span>
          <span className="stat-desc">Vehicles successfully returned</span>
        </div>
      </div>

      {/* Urgent Pending Action Queue */}
      <div className="card card-white" style={{ marginBottom: '2.5rem' }}>
        <div className="card-header">
          <div>
            <h3>Pending Booking Requests ({pendingRequests.length})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              Action needed: Confirm vehicle readiness or decline reservation.
            </p>
          </div>
          <Link to="/admin/requests" className="btn btn-outline btn-sm">
            View All Requests ({requests.length}) →
          </Link>
        </div>

        {pendingRequests.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No pending requests at this time. All customer requests have been processed.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Duration</th>
                  <th>Pickup Scheduled</th>
                  <th>Base Price</th>
                  <th>Staff Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.id}</strong>
                    </td>
                    <td>
                      <div><strong>{req.customerName}</strong></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-subtle)' }}>{req.customerPhone}</div>
                    </td>
                    <td>
                      <strong>{req.carName}</strong>
                    </td>
                    <td>
                      <div>{req.duration}</div>
                      {req.expectedDurationNote && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-accent-mint)', fontStyle: 'italic', maxWidth: '220px' }}>
                          "{req.expectedDurationNote}"
                        </div>
                      )}
                    </td>
                    <td>
                      {new Date(req.startDateTime).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--color-accent-mint)' }}>₹{req.estimatedBasePrice.toLocaleString('en-IN')}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(req.id, 'Confirmed', 'Request confirmed by dispatcher. Vehicle assigned for pickup.')}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(req.id, 'Rejected', 'Declined due to scheduling or maintenance.')}
                          className="btn btn-danger-outline btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => openNoteModal(req)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                        >
                          Note
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links / Fleet Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card card-cream">
          <h4 style={{ marginBottom: '0.5rem' }}>Fleet & Rate Management</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', marginBottom: '1.25rem' }}>
            Adjust 12-hour fixed rates, 24-hour standard rates, and hourly overage penalties. Changes reflect instantly on the customer booking portal.
          </p>
          <Link to="/admin/cars" className="btn btn-primary btn-sm">
            Manage Vehicles & Rates →
          </Link>
        </div>

        <div className="card card-cream">
          <h4 style={{ marginBottom: '0.5rem' }}>All Rental Logs & Status Tracking</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-body)', marginBottom: '1.25rem' }}>
            Inspect full booking history, update active rentals to "Completed", review customer contact information, and record in-person verification notes.
          </p>
          <Link to="/admin/requests" className="btn btn-primary btn-sm">
            Manage Rental Requests →
          </Link>
        </div>
      </div>

      {/* Internal Note Modal */}
      {editingRequest && (
        <Modal
          isOpen={!!editingRequest}
          onClose={() => setEditingRequest(null)}
          title={`Internal Staff Note: ${editingRequest.id}`}
        >
          <div className="form-group">
            <label className="form-label">Internal Operational Note</label>
            <textarea
              className="form-control"
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Extended to 30 hrs upon phone request. Advance deposit verified..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={() => setEditingRequest(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={saveNote}>
              Save Note
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

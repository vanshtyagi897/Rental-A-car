import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';

export default function AdminRequestsPage() {
  const { requests, updateRequestStatus, updateRequestNotes } = useApp();

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRequest, setEditingRequest] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.customerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.carName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return req.status.includes('Pending');
    return req.status === activeTab;
  });

  const openActionModal = (req) => {
    setEditingRequest(req);
    setNoteText(req.adminNotes || '');
    setSelectedStatus(req.status);
  };

  const handleSaveAction = async (e) => {
    e.preventDefault();
    if (editingRequest) {
      await updateRequestStatus(editingRequest.id, selectedStatus, noteText);
      setEditingRequest(null);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
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

  return (
    <div className="container-wide">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Manage Rental Requests</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          Review incoming reservation requests, confirm vehicle assignments, record extension details, and update dispatch status.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search by customer name, phone, car, or request ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '420px' }}
          />
        </div>

        <div className="filter-pills">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Rejected'].map(tab => (
            <button
              key={tab}
              type="button"
              className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} ({requests.filter(r => tab === 'All' ? true : (tab === 'Pending' ? r.status.includes('Pending') : r.status === tab)).length})
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
          <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>No requests matched your query</h3>
          <p style={{ color: 'var(--color-text-subtle)' }}>
            Try resetting your filters or search terms.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer Details</th>
                <th>Vehicle Model</th>
                <th>Duration & Custom Note</th>
                <th>Pickup Date / Time</th>
                <th>Base Amount</th>
                <th>Status</th>
                <th>Staff Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req.id}>
                  <td>
                    <strong>{req.id}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>
                      {formatDate(req.createdAt)}
                    </div>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{req.customerName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{req.customerPhone}</div>
                    {req.customerEmail && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)' }}>{req.customerEmail}</div>
                    )}
                  </td>

                  <td>
                    <strong style={{ color: 'var(--color-text-bright)' }}>{req.carName}</strong>
                  </td>

                  <td>
                    <div><strong>{req.duration}</strong></div>
                    {req.expectedDurationNote && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-accent-mint)', fontStyle: 'italic', maxWidth: '200px', marginTop: '0.2rem' }}>
                        "{req.expectedDurationNote}"
                      </div>
                    )}
                  </td>

                  <td>
                    {formatDate(req.startDateTime)}
                  </td>

                  <td>
                    <strong style={{ color: 'var(--color-accent-mint)' }}>
                      ₹{req.estimatedBasePrice.toLocaleString('en-IN')}
                    </strong>
                  </td>

                  <td>
                    <StatusBadge status={req.status} />
                  </td>

                  <td>
                    <div style={{ fontSize: '0.825rem', color: 'var(--color-text-body)', maxWidth: '240px', lineHeight: '1.4' }}>
                      {req.adminNotes || '—'}
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => openActionModal(req)}
                      className="btn btn-outline btn-sm"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Status & Notes Modal */}
      {editingRequest && (
        <Modal
          isOpen={!!editingRequest}
          onClose={() => setEditingRequest(null)}
          title={`Update Request ${editingRequest.id} — ${editingRequest.carName}`}
          maxWidth="600px"
        >
          <form onSubmit={handleSaveAction}>
            <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div className="form-row" style={{ gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Customer</span>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-bright)' }}>{editingRequest.customerName} ({editingRequest.customerPhone})</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Requested Duration</span>
                  <div style={{ fontWeight: 600 }}>{editingRequest.duration}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Scheduled Time</span>
                  <div style={{ fontWeight: 600 }}>{formatDate(editingRequest.startDateTime)}</div>
                </div>
              </div>

              {editingRequest.expectedDurationNote && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Customer Duration Note:</span>
                  <div style={{ fontSize: '0.85rem', fontStyle: 'italic', marginTop: '0.2rem' }}>
                    "{editingRequest.expectedDurationNote}"
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Rental Status *</label>
              <select
                className="form-control"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                required
              >
                <option value="Pending Confirmation">Pending Confirmation (Under Dispatch Review)</option>
                <option value="Confirmed">Confirmed (Vehicle Assigned & Scheduled)</option>
                <option value="Completed">Completed (Vehicle Returned & Closed)</option>
                <option value="Rejected">Rejected (Declined by Dispatcher)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Internal Operational Notes / Customer Notice
                <span className="form-label-optional"> (e.g. Extended to 30 hrs, Aadhaar verified, Deposit paid)</span>
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add dispatch notes, extension approvals, or verification remarks..."
              />
            </div>

            <div className="modal-footer" style={{ margin: '1.5rem -1.75rem -1.75rem', padding: '1.25rem 1.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditingRequest(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save & Apply Status
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

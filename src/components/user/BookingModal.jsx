import React, { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';

export default function BookingModal({ car, isOpen, onClose, onSuccess }) {
  const { currentUser, addRequest } = useApp();

  const [duration, setDuration] = useState('24 Hours'); // '12 Hours', '24 Hours', '24+ Hours'
  const [expectedDurationNote, setExpectedDurationNote] = useState('');
  
  // Default start date: tomorrow 09:00 AM
  const getDefaultDateTime = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T09:00`;
  };

  const [startDateTime, setStartDateTime] = useState(getDefaultDateTime);
  const [customerName, setCustomerName] = useState(currentUser ? currentUser.name : '');
  const [customerPhone, setCustomerPhone] = useState(currentUser ? currentUser.phone : '');
  const [customerEmail, setCustomerEmail] = useState(currentUser ? currentUser.email : '');
  const [error, setError] = useState('');

  if (!car) return null;

  // Calculate base price
  let estimatedPrice = car.price24Hr;
  if (duration === '12 Hours') {
    estimatedPrice = car.price12Hr;
  } else if (duration === '24+ Hours') {
    estimatedPrice = car.price24Hr; // base 24h floor, final settled upon staff confirmation
  }

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please provide your full name and contact phone number.');
      return;
    }

    if (!startDateTime) {
      setError('Please select your preferred vehicle pickup date and time.');
      return;
    }

    if (duration === '24+ Hours' && !expectedDurationNote.trim()) {
      setError('Please specify your expected duration and journey details in the note field below.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newRequest = await addRequest({
        carId: car.id,
        carName: car.name,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim(),
        duration,
        expectedDurationNote: expectedDurationNote.trim(),
        startDateTime,
        estimatedBasePrice: estimatedPrice
      });

      onClose();
      if (onSuccess) {
        onSuccess(newRequest);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit booking request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Booking Request: ${car.name}`} maxWidth="620px">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div className="form-label">Selected Vehicle Model</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--color-bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <div>
              <strong style={{ color: 'var(--color-accent-mint)', fontSize: '1.05rem' }}>{car.name}</strong>
              <span style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                ({car.category})
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-bright)', fontWeight: 600 }}>
              Fixed Slot Rental
            </div>
          </div>
        </div>

        {/* Duration Choice */}
        <div className="form-group">
          <label className="form-label">Select Rental Duration Slot *</label>
          <div className="slot-options">
            <div 
              className={`slot-option-card ${duration === '12 Hours' ? 'selected' : ''}`}
              onClick={() => setDuration('12 Hours')}
            >
              <div className="slot-title">12 Hours</div>
              <div className="slot-price">₹{car.price12Hr.toLocaleString('en-IN')}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>Minimum Slot</span>
            </div>

            <div 
              className={`slot-option-card ${duration === '24 Hours' ? 'selected' : ''}`}
              onClick={() => setDuration('24 Hours')}
            >
              <div className="slot-title">24 Hours</div>
              <div className="slot-price">₹{car.price24Hr.toLocaleString('en-IN')}</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>Standard Slot</span>
            </div>

            <div 
              className={`slot-option-card ${duration === '24+ Hours' ? 'selected' : ''}`}
              onClick={() => setDuration('24+ Hours')}
            >
              <div className="slot-title">24+ Hours</div>
              <div className="slot-price">Custom / Multi-day</div>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-text-subtle)' }}>Prior Notice Req.</span>
            </div>
          </div>
        </div>

        {/* 24+ Hours Explanation */}
        {duration === '24+ Hours' && (
          <div className="form-group">
            <label className="form-label">
              Expected Duration & Trip Details *
              <span className="form-label-optional"> (Informing us in advance avoids unexpected late overage charges)</span>
            </label>
            <textarea
              className="form-control"
              rows={2}
              value={expectedDurationNote}
              onChange={(e) => setExpectedDurationNote(e.target.value)}
              placeholder="e.g., Requesting for 36 hours / 3 full days for an outstation trip to Chandigarh..."
              required
            />
          </div>
        )}

        {/* Preferred Date & Time */}
        <div className="form-group">
          <label className="form-label">Preferred Pickup Date & Time *</label>
          <input
            type="datetime-local"
            className="form-control"
            value={startDateTime}
            onChange={(e) => setStartDateTime(e.target.value)}
            required
          />
        </div>

        {/* Customer Contact Information */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Your Full Name *</label>
            <input
              type="text"
              className="form-control"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone Number *</label>
            <input
              type="tel"
              className="form-control"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +91 98765 00000"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address <span className="form-label-optional">(For booking confirmation updates)</span></label>
          <input
            type="email"
            className="form-control"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>

        {/* Rental Context / Policy Notice */}
        <div className="notice-box" style={{ marginBottom: '1.5rem' }}>
          <strong>Pickup Verification Notice:</strong>
          <ul style={{ margin: '0.4rem 0 0 1.25rem', padding: 0 }}>
            <li>Original Government Aadhaar Card & Driving License must be presented at vehicle handover.</li>
            <li>Refundable security deposit is collected directly at pickup point.</li>
            <li>Late returns exceeding 24 hours without prior notice incur <strong>₹{car.overageRatePerHr}/hr</strong> overage.</li>
          </ul>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #7f1d1d', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <div className="modal-footer" style={{ margin: '0 -1.75rem -1.75rem', padding: '1.25rem 1.75rem' }}>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Submit Booking Request
          </button>
        </div>
      </form>
    </Modal>
  );
}

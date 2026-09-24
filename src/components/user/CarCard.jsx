import React from 'react';
import CarImage from '../common/CarImage';

export default function CarCard({ car, onRequestClick }) {
  return (
    <div className="car-card">
      <div className="car-image-container">
        <CarImage imageUrl={car.imageUrl} alt={car.name} />
      </div>

      <div className="car-card-body">
        <h3 className="car-title">{car.name}</h3>
        <div className="car-type-tag">
          {car.category} • {car.seating} • {car.transmission}
        </div>

        <div className="pricing-table-box">
          <div className="price-row">
            <span className="price-label">12-Hour Slot</span>
            <span className="price-value">₹{car.price12Hr.toLocaleString('en-IN')}</span>
          </div>
          <div className="price-row">
            <span className="price-label">24-Hour Slot</span>
            <span className="price-value">₹{car.price24Hr.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="overage-notice">
          <strong>Overage Policy:</strong> ₹{car.overageRatePerHr}/hr if returned past 24 hrs without prior notice.
        </div>

        <div className="car-card-actions">
          <button 
            type="button"
            onClick={() => onRequestClick(car)}
            className="btn btn-primary btn-block"
          >
            Request Booking
          </button>
        </div>
      </div>
    </div>
  );
}

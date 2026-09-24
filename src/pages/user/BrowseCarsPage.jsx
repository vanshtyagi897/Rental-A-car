import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import CarCard from '../../components/user/CarCard';
import BookingModal from '../../components/user/BookingModal';
import AboutSection from '../../components/user/AboutSection';
import FAQSection from '../../components/user/FAQSection';
import ContactSection from '../../components/user/ContactSection';

export default function BrowseCarsPage() {
  const { cars } = useApp();
  const navigate = useNavigate();

  const [selectedCar, setSelectedCar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const handleRequestClick = (car) => {
    setSelectedCar(car);
    setIsModalOpen(true);
  };

  const handleBookingSuccess = (newRequest) => {
    navigate('/requests', { state: { justSubmitted: newRequest.id } });
  };

  const categories = ['All', 'SUV', 'Sedan', 'Hatchback', 'Utility'];

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          car.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    return matchesSearch && car.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="container">
      {/* Hero / Philosophy Section */}
      <section style={{ marginBottom: '2.5rem', paddingTop: '1rem' }}>
        <div className="card card-cream" style={{ padding: '2.25rem' }}>
          <div style={{ maxWidth: '820px' }}>
            <span className="badge badge-accent" style={{ marginBottom: '0.75rem' }}>
              Structured Time Slots
            </span>
            <h1 style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>
              Fixed-Slot Fleet Rentals for Business &amp; Travel
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-body)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              We operate on dedicated <strong>12-Hour</strong> and <strong>24-Hour</strong> fixed time blocks with guaranteed flat pricing. No fluctuating hourly rates or hidden surcharges. Select a model below to submit your reservation request.
            </p>

            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Minimum Booking</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>12 Hours Flat</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Standard Booking</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>24 Hours Flat</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Extended Trips</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>24+ Hours (Advance Notice)</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Verification</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-accent-mint)' }}>Aadhaar at Pickup</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <section style={{ marginBottom: '2rem' }}>
        <div className="filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by vehicle model or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: '380px' }}
            />
          </div>

          <div className="filter-pills">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'All' ? 'All Models' : cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Catalog Grid */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
          <h2>Available Fleet Models ({filteredCars.length})</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Submit request for dispatch confirmation
          </span>
        </div>

        {filteredCars.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>No vehicles matched your criteria</h3>
            <p style={{ color: 'var(--color-text-subtle)', marginBottom: '1.25rem' }}>
              Try adjusting your search query or category filters.
            </p>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="cars-grid">
            {filteredCars.map(car => (
              <CarCard
                key={car.id}
                car={car}
                onRequestClick={handleRequestClick}
              />
            ))}
          </div>
        )}
      </section>

      {/* About Us Section */}
      <AboutSection />

      {/* Frequently Asked Questions Section */}
      <FAQSection />

      {/* Contact Us Section */}
      <ContactSection />

      {/* Booking Dialog Modal */}
      {selectedCar && (
        <BookingModal
          car={selectedCar}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedCar(null); }}
          onSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}

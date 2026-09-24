import React from 'react';

export default function AboutSection() {
  return (
    <section id="about" className="about-section" style={{ marginTop: '4.5rem', marginBottom: '3.5rem' }}>
      <div className="card card-cream" style={{ padding: '2.5rem' }}>
        <div style={{ maxWidth: '880px', marginBottom: '2.25rem' }}>
          <span className="badge badge-accent" style={{ marginBottom: '0.75rem' }}>
            About Us
          </span>
          <h2 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>
            Reliable Fleet Operations in Siyana &amp; Bulandshahr
          </h2>
          <p style={{ fontSize: '1.025rem', color: 'var(--color-text-body)', lineHeight: '1.75', marginBottom: '1.25rem' }}>
            K&amp;K Car Rentals operates out of Siyana, Bulandshahr, Uttar Pradesh, serving Siyana and the surrounding areas. What started small has grown steadily over the past 6+ months, and today we run a fleet of 20+ cars available on request.
          </p>
          <p style={{ fontSize: '1.025rem', color: 'var(--color-text-body)', lineHeight: '1.75' }}>
            We're not just here to hand over a set of keys. Every rental is backed by a verified process — ID checks, a recorded handover, and clear, fixed pricing set per vehicle — so both sides know exactly where they stand. Our goal is simple: make renting a car a straightforward, dependable experience, every single time.
          </p>
        </div>

        {/* 3 Stat Highlights */}
        <div className="about-stats-grid">
          <div className="about-stat-item">
            <span className="about-stat-value">20+</span>
            <span className="about-stat-label">Cars in Fleet</span>
            <span className="about-stat-desc">Available on request</span>
          </div>

          <div className="about-stat-item">
            <span className="about-stat-value">6+</span>
            <span className="about-stat-label">Months of Operation</span>
            <span className="about-stat-desc">Trusted local service</span>
          </div>

          <div className="about-stat-item">
            <span className="about-stat-value" style={{ fontSize: '1.5rem', marginTop: '0.35rem' }}>Siyana</span>
            <span className="about-stat-label">Bulandshahr, Uttar Pradesh</span>
            <span className="about-stat-desc">Core service region</span>
          </div>
        </div>
      </div>
    </section>
  );
}

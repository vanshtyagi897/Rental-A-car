import React from 'react';

export default function ContactSection() {
  return (
    <section id="contact" className="contact-section" style={{ marginTop: '3.5rem', marginBottom: '3.5rem' }}>
      <div className="card card-white" style={{ padding: '2.5rem', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <span className="badge badge-accent" style={{ marginBottom: '0.75rem' }}>
              Direct Contact
            </span>
            <h2 style={{ fontSize: '1.85rem', marginBottom: '1rem' }}>
              Contact K&amp;K Car Rentals
            </h2>
            <p style={{ color: 'var(--color-text-body)', lineHeight: '1.6', marginBottom: '1.5rem', fontSize: '0.975rem' }}>
              Have questions regarding vehicle allocation, special outstation trips, or pick-up timings? Reach out directly to our fleet management desk.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ background: 'rgba(159, 237, 215, 0.12)', border: '1px solid var(--color-accent-mint)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--color-accent-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '38px', height: '38px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Phone / WhatsApp</div>
                  <a 
                    href="tel:+919997784944" 
                    style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent-mint)', textDecoration: 'none', display: 'inline-block', marginTop: '0.15rem' }}
                  >
                    +91 99977 84944
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ background: 'rgba(252, 225, 129, 0.12)', border: '1px solid var(--color-accent-gold)', borderRadius: 'var(--radius-sm)', padding: '0.5rem', color: 'var(--color-accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '38px', height: '38px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Service Area</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-bright)', marginTop: '0.15rem' }}>
                    Siyana &amp; nearby areas, Bulandshahr, Uttar Pradesh
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--color-bg-input)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1.75rem' }}>
            <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-heading)', fontSize: '1.1rem' }}>
              Pickup &amp; Handover Guidelines
            </h4>
            <p style={{ fontSize: '0.885rem', color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: '1rem' }}>
              All rentals are dispatched from our Siyana base location following an in-person Aadhaar check, security verification, and a brief walkthrough video record before handing over the keys.
            </p>
            <a 
              href="tel:+919997784944" 
              className="btn btn-primary btn-block"
            >
              Call Fleet Desk: +91 99977 84944
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

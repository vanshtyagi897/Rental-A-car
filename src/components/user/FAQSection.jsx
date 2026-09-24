import React, { useState } from 'react';

const FAQ_DATA = [
  {
    id: 'faq-1',
    question: 'How does booking work — can I see if a car is available right now?',
    answer: "You submit a request for the car and duration you want. Our team reviews it and confirms directly with you — live availability isn't shown on the site."
  },
  {
    id: 'faq-2',
    question: 'What rental durations do you offer?',
    answer: 'Two fixed slots: 12 hours (minimum) and 24 hours (standard). Each car has its own flat price per slot, not calculated hourly.'
  },
  {
    id: 'faq-3',
    question: 'What if I need the car for more than 24 hours?',
    answer: 'Inform us in advance to avoid extra charges. Late returns without notice incur a per-hour overage rate that varies by car.'
  },
  {
    id: 'faq-4',
    question: 'What do I need to bring to pick up the car?',
    answer: 'Aadhar card as ID proof, and a personal asset (e.g. a bike) held as security. A short video is recorded before handover.'
  },
  {
    id: 'faq-5',
    question: 'How is pricing decided for each car?',
    answer: 'Each car has its own 12-hour price, 24-hour price, and overage rate, set by our team and always current on the site.'
  },
  {
    id: 'faq-6',
    question: 'Do I need an account to request a car?',
    answer: 'Yes — it lets you track request status under "My Requests."'
  },
  {
    id: 'faq-7',
    question: 'What happens after I submit a request?',
    answer: 'Status shows Pending until reviewed, then updates to Confirmed with pickup details.'
  }
];

export default function FAQSection() {
  const [openId, setOpenId] = useState(null);

  const handleToggle = (id) => {
    setOpenId((prevId) => (prevId === id ? null : id));
  };

  return (
    <section className="faq-section">
      <div className="faq-header">
        <span className="badge badge-accent" style={{ marginBottom: '0.75rem' }}>
          Frequently Asked Questions
        </span>
        <h2>Everything You Need to Know</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
          Key operational guidelines, duration rules, and security verification details.
        </p>
      </div>

      <div className="faq-list">
        {FAQ_DATA.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="faq-trigger"
                onClick={() => handleToggle(item.id)}
                aria-expanded={isOpen}
              >
                <span className="faq-question">{item.question}</span>
                <span className="faq-indicator" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div className="faq-content">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import { getCarImage } from '../../data/carImages';

export default function CarImage({ imageUrl, alt = '', className = '' }) {
  const [hasError, setHasError] = useState(false);

  // Resolve image from custom url or imported asset by car name
  const resolvedSrc = getCarImage(alt, imageUrl);
  const isPlaceholder = !resolvedSrc || resolvedSrc.trim() === '#' || resolvedSrc.trim() === '';

  if (isPlaceholder || hasError) {
    return (
      <div className={`car-placeholder-box ${className}`}>
        <svg 
          className="car-placeholder-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-bright)' }}>{alt}</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-subtle)' }}>Vehicle Photo Placeholder</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`car-image ${className}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}

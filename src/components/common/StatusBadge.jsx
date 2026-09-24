import React from 'react';

export default function StatusBadge({ status }) {
  const getBadgeClass = (s) => {
    switch (s) {
      case 'Pending Confirmation':
      case 'Pending':
        return 'badge-pending';
      case 'Confirmed':
        return 'badge-confirmed';
      case 'Rejected':
        return 'badge-rejected';
      case 'Completed':
        return 'badge-completed';
      default:
        return 'badge-neutral';
    }
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`}>
      {status}
    </span>
  );
}

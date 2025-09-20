import React from 'react';

// Heroicons 'ArrowsPointingOutIcon'
export const ArrowsPointingOutIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m-1.5 11.25l-6-6m6 6v-4.5m0 4.5h-4.5M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15" />
    </svg>
);
import React from 'react';

// Replaced the original confusing icon with a clear bandage icon to represent 'Photo Restoration'.
export const BandageIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.42 3.34c-1.17-1.17-3.07-1.17-4.24 0l-3.23 3.23c-1.42 1.42-1.42 3.72 0 5.14l.01.01c.78.78 2.05.78 2.83 0l1.41-1.41 2.83 2.83-1.41 1.41c-.78.78-2.05.78-2.83 0l-.01-.01c-1.42-1.42-3.72-1.42-5.14 0l-3.23 3.23c-1.17 1.17-1.17 3.07 0 4.24 1.17 1.17 3.07 1.17 4.24 0l3.23-3.23c1.42-1.42 1.42-3.72 0-5.14l-.01-.01c-.78-.78-2.05-.78-2.83 0l-1.41 1.41-2.83-2.83 1.41-1.41c.78-.78 2.05-.78 2.83 0l.01.01c1.42 1.42 3.72 1.42 5.14 0l3.23-3.23c1.17-1.18 1.17-3.08 0-4.25z"/>
      <path d="M12 11c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM8 7c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm8 8c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
    </svg>
);

import React from 'react';

// Heroicons 'PhotoIcon' solid
export const LandscapeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06l4.42-4.42a1.5 1.5 0 012.12 0l1.06 1.06L12 11.06l3.53 3.53a.75.75 0 001.06 0l2.47-2.47V18H3.75a.75.75 0 01-.75-.75V16.06zM15 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
  </svg>
);
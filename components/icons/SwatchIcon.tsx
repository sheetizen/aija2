import React from 'react';

// Heroicons 'SwatchIcon' solid
export const SwatchIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M5.533 3.533a1.5 1.5 0 011.694-.23 3.75 3.75 0 013.533 3.533V17.25a3.75 3.75 0 01-3.533 3.533 1.5 1.5 0 01-1.694-.23 3.75 3.75 0 01-3.533-3.533V7.25a3.75 3.75 0 013.533-3.533zM10.75 12a1.5 1.5 0 00-1.5 1.5v2.25a1.5 1.5 0 003 0v-2.25a1.5 1.5 0 00-1.5-1.5z" />
    <path d="M15.182 3.32a.75.75 0 01.916.216l3.565 4.67a.75.75 0 01-.892 1.2L15.603 6.9a.75.75 0 01.216-.916z" />
    <path fillRule="evenodd" d="M11.642 3.03a.75.75 0 01.812 1.213l-2.68 3.513a.75.75 0 01-1.213-.812l2.68-3.513a.75.75 0 01.401-.4z" clipRule="evenodd" />
    <path d="M12.932 18.916a.75.75 0 01.127.034l5.126 1.708a.75.75 0 01-.434 1.414l-5.126-1.708a.75.75 0 01.307-1.448z" />
    <path fillRule="evenodd" d="M17.31 16.516a.75.75 0 01.488 1.13l-2.072 4.316a.75.75 0 11-1.268-.61l2.072-4.316a.75.75 0 01.78-.52z" clipRule="evenodd" />
  </svg>
);

import React from 'react';

// Replaced original icon with a clear Magic Wand to better represent AI-driven style changes.
export const BrushIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.23 2.45c.34-.6.99-.95 1.7-.95.72 0 1.37.35 1.72.96l.89 1.54 1.7.25c.73.11 1.3.61 1.52 1.28.22.68-.04 1.44-.6 1.86l-1.23 1.07.29 1.69c.13.72-.21 1.46-.86 1.83-.65.37-1.43.33-2.03-.1L12 11.9l-1.52.8c-.6.39-1.38.44-2.03.1-.65-.37-.99-1.11-.86-1.83l.29-1.69-1.23-1.07c-.56-.42-.82-1.18-.6-1.86.22-.67-.79-1.17 1.52-1.28l1.7-.25.89-1.54zM9.54 12.5l-6.36 6.36c-.78.78-.78 2.05 0 2.83l.07.07c.78.78 2.05.78 2.83 0l6.36-6.36-1.45-1.45-1.45-1.45z"/>
    </svg>
);

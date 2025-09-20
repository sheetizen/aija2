import React from 'react';

// A clear and simple magic wand icon to represent the 'Magic Eraser' tool.
export const MagicWandIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 011.06 0l1.25 1.25a.75.75 0 010 1.06l-2.086 2.086a.75.75 0 01-1.25.217l-1.554-1.554a.75.75 0 01.217-1.25L9.528 1.718zM9.97 6.115a.75.75 0 01.217-1.25l1.554-1.554a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-2.086 2.086a.75.75 0 01-1.25.217l-1.554-1.554a.75.75 0 01.217-1.25L14.939 9.5l-4.25-4.25L9.97 6.115z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M12.91 12.082a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L16.19 18l-3.28-3.28a.75.75 0 010-1.06zM3 13.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM3 17.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM7.5 19.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H8.25a.75.75 0 01-.75-.75zM11.25 19.5a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75z" clipRule="evenodd" />
    </svg>
);

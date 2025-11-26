import React from 'react';

interface VairifyLogoProps {
  size?: number;
  className?: string;
}

/**
 * Vairify Logo Component
 * Standalone double-checkmark logo with white fill and navy outline
 * No number, no circle - just the double-checkmark design
 */
export const VairifyLogo: React.FC<VairifyLogoProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Double-checkmark design - two overlapping checkmarks */}
      {/* First checkmark - navy outline */}
      <path
        d="M6 11L9.5 14.5L18 6"
        stroke="#1e40af"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Second checkmark - navy outline (slightly offset) */}
      <path
        d="M5 10L8.5 13.5L17 5"
        stroke="#1e40af"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* First checkmark - white fill */}
      <path
        d="M6 11L9.5 14.5L18 6"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Second checkmark - white fill */}
      <path
        d="M5 10L8.5 13.5L17 5"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
  );
};


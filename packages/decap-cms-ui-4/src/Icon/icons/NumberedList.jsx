import React from 'react';

const SVG = ({ className = '', size = '24' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="9" y1="6" x2="22" y2="6" />
    <line x1="9" y1="12" x2="22" y2="12" />
    <line x1="9" y1="18" x2="22" y2="18" />
    <polyline points="4,10 4,4 2,5.4 " />
    <path d="M5,20H2c2-2.5,3-4,3-4.5C5,14.8,4.3,14,3.5,14C2.7,14,2,14.7,2,15.5" />
  </svg>
);

export default SVG;

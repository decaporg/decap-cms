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
    <rect x="2" y="2" width="4" height="20" rx="1" />
    <rect x="10" y="2" width="4" height="12" rx="1" />
    <rect x="18" y="2" width="4" height="16" rx="1" />
  </svg>
);

export default SVG;

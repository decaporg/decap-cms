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
    <path d="M9,11 L9,16 L15,16 L15,11 L21,11 L21,16 L21,16 L21,21 L3,21 L3,11 L9,11 Z M15,3 L15,8 L9,8 L9,3 L15,3 Z"></path>
  </svg>
);

export default SVG;

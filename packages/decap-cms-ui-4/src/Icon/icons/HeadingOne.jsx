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
    <polyline points="3,20 3,12 13,12 13,20 " />
    <polyline points="20,20 20,12 18.1,13.9 " />
    <polyline points="13,4 13,12 3,12 3,4 " />
  </svg>
);

export default SVG;

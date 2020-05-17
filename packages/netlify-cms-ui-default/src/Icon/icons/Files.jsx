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
    <path d="M13,3H7C5.9,3,5,3.9,5,5v12c0,1.1,0.9,2,2,2h8c1.1,0,2-0.9,2-2V8L13,3z" />
    <polyline points="12,3 12,9 17,9 " />
    <path d="M9,23h10c1.11,0,2-0.9,2-2v-9" />
  </svg>
);

export default SVG;

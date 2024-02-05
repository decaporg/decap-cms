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
    <path d="M3,3h18c1.1,0,2,0.9,2,2v14c0,1.1-0.9,2-2,2H3c-1.1,0-2-0.9-2-2V5C1,3.9,1.9,3,3,3z" />
    <polyline points="9,8 5,12 9,16 " />
  </svg>
);

export default SVG;

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
    <path
      d="M16.9,19.2h1.2c0.8,0,1.5-0.4,1.8-1.1l1.3-2.8c0.5-1.1,0.8-2.2,0.8-3.4V7.2c0-1.1-0.9-2-2-2h-4c-1.1,0-2,0.9-2,2v4.4
		c0,1.1,0.9,2,2,2h2l-2,4.2c-0.2,0.5,0,1.1,0.5,1.3C16.6,19.2,16.8,19.2,16.9,19.2z M4.9,19.2h1.2c0.8,0,1.5-0.4,1.8-1.1l1.3-2.8
		C9.7,14.2,10,13,10,11.8V7.2c0-1.1-0.9-2-2-2H4c-1.1,0-2,0.9-2,2v4.4c0,1.1,0.9,2,2,2h2l-2,4.2c-0.2,0.5,0,1.1,0.5,1.3
		C4.6,19.2,4.8,19.2,4.9,19.2z"
    />
  </svg>
);

export default SVG;

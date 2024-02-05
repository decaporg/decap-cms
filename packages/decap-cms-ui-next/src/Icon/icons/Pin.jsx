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
    <polygon points="14.2218254 2 22 9.77817459 20.5857864 11.1923882 17.7573593 11.1923882 13.5147186 15.4350288 13.5147186 18.263456 12.1005051 19.6776695 4.32233047 11.8994949 5.73654403 10.4852814 8.56497116 10.4852814 12.8076118 6.24264069 12.8076118 3.41421356"></polygon>
    <line x1="8.21141777" y1="15.7885822" x2="2.55456352" y2="21.4454365"></line>
  </svg>
);

export default SVG;

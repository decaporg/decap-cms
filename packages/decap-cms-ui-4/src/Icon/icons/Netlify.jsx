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
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M13.7055416,1.70554156 L22.2944584,10.2944584 C23.236403,11.236403 23.236403,12.763597 22.2944584,13.7055416 L13.7055416,22.2944584 C12.763597,23.236403 11.236403,23.236403 10.2944584,22.2944584 L1.70554156,13.7055416 C0.763596965,12.763597 0.763596965,11.236403 1.70554156,10.2944584 L10.2944584,1.70554156 C11.236403,0.763596965 12.763597,0.763596965 13.7055416,1.70554156 Z"
      id="Rectangle"
      strokeWidth="2"
    ></path>
    <circle id="Oval" cx="11" cy="7" r="1"></circle>
    <circle id="Oval-Copy-2" cx="17" cy="10" r="1"></circle>
    <circle id="Oval-Copy-3" cx="16" cy="15" r="1"></circle>
    <circle id="Oval-Copy" cx="7" cy="13" r="1"></circle>
    <line x1="13.6857374" y1="2.95477387" x2="5" y2="16" id="Line"></line>
    <line x1="17.6561729" y1="6.5520144" x2="15" y2="19.9664341" id="Line"></line>
    <line x1="1.81602838" y1="11.758794" x2="19.2749692" y2="15.7386935" id="Line"></line>
    <line x1="2.97" y1="14.1877629" x2="20.1" y2="9" id="Line"></line>
    <line x1="7.80751716" y1="5.30653266" x2="22.0399509" y2="12.5427136" id="Line"></line>
    <line x1="3.76738633" y1="8.92462312" x2="12.843138" y2="22.0701339" id="Line"></line>
  </svg>
);

export default SVG;

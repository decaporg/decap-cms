import React from 'react';

function DecapMark({ size = '32' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 94 90"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Decap logomark"
    >
      <path
        d="M30.73 0.149188L0 2.94919L3.67 43.1592L23.7 41.3292L21.71 19.4692L32.42 18.4892C43.03 17.5192 51.56 26.0192 52.71 38.6792L72.38 36.8892C70.34 14.7192 51.64 -1.75081 30.73 0.149188Z"
        fill="#FF0082"
      />
      <path
        d="M73.61 49.5091C73.61 62.2291 65.88 71.4591 55.24 71.4591H44.49V49.4691H24.38V89.8891H55.24C76.26 89.8891 93.36 71.7791 93.36 49.5091C93.36 49.4991 93.36 49.4891 93.36 49.4691H73.61C73.61 49.4691 73.61 49.4891 73.61 49.5091Z"
        fill="#FF0082"
      />
    </svg>
  );
}

export default DecapMark;

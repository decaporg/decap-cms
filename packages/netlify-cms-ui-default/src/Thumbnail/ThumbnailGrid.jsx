import React from 'react';
import styled from '@emotion/styled';

const ThumbnailGrid = styled.div`
  display: grid;
  grid-gap: 1rem;
  width: 100%;

  /* Partially responsive fallback */
  grid-template-columns: repeat(auto-fill, minmax(calc(10% + 7.5rem), 1fr));

  /* Fully responsive version */
  grid-template-columns: repeat(auto-fill, minmax(min(15rem, 100%), 1fr));
`;

export default ThumbnailGrid;

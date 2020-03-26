import React from 'react';
import styled from '@emotion/styled';

const ThumbnailGrid = styled.div`
  display: grid;
  grid-gap: 1rem;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(min(${({horizontal}) => horizontal ? 24 : 16}rem, 100%), 1fr));
`;

export default ThumbnailGrid;

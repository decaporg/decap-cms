import React from 'react';
import styled from '@emotion/styled';

const StyledSeparator = styled.div`
  height: 1px;
  background-color: ${({ theme }) => theme.color.border};
  margin: 0.5rem 0;
`;

function MenuSeparator() {
  return <StyledSeparator />;
}

export default MenuSeparator;

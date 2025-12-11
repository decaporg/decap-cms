import React from 'react';
import styled from '@emotion/styled';
import { colors, lengths } from 'decap-cms-ui-default';

const StyledCode = styled.code`
  background-color: ${colors.background};
  border-radius: ${lengths.borderRadius};
  padding: 0 2px;
  font-size: 85%;
`;

function CodeLeaf({ children, ...props }) {
  return (
    <StyledCode asChild {...props}>{children}</StyledCode>
  );
}

export default CodeLeaf;

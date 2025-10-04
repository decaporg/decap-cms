import React from 'react';
import { PlateElement, useElement } from '@udecode/plate-common/react';
import { useLink } from '@udecode/plate-link/react';
import styled from '@emotion/styled';

const StyledA = styled.a`
  text-decoration: underline;
  font-size: inherit;
`;

function LinkElement({ children, ...rest }) {
  const element = useElement();
  const { props } = useLink({ element });
  return (
    <PlateElement asChild {...props} {...rest}>
      <StyledA>{children}</StyledA>
    </PlateElement>
  );
}

export default LinkElement;

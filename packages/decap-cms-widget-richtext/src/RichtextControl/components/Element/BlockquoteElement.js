import React from 'react';
import { PlateElement } from '@udecode/plate-common/react';
import styled from '@emotion/styled';
import { colors } from 'decap-cms-ui-default';

const bottomMargin = '16px';

const StyledBlockQuote = styled.blockquote`
  padding-left: 16px;
  border-left: 3px solid ${colors.background};
  margin-left: 0;
  margin-right: 0;
  margin-bottom: ${bottomMargin};
`;

function BlockquoteElement({ children, ...props }) {
  return (
    <PlateElement asChild {...props}>
      <StyledBlockQuote>{children}</StyledBlockQuote>
    </PlateElement>
  );
}

export default BlockquoteElement;

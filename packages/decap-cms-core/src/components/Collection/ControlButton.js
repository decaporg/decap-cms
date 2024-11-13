import React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { buttons, StyledDropdownButton, colors } from 'decap-cms-ui-default';

const Button = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.grayText};
  font-size: clamp(12px, 3.3vw, 14px);

  &:after {
    top: 50%;
    transform: translateY(-50%);
  }
`;

export function ControlButton({ active, title }) {
  return (
    <Button
      css={css`
        color: ${active ? colors.active : undefined};
      `}
    >
      {title}
    </Button>
  );
}

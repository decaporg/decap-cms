import React from 'react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { buttons, StyledDropdownButton, colors } from 'decap-cms-ui-default';

const Button = styled(StyledDropdownButton)`
  ${buttons.button};
  ${buttons.medium};
  ${buttons.grayText};
  font-size: 14px;

  &:after {
    top: 11px;
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

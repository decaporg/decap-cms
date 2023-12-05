import { css } from '@emotion/core';
import styled from '@emotion/styled';

import theme from '../theme';

// prettier-ignore
const Button = styled.button`
  display: inline-block;
  background: ${theme.colors.primaryDark};
  color: white;
  border-radius: ${theme.radii[1]};
  font-size: ${theme.fontsize[3]};
  font-weight: 700;
  padding: ${theme.space[2]} ${theme.space[3]};
  border: 2px solid ${theme.colors.primaryDark};
  cursor: pointer;
  transition: all 0.2s ease-out;
  box-shadow: 0;

  &:hover {
    box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.5);
  }

  &:active {
    box-shadow: inset 0 0 4px 0 rgba(0, 0, 0, 0.5);
  }

  ${p => p.block && css`
    display: block;
    width: 100%;
  `};

  ${p => p.outline && css`
    background: none;
    color: ${theme.colors.primaryDark};
    font-weight: 500;
  `};

  ${p => p.active && css`
    box-shadow: inset 0 0 4px 0 rgba(0, 0, 0, 0.5);
  `};
`;

export default Button;

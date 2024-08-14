import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import Color from 'color';

import BadgeGroup from './BadgeGroup';
import Icon from '../Icon';

const BadgeWrap = styled.div`
  display: inline-flex;
  background-color: ${({ color, variant, theme }) =>
    Color(theme.color[color][color === 'neutral' ? 600 : 900])
      .alpha(variant === 'solid' ? 1 : 0.15)
      .string()};
  box-shadow: ${({ color, variant, theme }) => css`inset 0 0 0 ${
    variant === 'outline' ? '1.5px' : 0
  }
    ${theme.color[color][color === 'neutral' ? 600 : 900]}`};
  color: ${({ color, variant, theme }) =>
    variant === 'solid' ? 'white' : theme.color[color][color === 'neutral' ? 600 : 900]};
  font-size: ${({ size }) => (size === 'sm' ? '0.75rem;' : size === 'md' ? '1rem' : '1rem')};
  line-height: ${({ size }) => (size === 'sm' ? '1.25rem' : size === 'md' ? '1.5rem' : '1.75rem')};
  /* line-height: 1.25rem; */
  font-weight: bold;
  /* padding: 0 0.375rem; */
  padding: ${({ size }) => (size === 'sm' ? '0 0.375rem' : '0 0.525rem')};
  border-radius: ${({ radius }) =>
    radius === 'full' ? '9999px' : radius === 'none' ? 0 : '0.25rem'};
  word-wrap: nowrap;
  justify-content: center;
  align-items: center;
  transition: 200ms;
  ${BadgeGroup} & {
    margin: 4px;
  }
  ${({ onClick, color, theme }) =>
    onClick
      ? css`
          cursor: pointer;
          &:hover {
            background-color: ${Color(theme.color[color][color === 'neutral' ? 600 : 900])
              .alpha(theme.darkMode ? 0.33 : 0.05)
              .string()};
          }
          &:active {
            background-color: ${Color(theme.color[color][color === 'neutral' ? 600 : 900])
              .alpha(theme.darkMode ? 0.05 : 0.33)
              .string()};
          }
        `
      : ``}
`;
const Caret = styled.div`
  display: inline-block;
  vertical-align: middle;
  width: 0;
  height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 4px solid;
  margin-left: 0.25rem;
`;
const DeleteWrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
const DeleteButton = styled(Icon)`
  stroke-width: 3;
  margin-left: 0.125rem;
  margin-right: -0.125rem;
  cursor: pointer;
`;
DeleteButton.defaultProps = { name: 'x', size: 'xs' };

type BadgeProps = {
  color?:
    | 'neutral'
    | 'green'
    | 'teal'
    | 'blue'
    | 'purple'
    | 'pink'
    | 'red'
    | 'orange'
    | 'yellow'
    | 'primary'
    | 'danger'
    | 'success';
  variant?: 'solid' | 'soft' | 'outline';
  radius?: 'none' | 'large' | 'full';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  hasMenu?: boolean;
};

function Badge({
  color,
  variant = 'solid',
  radius = 'large',
  size = 'sm',
  children,
  onClick,
  hasMenu,
  onDelete,
  ...props
}: BadgeProps) {
  return (
    <BadgeWrap
      color={color}
      variant={variant}
      size={size}
      radius={radius}
      onClick={onClick}
      {...props}
    >
      {children}
      {hasMenu && <Caret />}
      {onDelete && (
        <DeleteWrap
          onClick={e => {
            e.stopPropagation();
            onDelete(e);
          }}
        >
          <DeleteButton />
        </DeleteWrap>
      )}
    </BadgeWrap>
  );
}

Badge.defaultProps = {
  color: 'neutral',
};

export default Badge;

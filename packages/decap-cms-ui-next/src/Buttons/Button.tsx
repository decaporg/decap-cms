import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';
import color from 'color';

import Icon from '../Icon';
import ButtonGroup from './ButtonGroup';

import type { IconName } from '../Icon';

export const StyledButton = styled.button<ButtonProps>`
  ${({ theme, size, type, variant, transparent, disabled }) => css`
    font-family: ${theme.fontFamily};
    font-size: ${size === 'sm' ? 12 : size === 'lg' ? 14 : 14}px;
    padding: ${size === 'sm' ? `0 0.5rem` : size === 'lg' ? `0 1rem` : `0 0.75rem`};
    line-height: ${size === 'sm' ? `1.5rem` : size === 'lg' ? `2.5rem` : `2rem`};
    font-weight: 600;
    text-align: center;
    border-radius: ${size === 'sm' ? 4 : 6}px;
    border: 0;
    outline: 0;
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
    white-space: nowrap;
    transition: 200ms;
    background-color: ${transparent
      ? 'transparent'
      : variant === 'solid'
      ? type === 'success'
        ? theme.color.success['900']
        : type === 'danger'
        ? theme.color.danger['900']
        : type === 'neutral'
        ? theme.color.neutral[theme.darkMode ? '800' : '800']
        : theme.color.primary[900]
      : type === 'success'
      ? color(theme.color.success['900']).alpha(0.1).string()
      : type === 'danger'
      ? color(theme.color.danger['900']).alpha(0.1).string()
      : type === 'neutral'
      ? color(theme.color.neutral['700']).alpha(0.1).string()
      : color(theme.color.primary['900']).alpha(0.1).string()};
    color: ${variant === 'solid'
      ? '#FFFFFF'
      : type === 'success'
      ? theme.color.success[theme.darkMode ? '200' : '700']
      : type === 'danger'
      ? theme.color.danger[theme.darkMode ? '200' : '700']
      : type === 'neutral'
      ? theme.color.neutral[theme.darkMode ? '300' : '1000']
      : theme.color.primary[theme.darkMode ? '200' : '900']};
    ${disabled
      ? 'opacity: 0.5;'
      : `
          &:hover {
            background-color: ${
              transparent
                ? 'rgba(0,0,0,0.15)'
                : variant === 'solid'
                ? type === 'success'
                  ? theme.color.success['800']
                  : type === 'danger'
                  ? theme.color.danger['800']
                  : type === 'neutral'
                  ? theme.color.neutral['700']
                  : theme.color.primary['800']
                : type === 'success'
                ? color(theme.color.success['900'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
                : type === 'danger'
                ? color(theme.color.danger['900'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
                : type === 'neutral'
                ? color(theme.color.neutral['700'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
                : color(theme.color.primary['900'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
            };
          }
          &:focus,
          &:focus:hover {
            background-color: ${
              variant === 'solid'
                ? type === 'success'
                  ? theme.color.success['800']
                  : type === 'danger'
                  ? theme.color.danger['800']
                  : type === 'neutral'
                  ? theme.color.neutral['700']
                  : theme.color.primary['800']
                : type === 'success'
                ? color(theme.color.success['900'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
                : type === 'danger'
                ? color(theme.color.danger['900'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
                : type === 'neutral'
                ? color(theme.color.neutral['700'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
                : color(theme.color.primary['900'])
                    .alpha(theme.darkMode ? 0.35 : 0.2)
                    .string()
            };
          }
          &:active,
          &:active:focus {
            background-color: ${
              variant === 'solid'
                ? type === 'success'
                  ? theme.color.success['1000']
                  : type === 'danger'
                  ? theme.color.danger['1000']
                  : type === 'neutral'
                  ? theme.color.neutral['900']
                  : theme.color.primary['1000']
                : type === 'success'
                ? color(theme.color.success['500'])
                    .alpha(theme.darkMode ? 0.2 : 0.35)
                    .string()
                : type === 'danger'
                ? color(theme.color.danger['900'])
                    .alpha(theme.darkMode ? 0.2 : 0.35)
                    .string()
                : type === 'neutral'
                ? color(theme.color.neutral['700'])
                    .alpha(theme.darkMode ? 0.2 : 0.35)
                    .string()
                : color(theme.color.primary['900'])
                    .alpha(theme.darkMode ? 0.2 : 0.35)
                    .string()
            };
          }
          `}
    ${ButtonGroup} & {
      margin: 4px;
    }
  `}
  ${({ type, theme, iconOnly }) =>
    iconOnly
      ? `
      color: ${theme.color.neutral['700']};
      padding: 0 0.5rem;
      &,
      &:hover,
      &:focus,
      &:active,
      &:focus:hover,
      &:focus:active {
        background-color: transparent;
      }
      &:hover {
        color: ${type === 'danger' ? theme.color.danger['500'] : theme.color.primary['500']}
      }
  `
      : ''}
`;

const StyledMenuIcon = styled(Icon)`
  display: inline-block;
  vertical-align: middle;
  margin-left: 0.5rem;
`;

const StyledIcon = styled(Icon)`
  ${({ hasText, size }) =>
    hasText ? `margin-right: ${size === 'sm' ? 0.25 : size === 'lg' ? 0.75 : 0.5}rem;` : ''}
  ${({ hasText, size }) =>
    hasText ? `margin-left: -${size === 'sm' ? 0.125 : size === 'lg' ? 0.375 : 0.25}rem;` : ''}
  margin-top: -${({ size }) => (size === 'sm' ? 1.5 : size === 'lg' ? 3 : 2)}px;
  margin-bottom: -${({ size }) => (size === 'sm' ? 0.75 : size === 'lg' ? 1.5 : 1)}px;
  vertical-align: middle;
`;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: IconName;
  children?: React.ReactNode;
  className?: string;
  hasMenu?: boolean;
  size?: 'sm' | 'md' | 'lg';
  type?: 'primary' | 'success' | 'danger' | 'neutral';
  variant?: 'solid' | 'soft';
  // disabled?: boolean;
  transparent?: boolean;
};

function Button({
  icon,
  children,
  className,
  hasMenu,
  size = 'md',
  type = 'primary',
  variant = 'solid',
  disabled,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <StyledButton
      size={size}
      type={type}
      variant={variant}
      iconOnly={!children && icon}
      className={className}
      disabled={disabled}
      {...props}
    >
      {icon && <StyledIcon hasText={!!children} name={icon} size={size === 'lg' ? 'md' : size} />}
      {children}
      {hasMenu && <StyledMenuIcon size={size === 'lg' ? 'md' : size} name="chevron-down" />}
    </StyledButton>
  );
}

export default Button;

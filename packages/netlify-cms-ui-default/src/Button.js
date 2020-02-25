import React from 'react';
import styled from '@emotion/styled';
import color from 'color';
import Icon from './Icon';
//import ButtonGroup from './ButtonGroup';
const ButtonGroup = undefined;

const StyledButton = styled.button`
  ${({ theme, size, type, primary, transparent }) => `
    font-family: ${theme.fontFamily};
    font-size: ${size === 'sm' ? 12 : 14}px;
    padding: ${size === 'sm' ? `0 0.5rem` : `0 0.75rem`};
    line-height: ${size === 'sm' ? `1.5rem` : `2rem`};
    font-weight: 600;
    text-align: center;
    border-radius: ${size === 'sm' ? 4 : 6}px;
    border: 0;
    outline: 0;
    cursor: pointer;
    white-space: nowrap;
    transition: 200ms;
    background-color: ${
      transparent
        ? 'transparent'
        : primary
        ? type === 'success'
          ? theme.color.success['500']
          : type === 'danger'
          ? theme.color.danger['500']
          : theme.color.neutral['500']
        : type === 'success'
        ? color(theme.color.success['500'])
            .alpha(0.2)
            .string()
        : type === 'danger'
        ? color(theme.color.danger['500'])
            .alpha(0.2)
            .string()
        : color(theme.color.neutral['700'])
            .alpha(0.2)
            .string()
    };
    color: ${
      primary
        ? '#FFFFFF'
        : type === 'success'
        ? theme.color.success[theme.darkMode ? '200' : '700']
        : type === 'danger'
        ? theme.color.danger[theme.darkMode ? '200' : '700']
        : theme.color.neutral[theme.darkMode ? '300' : '1000']
    };
    &:hover {
      background-color: ${
        transparent
          ? 'rgba(0,0,0,0.15)'
          : primary
          ? type === 'success'
            ? theme.color.success['400']
            : type === 'danger'
            ? theme.color.danger['400']
            : theme.color.neutral['400']
          : type === 'success'
          ? color(theme.color.success['500'])
              .alpha(theme.darkMode ? 0.35 : 0.1)
              .string()
          : type === 'danger'
          ? color(theme.color.danger['500'])
              .alpha(theme.darkMode ? 0.35 : 0.1)
              .string()
          : color(theme.color.neutral['700'])
              .alpha(theme.darkMode ? 0.35 : 0.1)
              .string()
      };
    }
    &:focus,
    &:focus:hover {
      background-color: ${
        primary
          ? type === 'success'
            ? theme.color.success['400']
            : type === 'danger'
            ? theme.color.danger['400']
            : theme.color.neutral['400']
          : type === 'success'
          ? color(theme.color.success['500'])
              .alpha(theme.darkMode ? 0.35 : 0.1)
              .string()
          : type === 'danger'
          ? color(theme.color.danger['500'])
              .alpha(theme.darkMode ? 0.35 : 0.1)
              .string()
          : color(theme.color.neutral['700'])
              .alpha(theme.darkMode ? 0.35 : 0.1)
              .string()
      };
    }
    &:active,
    &:active:focus {
      background-color: ${
        primary
          ? type === 'success'
            ? theme.color.success['600']
            : type === 'danger'
            ? theme.color.danger['600']
            : theme.color.neutral['600']
          : type === 'success'
          ? color(theme.color.success['500'])
              .alpha(theme.darkMode ? 0.1 : 0.35)
              .string()
          : type === 'danger'
          ? color(theme.color.danger['500'])
              .alpha(theme.darkMode ? 0.1 : 0.35)
              .string()
          : color(theme.color.neutral['700'])
              .alpha(theme.darkMode ? 0.1 : 0.35)
              .string()
      };
    }
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
const Caret = styled.div`
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid;
  margin-left: 0.5rem;
`;

const StyledIcon = styled(Icon)`
  ${({ hasText }) => (hasText ? 'margin-right: 0.5rem;' : '')}
  margin-top: -2px;
  margin-bottom: -1px;
  vertical-align: middle;
`;

const Button = ({ icon, children, className, dropdown, size, iconSize, ...props }) => (
  <StyledButton size={size} iconOnly={!children && icon} className={className} {...props}>
    {icon && <StyledIcon hasText={!!children} name={icon} size={iconSize} />}
    {children}
    {dropdown && <Caret />}
  </StyledButton>
);

export default Button;

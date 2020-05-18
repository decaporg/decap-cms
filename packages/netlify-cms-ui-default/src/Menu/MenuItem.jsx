import React from 'react';
import styled from '@emotion/styled';
import color from 'color';
import Icon from '../Icon';

export const MenuItemWrap = styled.div`
  font-family: ${({ theme }) => theme.fontFamily};
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  transition: 200ms;
  display: flex;
  align-items: center;
  border-radius: 4px;
  color: ${({ theme, type }) =>
    type === 'danger'
      ? theme.color.danger[theme.darkMode ? '300' : '1400']
      : type === 'success'
      ? theme.color.success[theme.darkMode ? '300' : '1400']
      : theme.color.highEmphasis};
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.color.elevatedSurfaceHighlight};
    ${({ theme, type }) =>
      type === 'danger'
        ? `
      background-color: ${color(theme.color.danger['900'])
        .alpha(0.2)
        .string()};
      color: ${theme.color.danger[theme.darkMode ? '300' : '1400']};
    `
        : ``}
    ${({ theme, type }) =>
      type === 'success'
        ? `
        background-color: ${color(theme.color.success['900'])
          .alpha(0.2)
          .string()};
      color: ${theme.color.success[theme.darkMode ? '300' : '1400']};
    `
        : ``}
  }
  ${({ disabled }) =>
    disabled
      ? `
    pointer-events: none;
    opacity: 0.5;
  `
      : ``}
`;

const TextWrap = styled.div`
  flex: 1;
`;

const StyledIcon = styled(Icon)`
  margin-right: 0.75rem;
  vertical-align: middle;
`;
const SelectedIcon = styled(Icon)`
  margin-left: 0.75rem;
  vertical-align: middle;
`;

const MenuItem = ({ children, icon, onClick, selected, type, className, disabled, ...props }) => (
  <MenuItemWrap
    onClick={!disabled && onClick}
    type={type}
    className={className}
    disabled={disabled}
    {...props}
  >
    {icon && <StyledIcon name={icon} />}
    <TextWrap>{children}</TextWrap>
    {selected && <SelectedIcon name="check" />}
  </MenuItemWrap>
);

export default MenuItem;

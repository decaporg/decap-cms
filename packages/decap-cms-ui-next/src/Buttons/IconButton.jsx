import React from 'react';
import styled from '@emotion/styled';
import color from 'color';

import Icon from '../Icon';
import ButtonGroup from './ButtonGroup';

const IconButtonWrap = styled.button`
  color: ${({ theme, active }) =>
    active ? theme.color.primary['900'] : theme.color.mediumEmphasis};
  background-color: ${({ theme, active }) =>
    active ? color(theme.color.primary['900']).alpha(0.1).string() : `transparent`};
  border: none;
  padding: 0.25rem;
  width: ${({ size }) => (size === 'lg' ? 2.5 : size === 'sm' ? 1.5 : size === 'xs' ? 1.25 : 2)}rem;
  height: ${({ size }) =>
    size === 'lg' ? 2.5 : size === 'sm' ? 1.5 : size === 'xs' ? 1.25 : 2}rem;
  border-radius: 6px;
  display: flex;
  justify-content: center;
  align-items: center;
  outline: none;
  cursor: pointer;
  transition: 250ms;
  &:hover,
  &:focus {
    color: ${({ theme, active }) =>
      active ? theme.color.primary['900'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.primary['900']).alpha(0.2).string()
        : color(theme.color.highEmphasis).alpha(0.05).string()};
  }
  &:active {
    color: ${({ theme, active }) =>
      active ? theme.color.primary['900'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.primary['900']).alpha(0.3).string()
        : color(theme.color.highEmphasis).alpha(0.1).string()};
  }
  ${ButtonGroup} & {
    margin: 2px;
  }
`;

function IconButton({ icon, size, ...props }) {
  return (
    <IconButtonWrap size={size} {...props}>
      <Icon name={icon} size={size} />
    </IconButtonWrap>
  );
}

export default IconButton;

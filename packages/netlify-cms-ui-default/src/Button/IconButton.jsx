import React from 'react';
import styled from '@emotion/styled';
import Icon from '../Icon';
import ButtonGroup from './ButtonGroup';
import color from 'color';

const IconButtonWrap = styled.button`
  color: ${({ theme, active }) =>
    active ? theme.color.success['500'] : theme.color.mediumEmphasis};
  background-color: ${({ theme, active }) =>
    active
      ? color(theme.color.success['500'])
          .alpha(0.1)
          .string()
      : `transparent`};
  border: none;
  padding: 0.25rem;
  width: ${({ size }) => (size === 'lg' ? 2.5 : size === 'sm' ? 1.5 : 2)}rem;
  height: ${({ size }) => (size === 'lg' ? 2.5 : size === 'sm' ? 1.5 : 2)}rem;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  transition: 250ms;
  &:hover,
  &:focus {
    color: ${({ theme, active }) =>
      active ? theme.color.success['500'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['500'])
            .alpha(0.2)
            .string()
        : color(theme.color.highEmphasis)
            .alpha(0.05)
            .string()};
  }
  &:active {
    color: ${({ theme, active }) =>
      active ? theme.color.success['500'] : theme.color.highEmphasis};
    background-color: ${({ theme, active }) =>
      active
        ? color(theme.color.success['500'])
            .alpha(0.3)
            .string()
        : color(theme.color.highEmphasis)
            .alpha(0.1)
            .string()};
  }
  ${ButtonGroup} & {
    margin: 2px;
  }
`;

const IconButton = ({ icon, size, ...props }) => (
  <IconButtonWrap size={size} {...props}>
    <Icon name={icon} size={size} />
  </IconButtonWrap>
);

export default IconButton;

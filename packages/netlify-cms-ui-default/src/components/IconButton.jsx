import React from 'react';
import styled from '@emotion/styled';
import Icon from './Icon';
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
  height: 2rem;
  width: 2rem;
  border-radius: 6px;
  outline: none;
  cursor: pointer;
  transition: 250ms;
  &:hover {
    color: ${({ theme, active }) =>
      active ? theme.color.success['500'] : theme.color.highEmphasis};
    background-color: ${({ theme, active, darkMode }) =>
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
    background-color: ${({ theme, active, darkMode }) =>
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

const IconButton = ({ icon, ...props }) => (
  <IconButtonWrap {...props}>
    <Icon name={icon} />
  </IconButtonWrap>
);

export default IconButton;

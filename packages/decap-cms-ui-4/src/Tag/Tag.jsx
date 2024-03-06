import React from 'react';
import styled from '@emotion/styled';
import Color from 'color';

import TagGroup from './TagGroup';
import Icon from '../Icon';

const TagWrap = styled.div`
  display: inline-flex;
  line-height: 1.25rem;
  background-color: ${({ color, theme }) =>
    Color(theme.color[color][color === 'neutral' ? 600 : 900])
      .alpha(0.15)
      .string()};
  box-shadow: inset 0 0 0 1.5px
    ${({ color, theme }) => theme.color[color][color === 'neutral' ? 600 : 900]};
  color: ${({ color, theme }) => theme.color[color][color === 'neutral' ? 600 : 900]};
  font-size: 0.75rem;
  font-weight: bold;
  padding: 0 0.375rem;
  border-radius: 0.25rem;
  word-wrap: nowrap;
  justify-content: center;
  align-items: center;
  transition: 200ms;
  ${TagGroup} & {
    margin: 4px;
  }
  ${({ onClick, color, theme }) =>
    onClick
      ? `
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

const Tag = ({ color, children, onClick, hasMenu, onDelete }) => (
  <TagWrap color={color} onClick={onClick}>
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
  </TagWrap>
);

Tag.defaultProps = {
  color: 'neutral',
};

export default Tag;

import React, { useState } from 'react';
import styled from '@emotion/styled';
import Icon from '../Icon';

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  min-width: 200px;
  background-color: ${({ theme, focus }) =>
    focus ? theme.color.elevatedSurfaceHighlight : theme.color.surfaceHighlight};
  border-radius: 6px;
  transition: 200ms;
  ${({ theme, focus }) =>
    focus
      ? `box-shadow: inset 0 0 0 2px ${theme.color.primary['900']};`
      : `box-shadow: inset 0 0 0 0 ${theme.color.primary['900']};`}
  &:hover {
    background-color: ${({ theme }) => theme.color.elevatedSurfaceHighlight};
  }
`;
const SearchIcon = styled(Icon)`
  position: absolute;
  z-index: 2;
  top: 0.5rem;
  left: 0.5rem;
  pointer-events: none;
  transition: 200ms;
  color: ${({ theme, focus }) => (focus ? theme.color.mediumEmphasis : theme.color.disabled)};
`;
const EndWrap = styled.div`
  margin: 0.375rem;
  margin-left: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background-color: transparent;
  color: ${({ theme }) => theme.color.highEmphasis};
  border: 0;
  caret-color: ${({ theme }) => theme.color.primary['900']};
  outline: none;
  font-size: 0.875rem;
  z-index: 1;
  border: 0;
  padding: 0;
  padding-top: 0.625rem;
  padding-right: 0;
  padding-bottom: 0.625rem;
  padding-left: 2.25rem;
  line-height: 1;
  &::placeholder {
    color: ${({ theme }) => theme.color.disabled};
  }
`;

const SearchBar = ({ placeholder, renderEnd, onChange, className }) => {
  const [focus, setFocus] = useState();

  return (
    <SearchContainer focus={focus} className={className}>
      <SearchIcon name="search" focus={focus} />
      <SearchInput
        placeholder={placeholder}
        onChange={onChange}
        focus={focus}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
      />
      <EndWrap>{renderEnd && renderEnd(focus)}</EndWrap>
    </SearchContainer>
  );
};

export default SearchBar;

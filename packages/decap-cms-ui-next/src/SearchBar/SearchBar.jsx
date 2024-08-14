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
    focus ? theme.color.neutral['200'] : theme.color.surface};
  border-radius: 6px;
  transition: 200ms;
  ${({ theme, focus }) =>
    focus
      ? `box-shadow: inset 0 0 0 2px ${theme.color.primary['900']};`
      : `box-shadow: inset 0 0 0 0 ${theme.color.primary['900']};`}
  &:hover {
    background-color: ${({ theme }) => theme.color.neutral['200']};
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
  &::-webkit-search-decoration,
  &::-webkit-search-cancel-button,
  &::-webkit-search-results-button,
  &::-webkit-search-results-decoration {
    display: none;
  }
`;

function SearchBar({ placeholder, renderEnd, onChange, onSubmit, onFocus, className }) {
  const [focus, setFocus] = useState();

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      onSubmit();
    }
  }

  function handleFocus() {
    setFocus(true);
    onFocus();
  }

  return (
    <SearchContainer focus={focus} className={className}>
      <SearchIcon name="search" focus={focus} />
      <SearchInput
        type="search"
        placeholder={placeholder}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        focus={focus}
        onFocus={() => handleFocus()}
        onBlur={() => setFocus(false)}
      />
      <EndWrap>{renderEnd && renderEnd(focus)}</EndWrap>
    </SearchContainer>
  );
}

export default SearchBar;

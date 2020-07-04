import React from 'react';
import styled from '@emotion/styled';
import Icon from '../Icon';

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  min-width: 200px;

  svg {
    position: absolute;
    left: 6px;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    pointer-events: none;
  }
`;

const EndWrap = styled.div`
  position: absolute;
  right: 6px;
  z-index: 2;
`;

const SearchInput = styled.input`
  color: ${({ theme }) => theme.color.highEmphasis};
  background-color: ${({ theme }) => theme.color.surfaceHighlight};
  border-radius: 6px;
  font-size: 0.875rem;
  padding: 0.625rem 0.375rem 0.625rem 2rem;
  width: 100%;
  z-index: 1;
  border: 0;
  caret-color: ${({ theme }) => theme.color.primary['900']};

  &::placeholder {
    color: ${({ theme }) => theme.color.disabled};
  }

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.color.primary['900']};
  }
`;

const SearchBar = ({ placeholder, renderEnd, onChange }) => {
  return (
    <SearchContainer>
      <Icon name="search" />
      <SearchInput placeholder={placeholder} onChange={onChange} />
      <EndWrap>{renderEnd && renderEnd()}</EndWrap>
    </SearchContainer>
  );
};

export default SearchBar;

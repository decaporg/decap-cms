import React from 'react';
import PropTypes from 'prop-types';
import styled from 'react-emotion';
import { Icon, lengths, colors } from 'netlify-cms-ui-default';

const SearchContainer = styled.div`
  height: 37px;
  display: flex;
  align-items: center;
  position: relative;
  width: 400px;
`;

const SearchInput = styled.input`
  background-color: #eff0f4;
  border-radius: ${lengths.borderRadius};

  font-size: 14px;
  padding: 10px 6px 10px 32px;
  width: 100%;
  position: relative;
  z-index: 1;

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px ${colors.active};
  }
`;

const SearchIcon = styled(Icon)`
  position: absolute;
  top: 50%;
  left: 6px;
  z-index: 2;
  transform: translate(0, -50%);
`;

const MediaLibrarySearch = ({ value, onChange, onKeyDown, placeholder, disabled }) => (
  <SearchContainer>
    <SearchIcon type="search" size="small" />
    <SearchInput
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
    />
  </SearchContainer>
);

MediaLibrarySearch.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default MediaLibrarySearch;

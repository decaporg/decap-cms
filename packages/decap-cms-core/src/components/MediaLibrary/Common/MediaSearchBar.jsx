import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { SearchBar } from 'decap-cms-ui-next';

const StyledSearchBar = styled(SearchBar)`
  flex: 1;
  width: auto;
  margin-right: 1rem;
`;

function MediaSearchBar({ value, onChange, onKeyDown, placeholder, disabled }) {
  return (
    <StyledSearchBar
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

MediaSearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default MediaSearchBar;

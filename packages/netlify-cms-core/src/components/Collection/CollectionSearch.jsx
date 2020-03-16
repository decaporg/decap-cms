import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Icon } from 'netlify-cms-ui-default';
import { Card } from 'netlify-cms-ui-default';
import { searchCollections } from 'Actions/collections';

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 0 12px;
  position: relative;

  ${Icon} {
    position: absolute;
    top: 0;
    left: 6px;
    z-index: 2;
    height: 100%;
    display: flex;
    align-items: center;
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  background-color: ${({ theme }) => theme.color.background};
  border-radius: 3px;
  font-size: 14px;
  padding: 10px 6px 10px 32px;
  width: 100%;
  position: relative;
  z-index: 1;

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.color.primary['500']};
  }
`;

const CollectionSearch = ({ t, searchTerm }) => {
  const [query, setQuery] = useState(searchTerm);

  return (
    <SearchContainer>
      <Icon name="search" />
      <SearchInput
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && searchCollections(query)}
        placeholder={t('collection.sidebar.searchAll')}
        value={query}
      />
    </SearchContainer>
  );
};

CollectionSearch.propTypes = {
  searchTerm: PropTypes.string,
  t: PropTypes.func.isRequired,
};

CollectionSearch.defaultProps = {
  searchTerm: '',
};

export default translate()(CollectionSearch);

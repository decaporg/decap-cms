import React, { useState, useEffect, memo } from 'react';
import styled from '@emotion/styled';

import theme from '../theme';
import searchIcon from '../img/search.svg';

const SearchForm = styled.form`
  > span {
    width: 100%;
  }
`;

const SearchField = styled.input`
  color: white;
  font-size: ${theme.fontsize[3]};
  border-radius: ${theme.radii[1]};
  background-color: rgba(255, 255, 255, 0.1);
  background-image: url(${searchIcon});
  background-repeat: no-repeat;
  background-position: ${theme.space[2]} 50%;
  border: 0;
  appearance: none;
  width: 100%;
  padding: ${theme.space[2]};
  padding-left: 30px;
  outline: 0;
`;

function DocSearch() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (window.docsearch) {
      window.docsearch({
        apiKey: '08d03dc80862e84c70c5a1e769b13019',
        indexName: 'netlifycms',
        inputSelector: '#algolia-search',
        debug: false, // Set debug to true if you want to inspect the dropdown
      });
    } else {
      setEnabled(false);
    }
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <SearchForm>
      <SearchField type="search" placeholder="Search the docs" id="algolia-search" />
    </SearchForm>
  );
}

export default memo(DocSearch);

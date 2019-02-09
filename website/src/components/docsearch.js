import React, { useState, useEffect, memo } from 'react';
import styled from '@emotion/styled';

import theme from '../theme';
import searchIcon from '../img/search.svg';

const SearchField = styled.div`
  display: flex;
  background: ${theme.colors.darkGray};
  border-radius: ${theme.radii[1]};
  color: white;
  width: 100%;

  > span {
    width: 100%;
  }

  > div {
    padding: ${theme.space[1]};
    height: 35px;
  }

  input {
    background: none;
    color: currentColor;
    padding: ${theme.space[1]};
    border: 0;
    width: 100%;
    font-size: ${theme.fontsize[3]};
    outline: 0;
    height: 35px;
  }
`;

const DocSearch = () => {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (window.docsearch) {
      window.docsearch({
        apiKey: '08d03dc80862e84c70c5a1e769b13019',
        indexName: 'netlifycms',
        inputSelector: '.algolia-search',
        debug: false, // Set debug to true if you want to inspect the dropdown
      });
    } else {
      setEnabled(false);
    }
  }, []);

  // if (!enabled) {
  //   return null;
  // }

  return (
    <SearchField>
      <div>
        <img src={searchIcon} alt="magnifying glass" />
      </div>
      <input type="search" placeholder="Search the docs" className="algolia-search" />
    </SearchField>
  );
};

export default memo(DocSearch);

import React, { useState } from 'react';
import { text, boolean } from '@storybook/addon-knobs';
import styled from '@emotion/styled';
import SearchBar from './SearchBar';
import { Menu, MenuItem } from '../Menu';
import { Button } from '../Button';

export default {
  title: 'Components/SearchBar',
};

export const _SearchBar = () => {
  const renderEnd = boolean('renderEnd', false);
  const placeholder = text('placeholder', 'Search');
  return (
    <SearchWrap>
      <SearchBar
        placeholder={placeholder}
        renderEnd={renderEnd ? () => <EndContent /> : null}
        onChange={e => console.log(e.target.value)}
      />
    </SearchWrap>
  );
};

_SearchBar.story = {
  name: 'SearchBar',
};

const SearchWrap = styled.div`
  width: 33%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const EndContent = () => {
  const [categoryMenuAnchorEl, setCategoryMenuAnchorEl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Posts');
  const categories = ['Posts', 'Media', 'Pages', 'Products', 'Authors', 'Everywhere'];
  function handleClose() {
    setCategoryMenuAnchorEl(null);
  }
  return (
    <>
      <Button size="sm" hasMenu onClick={e => setCategoryMenuAnchorEl(e.currentTarget)}>
        {selectedCategory}
      </Button>
      <Menu
        anchorEl={categoryMenuAnchorEl}
        open={!!categoryMenuAnchorEl}
        onClose={() => setCategoryMenuAnchorEl(null)}
        anchorOrigin={{ y: 'bottom', x: 'right' }}
      >
        {categories.map(category => (
          <MenuItem
            key={category}
            selected={selectedCategory === category}
            onClick={() => {
              setSelectedCategory(category);
              handleClose();
            }}
          >
            {category}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

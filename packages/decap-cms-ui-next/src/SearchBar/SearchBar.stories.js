import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import styled from '@emotion/styled';

import SearchBar from '.';
import { Menu, MenuItem } from '../Menu';
import { Button } from '../Buttons';

export default {
  title: 'Components/SearchBar',
  component: SearchBar,
  parameters: {
    backgrounds: {
      default: 'light',
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    renderEnd: { control: 'boolean' },
  },
  args: {
    placeholder: 'Search',
    renderEnd: false,
    onChange: action('onChange'),
  },
};

export function _SearchBar(args) {
  return (
    <SearchWrap>
      <SearchBar {...args} renderEnd={args.renderEnd ? () => <EndContent /> : null} />
    </SearchWrap>
  );
}

const SearchWrap = styled.div`
  width: 33vw;
`;

function EndContent() {
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
}

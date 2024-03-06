import React, { useState } from 'react';
import { withKnobs, boolean, select } from '@storybook/addon-knobs';

import { Button, ButtonGroup } from '../Button';
import { Menu, MenuItem } from '.';
import { iconComponents } from '../Icon/Icon';

export default {
  title: 'Components/Menu',
  decorators: [withKnobs],
};

const StoryMenu = () => {
  const [menuAnchorEl, setMenuAnchorEl] = useState();
  return (
    <div>
      <ButtonGroup>
        <Button onClick={e => setMenuAnchorEl(e.currentTarget)} hasMenu>
          Open Menu
        </Button>
      </ButtonGroup>
      <Menu
        anchorEl={menuAnchorEl}
        open={!!menuAnchorEl}
        onClose={() => setMenuAnchorEl(null)}
        anchorOrigin={{
          x: select(
            'anchorOrigin.x',
            {
              left: 'left',
              center: 'center',
              'right (default)': 'right',
            },
            'right',
          ),
          y: select(
            'anchorOrigin.y',
            {
              top: 'top',
              center: 'center',
              'bottom (default)': 'bottom',
            },
            'bottom',
          ),
        }}
        transformOrigin={{
          x: select(
            'transformOrigin.x',
            {
              left: 'left',
              center: 'center',
              'right (default)': 'right',
            },
            'right',
          ),
          y: select(
            'transformOrigin.y',
            {
              'top (default)': 'top',
              center: 'center',
              bottom: 'bottom',
            },
            'top',
          ),
        }}
      >
        <MenuItem onClick={() => setMenuAnchorEl(null)}>Menu Item 1</MenuItem>
        <MenuItem onClick={() => setMenuAnchorEl(null)}>Menu Item 2</MenuItem>
        <MenuItem onClick={() => setMenuAnchorEl(null)}>Menu Item 3</MenuItem>
      </Menu>
    </div>
  );
};

export const _Menu = () => <StoryMenu />;

export const _MenuItem = () => {
  return (
    <div>
      <Menu
        anchorOrigin={{ x: 'center', y: 'center' }}
        transformOrigin={{ x: 'center', y: 'center' }}
        open={true}
      >
        <MenuItem
          icon={select(
            'icon',
            {
              default: null,
              ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
            },
            null,
          )}
          type={select('type', { default: null, success: 'success', danger: 'danger' }, null)}
          selected={boolean('selected', false)}
          disabled={boolean('disabled', false)}
        >
          Menu Item
        </MenuItem>
      </Menu>
    </div>
  );
};

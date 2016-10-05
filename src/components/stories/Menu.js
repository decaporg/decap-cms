import React from 'react';
import { Menu, MenuItem } from '../UI/index';
import { storiesOf } from '@kadira/storybook';

storiesOf('Menu', module)
  .add('Default', () => (
    <div>
      <Menu>
        <MenuItem>First</MenuItem>
        <MenuItem>Second</MenuItem>
        <MenuItem>Third</MenuItem>
      </Menu>
    </div>
  ))
  .add('topLeft', () => (
    <div>
      <Menu position="topLeft" active>
        <MenuItem>First</MenuItem>
        <MenuItem>Second</MenuItem>
        <MenuItem>Third</MenuItem>
      </Menu>
    </div>
  ));


import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import { Button, ButtonGroup } from '../Buttons';
import { iconComponents } from '../Icon/Icon';
import { Menu, MenuItem } from '.';

export default {
  title: 'Components/Menu',
};

export function _Menu(args) {
  const [menuAnchorEl, setMenuAnchorEl] = useState();
  const [{ open }, updateArgs] = useArgs();

  function toggleOpen(event) {
    setMenuAnchorEl(event ? event.currentTarget : null);
    updateArgs({ open: !open });
  }

  return (
    <>
      <ButtonGroup>
        <Button onClick={event => toggleOpen(event)} hasMenu>
          Open Menu
        </Button>
      </ButtonGroup>

      <Menu {...args} anchorEl={menuAnchorEl} onClose={toggleOpen}>
        <MenuItem onClick={toggleOpen}>Menu Item 1</MenuItem>
        <MenuItem onClick={toggleOpen}>Menu Item 2</MenuItem>
        <MenuItem onClick={toggleOpen}>Menu Item 3</MenuItem>
      </Menu>
    </>
  );
}

_Menu.argTypes = {
  open: {
    control: 'boolean',
    table: {
      defaultValue: { summary: 'false' },
    },
  },
  'anchorOrigin.x': {
    control: 'select',
    options: ['left', 'center', 'right'],
    table: {
      defaultValue: { summary: 'right' },
    },
  },
  'anchorOrigin.y': {
    control: 'select',
    options: ['top', 'center', 'bottom'],
    table: {
      defaultValue: { summary: 'bottom' },
    },
  },
  'transformOrigin.x': {
    control: 'select',
    options: ['left', 'center', 'right'],
    table: {
      defaultValue: { summary: 'right' },
    },
  },
  'transformOrigin.y': {
    control: 'select',
    options: ['top', 'center', 'bottom'],
    table: {
      defaultValue: { summary: 'top' },
    },
  },
};

_Menu.args = {
  open: false,
  anchorOrigin: { x: 'right', y: 'bottom' },
  transformOrigin: { x: 'right', y: 'top' },
  onClose: action('onClose'),
};

export function _MenuItem(args) {
  return (
    <>
      <Menu
        anchorOrigin={{ x: 'center', y: 'center' }}
        transformOrigin={{ x: 'center', y: 'center' }}
        open={true}
      >
        <MenuItem {...args}>Menu Item</MenuItem>
      </Menu>
    </>
  );
}

_MenuItem.argTypes = {
  icon: {
    control: 'select',
    options: {
      default: null,
      ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
    },
    table: {
      defaultValue: { summary: 'null' },
    },
  },
  endIcon: {
    control: 'select',
    options: {
      default: null,
      ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
    },
    table: {
      defaultValue: { summary: 'null' },
    },
  },
  type: {
    control: 'select',
    options: ['default', 'danger', 'success'],
    mapping: {
      default: null,
    },
    table: {
      defaultValue: { summary: 'default' },
    },
  },
  selected: {
    control: 'boolean',
    table: {
      defaultValue: { summary: 'false' },
    },
  },
  hideSelectedIcon: {
    control: 'boolean',
    table: {
      defaultValue: { summary: 'false' },
    },
  },
  disabled: {
    control: 'boolean',
    table: {
      defaultValue: { summary: 'false' },
    },
  },
};

_MenuItem.args = {
  icon: null,
  endIcon: null,
  type: 'default',
  selected: false,
  hideSelectedIcon: false,
  disabled: false,
};

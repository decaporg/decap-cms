import React, { useState } from 'react';
import styled from '@emotion/styled';
import { action } from '@storybook/addon-actions';
import { useArgs } from '@storybook/preview-api';

import { Button, ButtonGroup } from '../Buttons';
import Icon from '../Icon';
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
  type: 'default',
  selected: false,
  hideSelectedIcon: false,
  disabled: false,
};

const StyledStartIcon = styled(Icon)`
  margin-right: 0.75rem;
  vertical-align: middle;
`;

export function WithStartContent(args) {
  return (
    <>
      <Menu
        anchorOrigin={{ x: 'center', y: 'center' }}
        transformOrigin={{ x: 'center', y: 'center' }}
        open={true}
      >
        <MenuItem {...args} startContent={<StyledStartIcon name="edit-3" />}>
          Menu Item
        </MenuItem>
      </Menu>
    </>
  );
}

WithStartContent.args = {
  ..._MenuItem.args,
};

WithStartContent.argTypes = {
  ..._MenuItem.argTypes,
};

const StyledEndIcon = styled(Icon)`
  margin-left: 0.75rem;
  vertical-align: middle;
`;

export function WithEndContent(args) {
  return (
    <>
      <Menu
        anchorOrigin={{ x: 'center', y: 'center' }}
        transformOrigin={{ x: 'center', y: 'center' }}
        open={true}
      >
        <MenuItem {...args} endContent={<StyledEndIcon name="chevron-down" />}>
          Menu Item
        </MenuItem>
      </Menu>
    </>
  );
}

WithEndContent.args = {
  ..._MenuItem.args,
};

WithEndContent.argTypes = {
  ..._MenuItem.argTypes,
};

import React from 'react';

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '.';
import { Button } from '../Buttons';

export default {
  title: 'Components/Dropdown',
};

export function _Dropdown(args) {
  const { anchorOrigin, transformOrigin } = args;

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button>Open Dropdown</Button>
      </DropdownTrigger>
      <DropdownMenu anchorOrigin={anchorOrigin} transformOrigin={transformOrigin}>
        <DropdownMenuItem>Dropdown Item 1</DropdownMenuItem>
        <DropdownMenuItem>Dropdown Item 2</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Dropdown Item 3</DropdownMenuItem>
      </DropdownMenu>
    </Dropdown>
  );
}

_Dropdown.argTypes = {
  open: {
    control: 'boolean',
    table: {
      // category: 'Dropdown',
      defaultValue: { summary: 'false' },
    },
  },
  'anchorOrigin.x': {
    control: 'select',
    options: ['left', 'center', 'right'],
    table: {
      category: 'DropdownMenu',
      defaultValue: { summary: 'right' },
    },
  },
  'anchorOrigin.y': {
    control: 'select',
    options: ['top', 'center', 'bottom'],
    table: {
      category: 'DropdownMenu',
      defaultValue: { summary: 'bottom' },
    },
  },
  'transformOrigin.x': {
    control: 'select',
    options: ['left', 'center', 'right'],
    table: {
      category: 'DropdownMenu',
      defaultValue: { summary: 'right' },
    },
  },
  'transformOrigin.y': {
    control: 'select',
    options: ['top', 'center', 'bottom'],
    table: {
      category: 'DropdownMenu',
      defaultValue: { summary: 'top' },
    },
  },
};

_Dropdown.args = {
  open: false,
  anchorOrigin: { x: 'right', y: 'bottom' },
  transformOrigin: { x: 'right', y: 'top' },
};

import React from 'react';
import { action } from '@storybook/addon-actions';

import { Button, ButtonGroup, IconButton, AvatarButton } from '.';
import { iconComponents } from '../Icon/Icon';

export default {
  title: 'Components/Buttons',
};

export function _Button(args) {
  return <Button {...args}>Button</Button>;
}

_Button.argTypes = {
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
    mapping: {
      md: null,
    },
  },
  type: {
    control: 'select',
    options: ['default', 'success', 'danger'],
    mapping: {
      default: null,
    },
  },
  primary: {
    control: 'boolean',
  },
  disabled: {
    control: 'boolean',
  },
  icon: {
    control: 'select',
    options: {
      default: null,
      ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
    },
  },
};

_Button.args = {
  type: 'default',
  size: 'md',
  primary: false,
  disabled: false,
  icon: null,
  onClick: action('onClick'),
};

export function _ButtonGroup(args) {
  return (
    <ButtonGroup {...args}>
      <Button>Button 1</Button>
      <Button>Button 2</Button>
      <Button primary type="success">
        Primary Success Button
      </Button>
    </ButtonGroup>
  );
}

_ButtonGroup.argTypes = {
  direction: {
    control: 'select',
    options: ['horizontal', 'vertical'],
    mapping: {
      horizontal: null,
    },
  },
};

_ButtonGroup.args = {
  direction: 'horizontal',
};

export function _IconButton(args) {
  return <IconButton {...args} />;
}

_IconButton.argTypes = {
  icon: {
    control: 'select',
    options: {
      default: null,
      ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
    },
  },
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
    mapping: {
      md: null,
    },
  },
  active: {
    control: 'boolean',
  },
};

_IconButton.args = {
  icon: null,
  size: 'md',
  active: false,
  onClick: action('onClick'),
};

export function _AvatarButton(args) {
  return <AvatarButton {...args} />;
}

_AvatarButton.argTypes = {
  src: {
    control: 'text',
  },
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
    mapping: {
      md: null,
    },
  },
  active: {
    control: 'boolean',
  },
};

_AvatarButton.args = {
  src: 'https://randomuser.me/api/portraits/men/94.jpg',
  size: 'md',
  active: false,
  onClick: action('onClick'),
};

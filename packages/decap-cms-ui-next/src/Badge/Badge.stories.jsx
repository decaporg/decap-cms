import React from 'react';
import { action } from '@storybook/addon-actions';

import { Badge, BadgeGroup } from '.';
import color from '../utils/color';

export default {
  title: 'Components/Badge',
};

export function _Badge(args) {
  const { onClick, onDelete } = args;

  return (
    <Badge
      {...args}
      onClick={onClick ? action('onClick') : null}
      onDelete={onDelete ? action('onDelete') : null}
    />
  );
}

_Badge.argTypes = {
  children: { control: 'text' },
  color: {
    control: 'select',
    options: Object.keys(color).reduce((acc, color) => ({ ...acc, [color]: color }), {}),
  },
  variant: {
    control: 'select',
    options: ['solid', 'soft', 'outline'],
  },
  radius: { control: 'select', options: ['none', 'large', 'full'] },
  size: {
    control: 'select',
    options: ['sm', 'md', 'lg'],
  },
  hasMenu: { control: 'boolean' },

  onClick: { control: 'boolean' },
  onDelete: { control: 'boolean' },
};

_Badge.args = {
  children: 'Badge',
  color: 'neutral',
  variant: 'solid',
  radius: 'large',
  size: 'sm',
  hasMenu: false,

  onClick: false,
  onDelete: false,
};

export function _BadgeGroup(args) {
  const { size, onClick, hasMenu, onDelete } = args;

  return (
    <BadgeGroup {...args}>
      <Badge
        size={size}
        color="green"
        onClick={onClick ? action('onClick', event) : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? action('onDelete', event) : null}
      >
        Apple
      </Badge>
      <Badge
        size={size}
        color="yellow"
        onClick={onClick ? () => alert('Badge clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Banana
      </Badge>
      <Badge
        size={size}
        color="orange"
        onClick={onClick ? () => alert('Badge clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Orange
      </Badge>
      <Badge
        size={size}
        color="red"
        onClick={onClick ? () => alert('Badge clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Cherry
      </Badge>
      <Badge
        size={size}
        color="pink"
        onClick={onClick ? () => alert('Badge clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Strawberry
      </Badge>
      <Badge
        size={size}
        color="purple"
        onClick={onClick ? () => alert('Badge clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Grape
      </Badge>
      <Badge
        size={size}
        color="blue"
        onClick={onClick ? () => alert('Badge clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Blueberry
      </Badge>
    </BadgeGroup>
  );
}

_BadgeGroup.argTypes = {
  direction: {
    control: 'select',
    options: ['horizontal', 'vertical'],
  },
};

_BadgeGroup.args = {
  direction: 'horizontal',
};

import React from 'react';
import { action } from '@storybook/addon-actions';

import { Tag, TagGroup } from '.';
import color from '../utils/color';

export default {
  title: 'Components/Tag',
};

export function _Tag(args) {
  const { onClick, onDelete } = args;

  return (
    <Tag
      {...args}
      onClick={onClick ? action('onClick') : null}
      onDelete={onDelete ? action('onDelete') : null}
    />
  );
}

_Tag.argTypes = {
  children: { control: 'text' },
  color: {
    control: 'select',
    options: Object.keys(color).reduce((acc, color) => ({ ...acc, [color]: color }), {}),
  },
  hasMenu: { control: 'boolean' },

  onClick: { control: 'boolean' },
  onDelete: { control: 'boolean' },
};

_Tag.args = {
  children: 'Tag',
  color: 'neutral',
  hasMenu: false,

  onClick: false,
  onDelete: false,
};

export function _TagGroup(args) {
  const { size, onClick, hasMenu, onDelete } = args;

  return (
    <TagGroup {...args}>
      <Tag
        size={size}
        color="green"
        onClick={onClick ? action('onClick', event) : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? action('onDelete', event) : null}
      >
        Apple
      </Tag>
      <Tag
        size={size}
        color="yellow"
        onClick={onClick ? () => alert('Tag clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Banana
      </Tag>
      <Tag
        size={size}
        color="orange"
        onClick={onClick ? () => alert('Tag clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Orange
      </Tag>
      <Tag
        size={size}
        color="red"
        onClick={onClick ? () => alert('Tag clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Cherry
      </Tag>
      <Tag
        size={size}
        color="pink"
        onClick={onClick ? () => alert('Tag clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Strawberry
      </Tag>
      <Tag
        size={size}
        color="purple"
        onClick={onClick ? () => alert('Tag clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Grape
      </Tag>
      <Tag
        size={size}
        color="blue"
        onClick={onClick ? () => alert('Tag clicked.') : null}
        hasMenu={hasMenu}
        onDelete={onDelete ? () => alert('Deleted tag') : null}
      >
        Blueberry
      </Tag>
    </TagGroup>
  );
}

_TagGroup.argTypes = {
  direction: {
    control: 'select',
    options: ['horizontal', 'vertical'],
  },
};

_TagGroup.args = {
  direction: 'horizontal',
};

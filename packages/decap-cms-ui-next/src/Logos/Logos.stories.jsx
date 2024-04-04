import React from 'react';

import { DecapMark, DecapTile, DecapWordmark } from '.';

export default {
  title: 'Components/Logos',
};

export function _DecapMark(args) {
  return <DecapMark {...args} />;
}

_DecapMark.argTypes = {
  size: {
    control: {
      type: 'number',
      min: 16,
      step: 16,
    },
    table: {
      defaultValue: { summary: 32 },
    },
  },
};

_DecapMark.args = {
  size: 32,
};

export function _DecapTile(args) {
  return <DecapTile {...args} />;
}

_DecapTile.argTypes = {
  size: {
    control: {
      type: 'number',
      min: 16,
      step: 16,
    },
    table: {
      defaultValue: { summary: 32 },
    },
  },
};

_DecapTile.args = {
  size: 32,
};

export function _DecapWordmark(args) {
  return <DecapWordmark {...args} />;
}

_DecapWordmark.argTypes = {
  height: {
    control: {
      type: 'number',
      min: 16,
      step: 16,
    },
    table: {
      defaultValue: { summary: 32 },
    },
  },
};

_DecapWordmark.args = {
  height: 32,
};

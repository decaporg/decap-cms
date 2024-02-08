import React from 'react';

import Icon, { iconComponents } from './Icon';

export default {
  title: 'Components/Icon',
  component: Icon,
};

export function _Icon(args) {
  return <Icon {...args} />;
}

_Icon.argTypes = {
  name: {
    control: 'select',
    options: {
      default: null,
      ...Object.keys(iconComponents).reduce((acc, key) => ({ ...acc, [key]: key }), {}),
    },
    table: {
      defaultValue: { summary: 'null' },
    },
  },
  size: {
    control: 'select',
    options: ['xs', 'sm', 'md', 'lg', 'xl'],
    mapping: {
      md: null,
    },
    table: {
      defaultValue: { summary: 'md' },
    },
  },
};

_Icon.args = {
  name: null,
  size: 'md',
};

export function IconsLibrary() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column' }}>
      {Object.keys(iconComponents).map(name => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 4,
            margin: 8,
          }}
        >
          <Icon name={name} size="md" />
          <span style={{ marginTop: 4 }}>{name}</span>
        </div>
      ))}
    </div>
  );
}

IconsLibrary.parameters = {
  options: {
    showPanel: false,
  },
};

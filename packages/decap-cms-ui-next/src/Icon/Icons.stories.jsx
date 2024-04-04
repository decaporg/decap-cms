import React from 'react';

import Icon, { iconComponents } from './Icon';

export default {
  title: 'Foundations/Icons Library',
  component: Icon,
  parameters: {
    options: {
      showPanel: false,
    },
  },
};

export function IconsLibrary() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        margin: '0 10rem',
      }}
    >
      <h1>Icons Library</h1>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {Object.keys(iconComponents).map(name => (
          <div
            key={name}
            style={{
              flex: '1 1 25%',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: '1rem',
            }}
          >
            <Icon name={name} size="md" />
            <span style={{ marginTop: 4 }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

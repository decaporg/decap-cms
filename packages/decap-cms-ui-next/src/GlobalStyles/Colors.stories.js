import React from 'react';

import color from '../utils/color';

export default {
  title: 'Foundations/Colors',
  parameters: {
    options: {
      showPanel: false,
    },
  },
};

export function _Colors() {
  const colors = Object.entries(color);

  return (
    <>
      <h1>Colors</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '2rem' }}>
        {colors.map(([colorName, shades]) => (
          <div key={colorName}>
            <h2>{colorName}</h2>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              {Object.entries(shades).map(([shade, value]) => (
                <div
                  key={shade}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      width: '3rem',
                      height: '3rem',
                      backgroundColor: value,
                    }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold' }}>{shade}</div>
                    <div>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

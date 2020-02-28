import React from 'react';
import { addDecorator, configure } from '@storybook/react';
import { withThemesProvider } from 'storybook-multiple-themeprovider';
import { lightTheme, darkTheme } from '../packages/netlify-cms-ui-default/src/theme';

import './preview.css';

// Options:
const themes = [
  {
    name: 'dark',
    backgroundColor: darkTheme.color.background,
    ...darkTheme,
  },
  {
    name: 'light',
    backgroundColor: lightTheme.color.background,
    ...lightTheme,
  },
];

const fill = { height: '100vh', width: '100vw' };

const center = { display: 'flex', alignItems: 'center', justifyContent: 'center' };

addDecorator(story => <div style={{ ...fill, ...center }}>{story()}</div>);
addDecorator(withThemesProvider(themes));

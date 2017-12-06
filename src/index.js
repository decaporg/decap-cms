import React from 'react';
import createReactClass from 'create-react-class';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'normalize.css';
import ErrorBoundary from './components/UI/ErrorBoundary/ErrorBoundary';
import Root from './root';
import registry from './lib/registry';
import './index.css';

if (process.env.NODE_ENV !== 'production') {
  require('./utils.css'); // eslint-disable-line
}

// Log the version number
console.log(`Netlify CMS version ${NETLIFY_CMS_VERSION}`);

// Create mount element dynamically
const el = document.createElement('div');
el.id = 'root';
document.body.appendChild(el);

render((
  <AppContainer>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </AppContainer>
), el);

if (module.hot) {
  module.hot.accept('./root', () => { render(Root); });
}

const builtInPlugins = [{
  label: 'Image',
  id: 'image',
  fromBlock: match => match && {
    image: match[2],
    alt: match[1],
  },
  toBlock: data => `![${ data.alt || "" }](${ data.image || "" })`,
  toPreview: (data, getAsset) => <img src={getAsset(data.image) || ""} alt={data.alt || ""} />,
  pattern: /^!\[([^\]]+)]\(([^)]+)\)$/,
  fields: [{
    label: 'Image',
    name: 'image',
    widget: 'image',
  }, {
    label: 'Alt Text',
    name: 'alt',
  }],
}];
builtInPlugins.forEach(plugin => registry.registerEditorComponent(plugin));

const CMS = {};
for (const method in registry) { // eslint-disable-line
  CMS[method] = registry[method];
}

if (typeof window !== 'undefined') {
  window.CMS = CMS;
  window.createClass = window.createClass || createReactClass;
  window.h = window.h || React.createElement;
}

export default CMS;

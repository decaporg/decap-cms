import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'file?name=index.html!../example/index.html';
import 'react-toolbox/lib/commons.scss';
import Root from './root';
import registry from './lib/registry';
import './index.css';

if (process.env.NODE_ENV !== 'production') {
  require('./utils.css'); // eslint-disable-line
}

// Create mount element dynamically
const el = document.createElement('div');
el.id = 'root';
document.body.appendChild(el);

render((
  <AppContainer>
    <Root />
  </AppContainer>
), el);

if (process.env.NODE_ENV !== 'production' && module.hot) {
  module.hot.accept('./root', () => {
    const NextRoot = require('./root').default;
    render((
      <AppContainer>
        <NextRoot />
      </AppContainer>
    ), el);
  });
}

window.CMS = {};
for (const method in registry) {
  window.CMS[method] = registry[method];
}
window.createClass = React.createClass;
window.h = React.createElement;

const buildtInPlugins = [{
  label: 'Image',
  id: 'image',
  fromBlock: match => match && {
    image: match[2],
    alt: match[1],
  },
  toBlock: data => `![${ data.alt }](${ data.image })`,
  toPreview: (data) => {
    return <img src={data.image} alt={data.alt} />;
  },
  pattern: /^!\[([^\]]+)\]\(([^\)]+)\)$/,
  fields: [{
    label: 'Image',
    name: 'image',
    widget: 'image',
  }, {
    label: 'Alt Text',
    name: 'alt',
  }],
}];
buildtInPlugins.forEach(plugin => registry.registerEditorComponent(plugin));

import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'react-toolbox/lib/commons.scss';
import Root from './root';
import registry from './lib/registry';
import 'file?name=index.html!../example/index.html'; // eslint-disable-line
import './index.css';

// Create mount element dynamically
const el = document.createElement('div');
el.id = 'root';
document.body.appendChild(el);

render((
  <AppContainer>
    <Root />
  </AppContainer>
), el);

if (module.hot) {
  module.hot.accept('./root', () => {
    const NextRoot = require('./root').default; // eslint-disable-line
    render((
      <AppContainer>
        <NextRoot />
      </AppContainer>
    ), el);
  });
}

window.CMS = {};
registry.forEach((method) => {
  window.CMS[method] = registry[method];
});
window.createClass = React.createClass;
window.h = React.createElement;

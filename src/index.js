import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import registry from './lib/registry';
import configureStore from './store/configureStore';
import routes from './routing/routes';
import history, { syncHistory } from './routing/history';
import 'file?name=index.html!../example/index.html';
import './index.css';

const store = configureStore();

// Create an enhanced history that syncs navigation events with the store
syncHistory(store);

const el = document.createElement('div');
el.id = 'root';
document.body.appendChild(el);

render((
  <Provider store={store}>
    <Router history={history}>
      {routes}
    </Router>
  </Provider>
), el);

window.CMS = {};
console.log('reg: ', registry);
for (const method in registry) {
  window.CMS[method] = registry[method];
}

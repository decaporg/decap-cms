import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import configureStore from './store/configureStore';
import routes from './routing/routes';
import history, { syncHistory } from './routing/history';
import { initPluginAPI } from './plugins';
import 'file?name=index.html!../example/index.html';
import './index.css';

const store = configureStore();

// Create an enhanced history that syncs navigation events with the store
syncHistory(store);

const Plugin = initPluginAPI();

const el = document.createElement('div');
el.id = 'root';
document.body.appendChild(el);

render((
  <Provider store={store}>
    <Plugin>
      <Router history={history}>
        {routes}
      </Router>
    </Plugin>
  </Provider>
), el);

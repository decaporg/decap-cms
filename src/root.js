import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import routes from './routing/routes';
import history, { syncHistory } from './routing/history';
import configureStore from './store/configureStore';

const store = configureStore();

// Create an enhanced history that syncs navigation events with the store
syncHistory(store);

const Root = () => (
  <Provider store={store}>
    <Router history={history}>
      {routes}
    </Router>
  </Provider>
);

export default Root;

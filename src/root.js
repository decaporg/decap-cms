import React from 'react';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import routes from './routing/routes';
import history, { syncHistory } from './routing/history';
import configureStore from './redux/configureStore';
import { setStore } from './valueObjects/AssetProxy';

const store = configureStore();

// Create an enhanced history that syncs navigation events with the store
syncHistory(store);

setStore(store);

const Root = () => (
  <Provider store={store}>
    <Router history={history}>
      {routes}
    </Router>
  </Provider>
);

export default Root;

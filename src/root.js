import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import history from './routing/history';
import configureStore from './redux/configureStore';
import { setStore } from './valueObjects/AssetProxy';
import App from './containers/App';

const store = configureStore();

setStore(store);

const Root = () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App/>
    </ConnectedRouter>
  </Provider>
);

export default Root;

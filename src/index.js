import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import Routes from './routes/routes';
import 'file?name=index.html!../example/index.html';

const store = configureStore();

const el = document.createElement('div');
document.body.appendChild(el);

render((
  <Provider store={store}>
    <Routes/>
  </Provider>
), el);

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import configureStore from './store/configureStore';
import Routes from './routes/routes';
import 'file?name=index.html!../example/index.html';
import styles from './index.css';

const store = configureStore();

window.store = store;

const el = document.createElement('div');
el.id = 'root';
document.body.appendChild(el);

render((
  <Provider store={store}>
    <Routes/>
  </Provider>
), el);

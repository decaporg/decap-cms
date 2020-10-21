import { createStore, applyMiddleware, compose, AnyAction } from 'redux';
import thunkMiddleware, { ThunkMiddleware } from 'redux-thunk';
import { routerMiddleware } from 'connected-react-router';
import { waitUntilAction } from './middleware/waitUntilAction';
import createRootReducer from '../reducers/combinedReducer';
import history from '../routing/history';
import { State } from '../types/redux';
import { Reducer } from 'react';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: Function;
  }
}

const store = createStore<State | undefined, AnyAction, unknown, unknown>(
  (createRootReducer(history) as unknown) as Reducer<State | undefined, AnyAction>,
  compose(
    applyMiddleware(
      routerMiddleware(history),
      thunkMiddleware as ThunkMiddleware<State, AnyAction>,
      waitUntilAction,
    ),
    window.__REDUX_DEVTOOLS_EXTENSION__
      ? window.__REDUX_DEVTOOLS_EXTENSION__()
      : (f: Function): Function => f,
  ),
);

export default store;

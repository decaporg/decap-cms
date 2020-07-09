import { createStore, applyMiddleware, compose, AnyAction } from 'redux';
import thunkMiddleware, { ThunkMiddleware } from 'redux-thunk';
import { routerMiddleware } from 'connected-react-router';
import { waitUntilAction } from './middleware/waitUntilAction';
import createRootReducer from '../reducers/combinedReducer';
import history from '../routing/history';
import { State } from '../types/redux';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: Function;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = createStore<State, any, {}, {}>(
  createRootReducer(history),
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

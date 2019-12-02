import { createStore, applyMiddleware, compose, AnyAction } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { waitUntilAction } from './middleware/waitUntilAction';
import reducer from '../reducers/combinedReducer';
import { State } from '../types/redux';

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: Function;
  }
}

const store = createStore<State, AnyAction, {}, {}>(
  reducer,
  compose(
    applyMiddleware(thunkMiddleware, waitUntilAction),
    window.__REDUX_DEVTOOLS_EXTENSION__
      ? window.__REDUX_DEVTOOLS_EXTENSION__()
      : (f: Function): Function => f,
  ),
);

export default store;

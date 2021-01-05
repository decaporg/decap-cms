import { createStore, applyMiddleware, AnyAction } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunkMiddleware, { ThunkMiddleware } from 'redux-thunk';
import { routerMiddleware } from 'connected-react-router';
import { waitUntilAction } from './middleware/waitUntilAction';
import createRootReducer from '../reducers/combinedReducer';
import history from '../routing/history';
import { State } from '../types/redux';
import { Reducer } from 'react';

const store = createStore<State | undefined, AnyAction, unknown, unknown>(
  (createRootReducer(history) as unknown) as Reducer<State | undefined, AnyAction>,
  composeWithDevTools(
    applyMiddleware(
      routerMiddleware(history),
      thunkMiddleware as ThunkMiddleware<State, AnyAction>,
      waitUntilAction,
    ),
  ),
);

export default store;

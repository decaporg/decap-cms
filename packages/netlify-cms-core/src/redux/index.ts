import type { AnyAction } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import type { ThunkMiddleware } from 'redux-thunk';
import thunkMiddleware from 'redux-thunk';
import { waitUntilAction } from './middleware/waitUntilAction';
import createRootReducer from '../reducers/combinedReducer';
import type { State } from '../types/redux';
import type { Reducer } from 'react';

const store = createStore<State | undefined, AnyAction, unknown, unknown>(
  createRootReducer() as unknown as Reducer<State | undefined, AnyAction>,
  composeWithDevTools(applyMiddleware(thunkMiddleware as ThunkMiddleware<State>, waitUntilAction)),
);

export { store };

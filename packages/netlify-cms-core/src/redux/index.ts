import { createStore, applyMiddleware, AnyAction } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunkMiddleware, { ThunkMiddleware } from 'redux-thunk';
import { waitUntilAction } from './middleware/waitUntilAction';
import createRootReducer from '../reducers/combinedReducer';
import { State } from '../types/redux';
import { Reducer } from 'react';

const store = createStore<State | undefined, AnyAction, unknown, unknown>(
  (createRootReducer() as unknown) as Reducer<State | undefined, AnyAction>,
  composeWithDevTools(applyMiddleware(thunkMiddleware as ThunkMiddleware<State>, waitUntilAction)),
);

export default store;

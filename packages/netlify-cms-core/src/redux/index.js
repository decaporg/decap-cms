import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import waitUntilAction from './middleware/waitUntilAction';
import reducer from 'Reducers/combinedReducer';
import dynostore, { dynamicReducers } from '@redux-dynostore/core';

const store = createStore(
  reducer,
  compose(
    dynostore(dynamicReducers()),
    applyMiddleware(thunkMiddleware, waitUntilAction),
    window.devToolsExtension ? window.devToolsExtension() : f => f,
  ),
);

export default store;

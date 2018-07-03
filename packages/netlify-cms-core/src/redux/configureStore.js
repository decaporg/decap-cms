import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import waitUntilAction from './middleware/waitUntilAction';
import reducer from 'Reducers/combinedReducer';

export default function configureStore(initialState) {
  const store = createStore(reducer, initialState, compose(
    applyMiddleware(thunkMiddleware, waitUntilAction),
    window.devToolsExtension ? window.devToolsExtension() : f => f
  ));

  return store;
}

import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { routerReducer } from 'react-router-redux';
import reducers from '../reducers';

const reducer = combineReducers({
  ...reducers,
  routing: routerReducer
});

const createStoreWithMiddleware = compose(
  applyMiddleware(thunkMiddleware),
  window.devToolsExtension ? window.devToolsExtension() : (f) => f
)(createStore);

export default (initialState) => (
  createStoreWithMiddleware(reducer, initialState)
);

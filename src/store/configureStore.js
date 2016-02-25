import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { browserHistory } from 'react-router';
import { syncHistory, routeReducer } from 'react-router-redux';
import { auth } from '../reducers/auth';
import { config } from '../reducers/config';
import { collections } from '../reducers/collections';

const reducer = combineReducers({
  auth,
  config,
  collections,
  router: routeReducer
});

const createStoreWithMiddleware = compose(
  applyMiddleware(thunkMiddleware, syncHistory(browserHistory)),
  window.devToolsExtension ? window.devToolsExtension() : (f) => f
)(createStore);

export default (initialState) => (
  createStoreWithMiddleware(reducer, initialState)
);

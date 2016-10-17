import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import optimist from 'redux-optimist';
import reducers from '.';

export default optimist(combineReducers({
  ...reducers,
  routing: routerReducer,
}));

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import reducers from '.';

export default combineReducers({
  ...reducers,
  routing: routerReducer,
});

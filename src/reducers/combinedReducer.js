import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as notifReducer } from 'redux-notifications';
import reducers from '.';

export default combineReducers({
  ...reducers,
  notifs: notifReducer,
  routing: routerReducer,
});

import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as notifReducer } from 'redux-notifications';
import optimist from 'redux-optimist';
import reducers from '.';

export default optimist(
  combineReducers({
    ...reducers,
    notifs: notifReducer,
    routing: routerReducer,
  }),
);

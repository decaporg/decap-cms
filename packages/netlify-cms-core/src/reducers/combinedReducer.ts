import { combineReducers } from 'redux';
import { reducer as notifReducer } from 'redux-notifications';
import reducers from './index';

function createRootReducer() {
  return combineReducers({
    ...reducers,
    notifs: notifReducer,
  });
}

export default createRootReducer;

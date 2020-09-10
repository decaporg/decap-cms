import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { reducer as notifReducer } from 'redux-notifications';
import reducers from './index';

const createRootReducer = history => {
  return combineReducers({
    ...reducers,
    notifs: notifReducer,
    router: connectRouter(history),
  });
};

export default createRootReducer;

import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { reducer as notifReducer } from 'redux-notifications';
import optimist from 'redux-optimist';
import reducers from './index';

const createRootReducer = history => {
  return optimist(
    combineReducers({
      ...reducers,
      notifs: notifReducer,
      router: connectRouter(history),
    }),
  );
};

export default createRootReducer;

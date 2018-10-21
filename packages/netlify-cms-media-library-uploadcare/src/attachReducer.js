import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as notifReducer } from 'redux-notifications';
import optimist from 'redux-optimist';
import coreReducers from 'netlify-cms-core/src/reducers';
import store from 'Redux';
import uploadcareReducer from './reducer';

export function attachReducer() {
  const allCoreReducers = {
    ...coreReducers,
    notifs: notifReducer,
    routing: routerReducer,
  }

  store.replaceReducer(
    optimist(
      combineReducers({
        ...allCoreReducers,
        uploadcare: uploadcareReducer,
      }),
    ),
  );
}

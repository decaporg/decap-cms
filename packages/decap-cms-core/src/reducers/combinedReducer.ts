import { combineReducers } from 'redux';

import reducers from './index';

function createRootReducer() {
  return combineReducers({
    ...reducers,
  });
}

export default createRootReducer;

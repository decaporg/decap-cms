import { combineReducers } from 'redux';

import snackbarReducer from '../store/slices/snackbars';
import reducers from './index';

function createRootReducer() {
  return combineReducers({
    ...reducers,
    snackbar: snackbarReducer,
  });
}

export default createRootReducer;

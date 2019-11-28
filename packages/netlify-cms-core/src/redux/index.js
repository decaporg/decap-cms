import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import waitUntilAction from './middleware/waitUntilAction';
import reducer from 'Reducers/combinedReducer';

const store = createStore(
  reducer,
  compose(
    applyMiddleware(thunkMiddleware, waitUntilAction),
    window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f,
  ),
);

export default store;

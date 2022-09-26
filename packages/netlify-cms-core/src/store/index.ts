import { configureStore } from '@reduxjs/toolkit';

import createRootReducer from '../reducers/combinedReducer';
import { waitUntilAction } from './middleware/waitUntilAction';

const store = configureStore({
  reducer: createRootReducer(),
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }).concat(waitUntilAction),
});

export { store };
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

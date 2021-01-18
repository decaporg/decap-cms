import { produce } from 'immer';
import { User } from 'netlify-cms-lib-util';
import {
  AUTH_REQUEST,
  AUTH_SUCCESS,
  AUTH_FAILURE,
  AUTH_REQUEST_DONE,
  LOGOUT,
  AuthAction,
} from '../actions/auth';

export type Auth = {
  isFetching: boolean;
  user: User | undefined;
  error: string | undefined;
};

export const defaultState: Auth = {
  isFetching: false,
  user: undefined,
  error: undefined,
};

const auth = produce((state: Auth, action: AuthAction) => {
  switch (action.type) {
    case AUTH_REQUEST:
      state.isFetching = true;
      break;
    case AUTH_SUCCESS:
      state.user = action.payload;
      break;
    case AUTH_FAILURE:
      state.error = action.payload && action.payload.toString();
      break;
    case AUTH_REQUEST_DONE:
      state.isFetching = false;
      break;
    case LOGOUT:
      state.user = undefined;
      state.isFetching = false;
  }
}, defaultState);

export default auth;

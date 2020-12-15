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

const auth = produce((draft: Auth, action: AuthAction) => {
  switch (action.type) {
    case AUTH_REQUEST:
      draft.isFetching = true;
      break;
    case AUTH_SUCCESS:
      draft.user = action.payload;
      break;
    case AUTH_FAILURE:
      draft.error = action.payload && action.payload.toString();
      break;
    case AUTH_REQUEST_DONE:
      draft.isFetching = false;
      break;
    case LOGOUT:
      draft.user = undefined;
      draft.isFetching = false;
  }
}, defaultState);

export default auth;

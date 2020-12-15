import { fromJS } from 'immutable';
import { User } from 'netlify-cms-lib-util';
import {
  AUTH_REQUEST,
  AUTH_SUCCESS,
  AUTH_FAILURE,
  AUTH_REQUEST_DONE,
  LOGOUT,
  AuthAction,
} from '../actions/auth';
import { StaticallyTypedRecord } from '../types/immutable';

export type Auth = StaticallyTypedRecord<{
  isFetching: boolean;
  user: StaticallyTypedRecord<User> | undefined;
  error: string | undefined;
}>;

export const defaultState = fromJS({
  isFetching: false,
  user: undefined,
  error: undefined,
}) as Auth;

const auth = (state = defaultState, action: AuthAction) => {
  switch (action.type) {
    case AUTH_REQUEST:
      return state.set('isFetching', true);
    case AUTH_SUCCESS:
      return state.set('user', fromJS(action.payload));
    case AUTH_FAILURE:
      return state.set('error', action.payload && action.payload.toString());
    case AUTH_REQUEST_DONE:
      return state.set('isFetching', false);
    case LOGOUT:
      return state.set('user', undefined).set('isFetching', false);
    default:
      return state;
  }
};

export default auth;

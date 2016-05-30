import Immutable from 'immutable';
import { AUTH_REQUEST, AUTH_SUCCESS, AUTH_FAILURE } from '../actions/auth';

export function auth(state = null, action) {
  switch (action.type) {
    case AUTH_REQUEST:
      return Immutable.Map({isFetching: true});
    case AUTH_SUCCESS:
      return Immutable.fromJS({user: action.payload});
    case AUTH_FAILURE:
      console.error(action.payload);
      return Immutable.Map({error: action.payload.toString()});
    default:
      return state;
  }
}

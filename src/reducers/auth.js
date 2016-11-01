import Immutable from 'immutable';
import { AUTH_REQUEST, AUTH_SUCCESS, AUTH_FAILURE, LOGOUT } from '../actions/auth';

const auth = (state = null, action) => {
  switch (action.type) {
    case AUTH_REQUEST:
      return Immutable.Map({ isFetching: true });
    case AUTH_SUCCESS:
      return Immutable.fromJS({ user: action.payload });
    case AUTH_FAILURE:
      return Immutable.Map({ error: action.payload.toString() });
    case LOGOUT:
      return state.remove('user');
    default:
      return state;
  }
};

export default auth;

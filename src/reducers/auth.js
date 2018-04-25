import Immutable from 'immutable';
import { AUTH_REQUEST, AUTH_SUCCESS, AUTH_FAILURE, AUTH_REQUEST_DONE, LOGOUT } from 'Actions/auth';

const auth = (state = null, action) => {
  switch (action.type) {
    case AUTH_REQUEST:
      return Immutable.Map({ isFetching: true });
    case AUTH_SUCCESS:
      return Immutable.fromJS({ user: action.payload });
    case AUTH_FAILURE:
      return Immutable.Map({ error: action.payload && action.payload.toString() });
    case AUTH_REQUEST_DONE:
      return state.remove('isFetching');
    case LOGOUT:
      return state.remove('user').remove('isFetching');
    default:
      return state;
  }
};

export default auth;

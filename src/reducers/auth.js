import Immutable from 'immutable';
import { AUTH_REQUEST, AUTH_SUCCESS, AUTH_FAILURE, AUTH_REQUEST_DONE, REAUTHENTICATE, LOGOUT } from '../actions/auth';

const auth = (state = Immutable.Map(), action) => {
  switch (action.type) {
    case AUTH_REQUEST:
      return state.set('isFetching', true);
    case AUTH_SUCCESS:
      return Immutable.fromJS({ user: action.payload });
    case AUTH_FAILURE:
      return state.withMutations(map => {
        map.set('error', action.payload.toString());
        map.remove('isFetching');
      });
    case AUTH_REQUEST_DONE:
      return state.remove('isFetching');
    case REAUTHENTICATE:
      return state.set('modal', true);
    case LOGOUT:
      return state.withMutations(map => {
        map.remove('user');
        map.remove('isFetching');
      });
    default:
      return state;
  }
};

export default auth;

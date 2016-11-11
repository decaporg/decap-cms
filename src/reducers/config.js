import Immutable from 'immutable';
import { CONFIG_REQUEST, CONFIG_SUCCESS, CONFIG_FAILURE } from '../actions/config';

const config = (state = null, action) => {
  switch (action.type) {
    case CONFIG_REQUEST:
      return Immutable.Map({ isFetching: true });
    case CONFIG_SUCCESS:
      return Immutable.fromJS(action.payload);
    case CONFIG_FAILURE:
      return Immutable.Map({ error: action.payload.toString() });
    default:
      return state;
  }
};

export default config;

import Immutable from 'immutable';
import { CONFIG } from '../actions/config';

export function config(state = null, action) {
  switch (action.type) {
    case CONFIG.REQUEST:
      return Immutable.Map({isFetching: true});
    case CONFIG.SUCCESS:
      return Immutable.fromJS(action.payload);
    case CONFIG.FAILURE:
      return Immutable.Map({error: action.payload.toString()});
    default:
      return state;
  }
}

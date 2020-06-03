import { Map, fromJS } from 'immutable';
import { AnyAction } from 'redux';
import { STATUS_REQUEST, STATUS_SUCCESS, STATUS_FAILURE } from '../actions/status';
import { Status } from '../types/redux';

export interface EntriesAction extends AnyAction {
  payload: { status: { auth: boolean }; error?: Error };
}

const status = (state = Map(), action: EntriesAction) => {
  switch (action.type) {
    case STATUS_REQUEST:
      return state.set('isFetching', true);
    case STATUS_SUCCESS:
      return state.withMutations(map => {
        map.set('isFetching', false);
        map.set('status', fromJS(action.payload.status));
      });
    case STATUS_FAILURE:
      return state.withMutations(map => {
        map.set('isFetching', false);
        map.set('error', action.payload.error);
      });
    default:
      return state;
  }
};

export const selectStatus = (status: Status) => {
  return status.get('status')?.toJS() || {};
};

export default status;

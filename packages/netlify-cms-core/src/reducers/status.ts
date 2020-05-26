import { Map } from 'immutable';
import { AnyAction } from 'redux';
import { STATUS_SUCCESS } from '../actions/status';

export interface EntriesAction extends AnyAction {
  payload: { status: { auth: boolean } };
}

const status = (state = Map(), action: EntriesAction) => {
  switch (action.type) {
    case STATUS_SUCCESS:
      return Map(action.payload.status);
    default:
      return state;
  }
};

export default status;

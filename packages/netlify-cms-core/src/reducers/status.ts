import { fromJS } from 'immutable';
import { STATUS_REQUEST, STATUS_SUCCESS, STATUS_FAILURE, StatusAction } from '../actions/status';
import { StaticallyTypedRecord } from '../types/immutable';

export type Status = StaticallyTypedRecord<{
  isFetching: boolean;
  status: StaticallyTypedRecord<{
    auth: StaticallyTypedRecord<{ status: boolean }>;
    api: StaticallyTypedRecord<{ status: boolean; statusPage: string }>;
  }>;
  error: Error | undefined;
}>;

const defaultState = fromJS({
  isFetching: false,
  status: {
    auth: { status: true },
    api: { status: true, statusPage: '' },
  },
  error: undefined,
}) as Status;

const status = (state = defaultState, action: StatusAction) => {
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
  return status.get('status').toJS();
};

export default status;

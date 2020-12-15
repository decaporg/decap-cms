import { produce } from 'immer';
import { STATUS_REQUEST, STATUS_SUCCESS, STATUS_FAILURE, StatusAction } from '../actions/status';

export type Status = {
  isFetching: boolean;
  status: {
    auth: { status: boolean };
    api: { status: boolean; statusPage: string };
  };
  error: Error | undefined;
};

const defaultState: Status = {
  isFetching: false,
  status: {
    auth: { status: true },
    api: { status: true, statusPage: '' },
  },
  error: undefined,
};

const status = produce((draft: Status, action: StatusAction) => {
  switch (action.type) {
    case STATUS_REQUEST:
      draft.isFetching = true;
      break;
    case STATUS_SUCCESS:
      draft.isFetching = false;
      draft.status = action.payload.status;
      break;
    case STATUS_FAILURE:
      draft.isFetching = false;
      draft.error = action.payload.error;
  }
}, defaultState);

export default status;

import { State } from '../types/redux';
import { currentBackend } from '../backend';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';

export const STATUS_REQUEST = 'STATUS_REQUEST';
export const STATUS_SUCCESS = 'STATUS_SUCCESS';
export const STATUS_FAILURE = 'STATUS_FAILURE';

export function statusRequest() {
  return {
    type: STATUS_REQUEST,
  };
}

export function statusSuccess(status: { auth: boolean }) {
  return {
    type: STATUS_SUCCESS,
    payload: { status },
  };
}

export function statusFailure(error: Error) {
  return {
    type: STATUS_FAILURE,
    error,
  };
}

export function checkBackendStatus() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      dispatch(statusRequest());
      const state = getState();
      const backend = currentBackend(state.config);
      const status = await backend.status();
      dispatch(statusSuccess(status));
    } catch (error) {
      dispatch(statusFailure(error));
    }
  };
}

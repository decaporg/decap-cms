import { currentBackend } from '../backend';
import { addSnackbar, removeSnackbarById } from '../store/slices/snackbars';

import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { State } from '../types/redux';

export const STATUS_REQUEST = 'STATUS_REQUEST';
export const STATUS_SUCCESS = 'STATUS_SUCCESS';
export const STATUS_FAILURE = 'STATUS_FAILURE';

export function statusRequest() {
  return {
    type: STATUS_REQUEST,
  } as const;
}

export function statusSuccess(status: {
  auth: { status: boolean };
  api: { status: boolean; statusPage: string };
}) {
  return {
    type: STATUS_SUCCESS,
    payload: { status },
  } as const;
}

export function statusFailure(error: Error) {
  return {
    type: STATUS_FAILURE,
    payload: { error },
  } as const;
}

export function checkBackendStatus() {
  return async (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    try {
      const state = getState();
      if (state.status.isFetching) {
        return;
      }

      dispatch(statusRequest());
      const backend = currentBackend(state.config);
      const status = await backend.status();

      const backendDownKey = 'ui.toast.onBackendDown';
      const previousBackendDownNotifs = state.snackbar.messages.filter(
        n => n.message?.key === backendDownKey,
      );

      if (status.api.status === false) {
        if (previousBackendDownNotifs.length === 0) {
          dispatch(
            addSnackbar({
              type: 'error',
              message: { key: 'ui.toast.onBackendDown', details: status.api.statusPage },
            }),
          );
        }
        return dispatch(statusSuccess(status));
      } else if (status.api.status === true && previousBackendDownNotifs.length > 0) {
        // If backend is up, clear all the danger messages
        previousBackendDownNotifs.forEach(notif => {
          dispatch(removeSnackbarById(notif.id));
        });
      }

      const authError = status.auth.status === false;
      if (authError) {
        const key = 'ui.toast.onLoggedOut';
        const existingNotification = state.snackbar.messages.find(n => n.message?.key === key);
        if (!existingNotification) {
          dispatch(
            addSnackbar({
              type: 'error',
              message: { key: 'ui.toast.onLoggedOut' },
            }),
          );
        }
      }

      dispatch(statusSuccess(status));
    } catch (error: any) {
      dispatch(statusFailure(error));
    }
  };
}

export type StatusAction = ReturnType<
  typeof statusRequest | typeof statusSuccess | typeof statusFailure
>;

import { actions as notifActions } from 'redux-notifications';

import { currentBackend } from '../backend';

import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { State } from '../types/redux';

const { notifSend, notifDismiss } = notifActions;

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
      const previousBackendDownNotifs = state.notifs.filter(n => n.message?.key === backendDownKey);

      if (status.api.status === false) {
        if (previousBackendDownNotifs.length === 0) {
          dispatch(
            notifSend({
              message: {
                details: status.api.statusPage,
                key: 'ui.toast.onBackendDown',
              },
              kind: 'danger',
            }),
          );
        }
        return dispatch(statusSuccess(status));
      } else if (status.api.status === true && previousBackendDownNotifs.length > 0) {
        // If backend is up, clear all the danger messages
        previousBackendDownNotifs.forEach(notif => {
          dispatch(notifDismiss(notif.id));
        });
      }

      const authError = status.auth.status === false;
      if (authError) {
        const key = 'ui.toast.onLoggedOut';
        const existingNotification = state.notifs.find(n => n.message?.key === key);
        if (!existingNotification) {
          dispatch(
            notifSend({
              message: {
                key: 'ui.toast.onLoggedOut',
              },
              kind: 'danger',
            }),
          );
        }
      }

      dispatch(statusSuccess(status));
    } catch (error) {
      dispatch(statusFailure(error));
    }
  };
}

export type StatusAction = ReturnType<
  typeof statusRequest | typeof statusSuccess | typeof statusFailure
>;

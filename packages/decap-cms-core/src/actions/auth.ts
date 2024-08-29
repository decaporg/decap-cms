import { currentBackend } from '../backend';
import { addNotification, clearNotifications } from './notifications';

import type { Credentials, User } from 'decap-cms-lib-util';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { State } from '../types/redux';

export const AUTH_REQUEST = 'AUTH_REQUEST';
export const AUTH_SUCCESS = 'AUTH_SUCCESS';
export const AUTH_FAILURE = 'AUTH_FAILURE';
export const AUTH_REQUEST_DONE = 'AUTH_REQUEST_DONE';
export const USE_OPEN_AUTHORING = 'USE_OPEN_AUTHORING';
export const LOGOUT = 'LOGOUT';

export function authenticating() {
  return {
    type: AUTH_REQUEST,
  } as const;
}

export function authenticate(userData: User) {
  return {
    type: AUTH_SUCCESS,
    payload: userData,
  } as const;
}

export function authError(error: Error) {
  return {
    type: AUTH_FAILURE,
    error: 'Failed to authenticate',
    payload: error,
  } as const;
}

export function doneAuthenticating() {
  return {
    type: AUTH_REQUEST_DONE,
  } as const;
}

export function useOpenAuthoring() {
  return {
    type: USE_OPEN_AUTHORING,
  } as const;
}

export function logout() {
  return {
    type: LOGOUT,
  } as const;
}

// Check if user data token is cached and is valid
export function authenticateUser() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(authenticating());
    return Promise.resolve(backend.currentUser())
      .then(user => {
        if (user) {
          if (user.useOpenAuthoring) {
            dispatch(useOpenAuthoring());
          }
          dispatch(authenticate(user));
        } else {
          dispatch(doneAuthenticating());
        }
      })
      .catch((error: Error) => {
        dispatch(authError(error));
        dispatch(logoutUser());
      });
  };
}

export function loginUser(credentials: Credentials) {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(authenticating());
    return backend
      .authenticate(credentials)
      .then(user => {
        if (user.useOpenAuthoring) {
          dispatch(useOpenAuthoring());
        }
        dispatch(authenticate(user));
      })
      .catch((error: Error) => {
        console.error(error);
        dispatch(
          addNotification({
            message: {
              details: error.message,
              key: 'ui.toast.onFailToAuth',
            },
            type: 'error',
            dismissAfter: 8000,
          }),
        );
        dispatch(authError(error));
      });
  };
}

export function logoutUser() {
  return (dispatch: ThunkDispatch<State, {}, AnyAction>, getState: () => State) => {
    const state = getState();
    const backend = currentBackend(state.config);
    Promise.resolve(backend.logout()).then(() => {
      dispatch(logout());
      dispatch(clearNotifications());
    });
  };
}

export type AuthAction = ReturnType<
  | typeof authenticating
  | typeof authenticate
  | typeof authError
  | typeof doneAuthenticating
  | typeof logout
>;

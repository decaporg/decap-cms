import { currentBackend } from '../backends/backend';

export const AUTH_REQUEST = 'AUTH_REQUEST';
export const AUTH_SUCCESS = 'AUTH_SUCCESS';
export const AUTH_FAILURE = 'AUTH_FAILURE';
export const LOGOUT = 'LOGOUT';

export function authenticating() {
  return {
    type: AUTH_REQUEST,
  };
}

export function authenticate(userData) {
  return {
    type: AUTH_SUCCESS,
    payload: userData,
  };
}

export function authError(error) {
  return {
    type: AUTH_FAILURE,
    error: 'Failed to authenticate',
    payload: error,
  };
}

export function logout() {
  return {
    type: LOGOUT,
  };
}

// Check if user data token is cached and is valid
export function authenticateUser() {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    dispatch(authenticating());
    return backend.currentUser()
      .then((user) => {
        if (user) dispatch(authenticate(user));
      })
      .catch((error) => {
        dispatch(authError(error));
        dispatch(logoutUser());
      });
  };
}

export function loginUser(credentials) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);

    dispatch(authenticating());
    return backend.authenticate(credentials)
      .then((user) => {
        dispatch(authenticate(user));
      })
      .catch((error) => {
        dispatch(authError(error));
      });
  };
}

export function logoutUser() {
  return (dispatch, getState) => {
    const state = getState();
    const backend = currentBackend(state.config);
    backend.logout();
    dispatch(logout());
  };
}

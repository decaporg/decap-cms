"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.USE_OPEN_AUTHORING = exports.LOGOUT = exports.AUTH_SUCCESS = exports.AUTH_REQUEST_DONE = exports.AUTH_REQUEST = exports.AUTH_FAILURE = void 0;
exports.authError = authError;
exports.authenticate = authenticate;
exports.authenticateUser = authenticateUser;
exports.authenticating = authenticating;
exports.doneAuthenticating = doneAuthenticating;
exports.loginUser = loginUser;
exports.logout = logout;
exports.logoutUser = logoutUser;
exports.useOpenAuthoring = useOpenAuthoring;
var _backend = require("../backend");
var _notifications = require("./notifications");
const AUTH_REQUEST = 'AUTH_REQUEST';
exports.AUTH_REQUEST = AUTH_REQUEST;
const AUTH_SUCCESS = 'AUTH_SUCCESS';
exports.AUTH_SUCCESS = AUTH_SUCCESS;
const AUTH_FAILURE = 'AUTH_FAILURE';
exports.AUTH_FAILURE = AUTH_FAILURE;
const AUTH_REQUEST_DONE = 'AUTH_REQUEST_DONE';
exports.AUTH_REQUEST_DONE = AUTH_REQUEST_DONE;
const USE_OPEN_AUTHORING = 'USE_OPEN_AUTHORING';
exports.USE_OPEN_AUTHORING = USE_OPEN_AUTHORING;
const LOGOUT = 'LOGOUT';
exports.LOGOUT = LOGOUT;
function authenticating() {
  return {
    type: AUTH_REQUEST
  };
}
function authenticate(userData) {
  return {
    type: AUTH_SUCCESS,
    payload: userData
  };
}
function authError(error) {
  return {
    type: AUTH_FAILURE,
    error: 'Failed to authenticate',
    payload: error
  };
}
function doneAuthenticating() {
  return {
    type: AUTH_REQUEST_DONE
  };
}
function useOpenAuthoring() {
  return {
    type: USE_OPEN_AUTHORING
  };
}
function logout() {
  return {
    type: LOGOUT
  };
}

// Check if user data token is cached and is valid
function authenticateUser() {
  return (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    dispatch(authenticating());
    return Promise.resolve(backend.currentUser()).then(user => {
      if (user) {
        if (user.useOpenAuthoring) {
          dispatch(useOpenAuthoring());
        }
        dispatch(authenticate(user));
      } else {
        dispatch(doneAuthenticating());
      }
    }).catch(error => {
      dispatch(authError(error));
      dispatch(logoutUser());
    });
  };
}
function loginUser(credentials) {
  return (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    dispatch(authenticating());
    return backend.authenticate(credentials).then(user => {
      if (user.useOpenAuthoring) {
        dispatch(useOpenAuthoring());
      }
      dispatch(authenticate(user));
    }).catch(error => {
      console.error(error);
      dispatch((0, _notifications.addNotification)({
        message: {
          details: error.message,
          key: 'ui.toast.onFailToAuth'
        },
        type: 'error',
        dismissAfter: 8000
      }));
      dispatch(authError(error));
    });
  };
}
function logoutUser() {
  return (dispatch, getState) => {
    const state = getState();
    const backend = (0, _backend.currentBackend)(state.config);
    Promise.resolve(backend.logout()).then(() => {
      dispatch(logout());
      dispatch((0, _notifications.clearNotifications)());
    });
  };
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.STATUS_SUCCESS = exports.STATUS_REQUEST = exports.STATUS_FAILURE = void 0;
exports.checkBackendStatus = checkBackendStatus;
exports.statusFailure = statusFailure;
exports.statusRequest = statusRequest;
exports.statusSuccess = statusSuccess;
var _backend = require("../backend");
var _notifications = require("./notifications");
const STATUS_REQUEST = 'STATUS_REQUEST';
exports.STATUS_REQUEST = STATUS_REQUEST;
const STATUS_SUCCESS = 'STATUS_SUCCESS';
exports.STATUS_SUCCESS = STATUS_SUCCESS;
const STATUS_FAILURE = 'STATUS_FAILURE';
exports.STATUS_FAILURE = STATUS_FAILURE;
function statusRequest() {
  return {
    type: STATUS_REQUEST
  };
}
function statusSuccess(status) {
  return {
    type: STATUS_SUCCESS,
    payload: {
      status
    }
  };
}
function statusFailure(error) {
  return {
    type: STATUS_FAILURE,
    payload: {
      error
    }
  };
}
function checkBackendStatus() {
  return async (dispatch, getState) => {
    try {
      const state = getState();
      if (state.status.isFetching) {
        return;
      }
      dispatch(statusRequest());
      const backend = (0, _backend.currentBackend)(state.config);
      const status = await backend.status();
      const backendDownKey = 'ui.toast.onBackendDown';
      const previousBackendDownNotifications = state.notifications.notifications.filter(n => {
        var _n$message;
        return typeof n.message != 'string' && ((_n$message = n.message) === null || _n$message === void 0 ? void 0 : _n$message.key) === backendDownKey;
      });
      if (status.api.status === false) {
        if (previousBackendDownNotifications.length === 0) {
          dispatch((0, _notifications.addNotification)({
            message: {
              details: status.api.statusPage,
              key: 'ui.toast.onBackendDown'
            },
            type: 'error'
          }));
        }
        return dispatch(statusSuccess(status));
      } else if (status.api.status === true && previousBackendDownNotifications.length > 0) {
        // If backend is up, clear all the danger messages
        previousBackendDownNotifications.forEach(notification => {
          dispatch((0, _notifications.dismissNotification)(notification.id));
        });
      }
      const authError = status.auth.status === false;
      if (authError) {
        const key = 'ui.toast.onLoggedOut';
        const existingNotification = state.notifications.notifications.find(n => {
          var _n$message2;
          return typeof n.message != 'string' && ((_n$message2 = n.message) === null || _n$message2 === void 0 ? void 0 : _n$message2.key) === key;
        });
        if (!existingNotification) {
          dispatch((0, _notifications.addNotification)({
            message: {
              key: 'ui.toast.onLoggedOut'
            },
            type: 'error'
          }));
        }
      }
      dispatch(statusSuccess(status));
    } catch (error) {
      dispatch(statusFailure(error));
    }
  };
}
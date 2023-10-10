"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NOTIFICATION_SEND = exports.NOTIFICATION_DISMISS = exports.NOTIFICATIONS_CLEAR = void 0;
exports.addNotification = addNotification;
exports.clearNotifications = clearNotifications;
exports.dismissNotification = dismissNotification;
const NOTIFICATION_SEND = 'NOTIFICATION_SEND';
exports.NOTIFICATION_SEND = NOTIFICATION_SEND;
const NOTIFICATION_DISMISS = 'NOTIFICATION_DISMISS';
exports.NOTIFICATION_DISMISS = NOTIFICATION_DISMISS;
const NOTIFICATIONS_CLEAR = 'NOTIFICATION_CLEAR';
exports.NOTIFICATIONS_CLEAR = NOTIFICATIONS_CLEAR;
function addNotification(notification) {
  return {
    type: NOTIFICATION_SEND,
    payload: notification
  };
}
function dismissNotification(id) {
  return {
    type: NOTIFICATION_DISMISS,
    id
  };
}
function clearNotifications() {
  return {
    type: NOTIFICATIONS_CLEAR
  };
}
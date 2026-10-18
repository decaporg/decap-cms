import type { TypeOptions } from 'react-toastify';

export interface NotificationMessage {
  details?: unknown;
  key: string;
  /** Further values are interpolations for the translator, e.g. `%{entry}`. */
  [interpolation: string]: unknown;
}

/** An action the notification offers, rendered as a link in the toast. */
export interface NotificationLink {
  url: string;
  label: string | NotificationMessage;
}

export interface NotificationPayload {
  message: string | NotificationMessage;
  /** `false` keeps the toast up until dismissed; omitting it uses react-toastify's default. */
  dismissAfter?: number | false;
  type: TypeOptions | undefined;
  link?: NotificationLink;
  /** Shows a spinner in place of the type icon, for work still in progress. */
  spinner?: boolean;
  /** For a caller that will update this notification and needs its id up front. */
  id?: string;
}

export const NOTIFICATION_SEND = 'NOTIFICATION_SEND';
export const NOTIFICATION_UPDATE = 'NOTIFICATION_UPDATE';
export const NOTIFICATION_DISMISS = 'NOTIFICATION_DISMISS';
export const NOTIFICATIONS_CLEAR = 'NOTIFICATION_CLEAR';

function addNotification(notification: NotificationPayload) {
  return { type: NOTIFICATION_SEND, payload: notification };
}

/**
 * Changes a notification on screen instead of stacking a new one. A no-op for
 * an unknown id, e.g. a toast the user already dismissed.
 */
function updateNotification(id: string, notification: Partial<NotificationPayload>) {
  return { type: NOTIFICATION_UPDATE, id, payload: notification };
}

function dismissNotification(id: string) {
  return { type: NOTIFICATION_DISMISS, id };
}

function clearNotifications() {
  return { type: NOTIFICATIONS_CLEAR };
}

export type NotificationsAction = {
  type:
    | typeof NOTIFICATION_DISMISS
    | typeof NOTIFICATION_SEND
    | typeof NOTIFICATION_UPDATE
    | typeof NOTIFICATIONS_CLEAR;
  payload?: NotificationPayload | Partial<NotificationPayload>;
  id?: string;
};

export { addNotification, updateNotification, dismissNotification, clearNotifications };

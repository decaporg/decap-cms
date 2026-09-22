import type { TypeOptions } from 'react-toastify';

export interface NotificationMessage {
  details?: unknown;
  key: string;
  /**
   * Any further values are handed to the translator as interpolations, so a
   * phrase can say `%{entry}` or `%{count}`. The component already spreads the
   * whole message into `t()`; this only makes that contract expressible.
   */
  [interpolation: string]: unknown;
}

/** An action the notification offers, rendered as a link in the toast. */
export interface NotificationLink {
  url: string;
  label: string | NotificationMessage;
}

export interface NotificationPayload {
  message: string | NotificationMessage;
  /**
   * `false` keeps the toast up until something dismisses it — distinct from
   * omitting it, which leaves react-toastify's own default in place. Needed by
   * any notification that is going to be updated later rather than replaced.
   */
  dismissAfter?: number | false;
  type: TypeOptions | undefined;
  link?: NotificationLink;
  /** Shows a spinner in place of the type icon, for work still in progress. */
  spinner?: boolean;
  /**
   * Supplied only by a caller that intends to update this notification later,
   * which needs to know the id before the reducer would mint one.
   */
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
 * Changes a notification already on screen instead of stacking a new one next
 * to it — for a single toast that follows a job through its stages.
 *
 * A no-op when the id is unknown, which is the ordinary outcome of the user
 * having dismissed the toast mid-job.
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
